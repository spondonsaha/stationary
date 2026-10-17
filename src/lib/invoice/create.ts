import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  customers,
  invoiceItems,
  invoices,
  orderItems,
  orders,
  payments,
  products,
  stockMovements,
} from "@/lib/db/schema";
import { nextInvoiceNumber } from "./number";
import { randomToken } from "@/lib/auth/password";
import { computeTotals, lineTotal } from "@/lib/cart/totals";
import { shopConfig } from "@/lib/config";

const DUE_DAYS = 14;

export type CustomerType = "guest" | "student" | "faculty_staff" | "department";
export type Fulfillment = "pickup" | "campus_delivery";
export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "mobile_payment"
  | "department_account"
  | "other";

/** Identity/billing details gathered at checkout or by staff. */
export type CustomerInput = {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  type?: CustomerType;
  studentId?: string | null;
  departmentId?: string | null;
  faculty?: string | null;
  poNumber?: string | null;
  fulfillment?: Fulfillment;
  paymentMethod?: PaymentMethod;
  notes?: string | null;
};

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class StockError extends Error {
  constructor(public productName: string, public available: number) {
    super(`Insufficient stock for ${productName}`);
    this.name = "StockError";
  }
}

export class PriceError extends Error {
  constructor(public productName: string) {
    super(`Product no longer available: ${productName}`);
    this.name = "PriceError";
  }
}

export type LineInput = {
  productId: string | null;
  quantity: number;
  /** Optional override (admin manual invoice); ignored when productId resolves. */
  unitPrice?: number;
};

export type CreateInvoiceResult = {
  invoiceId: string;
  invoiceNumber: string;
  publicToken: string;
  orderId: string | null;
  customerId: string;
  total: number;
};

async function resolveCustomer(tx: Tx, data: CustomerInput) {
  const email = data.email.toLowerCase();
  const identity = {
    type: data.type ?? "guest",
    studentId: data.studentId || null,
    departmentId: data.departmentId || null,
    faculty: data.faculty || null,
  };
  const existing = await tx
    .select()
    .from(customers)
    .where(eq(sql`lower(${customers.email})`, email))
    .limit(1);

  if (existing[0]) {
    const [updated] = await tx
      .update(customers)
      .set({
        name: data.name,
        phone: data.phone || existing[0].phone,
        address: data.address || existing[0].address,
        type: data.type ?? existing[0].type,
        studentId: data.studentId || existing[0].studentId,
        departmentId: data.departmentId || existing[0].departmentId,
        faculty: data.faculty || existing[0].faculty,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, existing[0].id))
      .returning();
    return updated!;
  }

  const [created] = await tx
    .insert(customers)
    .values({
      name: data.name,
      email,
      phone: data.phone || null,
      address: data.address || null,
      ...identity,
    })
    .returning();
  return created!;
}

/**
 * Stock decrement inside the caller's transaction. Uses a conditional UPDATE
 * so two concurrent invoices can never oversell the same row.
 * Returns the resulting stock so callers can write a ledger entry.
 */
async function decrementStock(
  tx: Tx,
  productId: string,
  quantity: number,
  productName: string,
): Promise<number> {
  const updated = await tx
    .update(products)
    .set({ stock: sql`stock - ${quantity}`, updatedAt: new Date() })
    .where(sql`${products.id} = ${productId} AND ${products.stock} >= ${quantity}`)
    .returning({ id: products.id, stock: products.stock });

  if (updated.length === 0) {
    const [current] = await tx
      .select({ stock: products.stock })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    throw new StockError(productName, current?.stock ?? 0);
  }
  return updated[0].stock;
}

/** Append a signed entry to the stock ledger. */
async function recordMovement(
  tx: Tx,
  data: {
    productId: string;
    delta: number;
    balanceAfter: number;
    reason: "sale" | "restock" | "adjustment" | "return" | "initial";
    referenceType?: string;
    referenceId?: string | null;
    note?: string | null;
  },
) {
  await tx.insert(stockMovements).values({
    productId: data.productId,
    delta: data.delta,
    balanceAfter: data.balanceAfter,
    reason: data.reason,
    referenceType: data.referenceType ?? null,
    referenceId: data.referenceId ?? null,
    note: data.note ?? null,
  });
}

function invoiceStatusFor(amountPaid: number, total: number, forced?: "paid" | "unpaid" | "partial") {
  if (forced === "unpaid") return "unpaid" as const;
  if (forced === "paid") return "paid" as const;
  if (forced === "partial") return "partial" as const;
  if (amountPaid <= 0) return "unpaid" as const;
  if (amountPaid + 0.009 >= total) return "paid" as const;
  return "partial" as const;
}

/* ------------------------------------------------------------------ */
/* Checkout: cart -> confirmed order + invoice, one transaction        */
/* ------------------------------------------------------------------ */

export async function createOrderWithInvoice(input: {
  customer: CustomerInput;
  lines: LineInput[];
}): Promise<CreateInvoiceResult> {
  return db.transaction(async (tx) => {
    // 1. Resolve products & lock in current prices (never trust client prices).
    const priced = [];
    for (const line of input.lines) {
      if (!line.productId) throw new PriceError("Unknown product");
      const [prod] = await tx
        .select()
        .from(products)
        .where(eq(products.id, line.productId))
        .limit(1);
      if (!prod || prod.status !== "active") throw new PriceError(line.productId);
      priced.push({
        productId: prod.id,
        name: prod.name,
        quantity: line.quantity,
        unitPrice: Number(prod.price),
      });
    }

    const totals = computeTotals({
      lines: priced.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
    });

    const customerType = input.customer.type ?? "guest";
    const fulfillment = input.customer.fulfillment ?? "pickup";
    const paymentMethod = input.customer.paymentMethod ?? "cash";

    // 2. Customer upsert.
    const customer = await resolveCustomer(tx, input.customer);

    // 3. Order + items.
    const createdAt = new Date();
    const [order] = await tx
      .insert(orders)
      .values({
        customerId: customer.id,
        status: "confirmed",
        customerType,
        departmentId: customer.departmentId,
        poNumber: input.customer.poNumber || null,
        fulfillment,
        preferredPaymentMethod: paymentMethod,
        notes: input.customer.notes || null,
        subtotal: totals.subtotal.toFixed(2),
        discount: totals.discount.toFixed(2),
        tax: totals.tax.toFixed(2),
        total: totals.total.toFixed(2),
        invoiceToken: randomToken(24),
      })
      .returning();

    await tx.insert(orderItems).values(
      priced.map((l) => ({
        orderId: order.id,
        productId: l.productId,
        productName: l.name,
        quantity: l.quantity,
        unitPrice: l.unitPrice.toFixed(2),
        lineTotal: lineTotal(l.unitPrice, l.quantity).toFixed(2),
      })),
    );

    // 4. Invoice with price snapshots.
    const invoiceNumber = await nextInvoiceNumber(tx, createdAt);
    const [invoice] = await tx
      .insert(invoices)
      .values({
        invoiceNumber,
        orderId: order.id,
        customerId: customer.id,
        publicToken: randomToken(24),
        status: "unpaid",
        issueDate: isoDate(createdAt),
        dueDate: isoDate(new Date(createdAt.getTime() + DUE_DAYS * 86400000)),
        customerType,
        departmentId: customer.departmentId,
        poNumber: input.customer.poNumber || null,
        fulfillment,
        notes: input.customer.notes || null,
        customerNameSnapshot: customer.name,
        subtotal: totals.subtotal.toFixed(2),
        discount: totals.discount.toFixed(2),
        taxRate: String(shopConfig.taxRatePercent),
        tax: totals.tax.toFixed(2),
        total: totals.total.toFixed(2),
        amountPaid: "0.00",
        stockDecremented: false,
      })
      .returning();

    await tx.insert(invoiceItems).values(
      priced.map((l) => ({
        invoiceId: invoice.id,
        productId: l.productId,
        productName: l.name,
        quantity: l.quantity,
        unitPrice: l.unitPrice.toFixed(2),
        lineTotal: lineTotal(l.unitPrice, l.quantity).toFixed(2),
      })),
    );

    // 5. Stock — same transaction, so a failure rolls the order back too.
    for (const l of priced) {
      const balanceAfter = await decrementStock(tx, l.productId, l.quantity, l.name);
      await recordMovement(tx, {
        productId: l.productId,
        delta: -l.quantity,
        balanceAfter,
        reason: "sale",
        referenceType: "order",
        referenceId: order.id,
      });
    }
    await tx
      .update(invoices)
      .set({ stockDecremented: true })
      .where(eq(invoices.id, invoice.id));

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      publicToken: invoice.publicToken,
      orderId: order.id,
      customerId: customer.id,
      total: totals.total,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Manual (walk-in) invoice — admin                                    */
/* ------------------------------------------------------------------ */

export async function createManualInvoice(input: {
  customer: CustomerInput;
  notes?: string | null;
  discount: number;
  lines: {
    productId: string | null;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
  payment: { status: "paid" | "partial" | "unpaid"; amount: number; method?: PaymentMethod };
}): Promise<CreateInvoiceResult> {
  return db.transaction(async (tx) => {
    const totals = computeTotals({
      lines: input.lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
      discount: input.discount,
    });

    const customerType = input.customer.type ?? "guest";
    const fulfillment = input.customer.fulfillment ?? "pickup";

    const customer = await resolveCustomer(tx, {
      ...input.customer,
      type: customerType,
      fulfillment,
    });

    const createdAt = new Date();
    const invoiceNumber = await nextInvoiceNumber(tx, createdAt);
    const amountPaid =
      input.payment.status === "unpaid"
        ? 0
        : input.payment.status === "paid"
          ? totals.total
          : Math.min(input.payment.amount, totals.total);

    const [invoice] = await tx
      .insert(invoices)
      .values({
        invoiceNumber,
        customerId: customer.id,
        publicToken: randomToken(24),
        status: invoiceStatusFor(amountPaid, totals.total, input.payment.status),
        issueDate: isoDate(createdAt),
        dueDate: isoDate(new Date(createdAt.getTime() + DUE_DAYS * 86400000)),
        customerType,
        departmentId: customer.departmentId,
        poNumber: input.customer.poNumber || null,
        fulfillment,
        notes: input.notes || null,
        customerNameSnapshot: customer.name,
        subtotal: totals.subtotal.toFixed(2),
        discount: totals.discount.toFixed(2),
        taxRate: String(shopConfig.taxRatePercent),
        tax: totals.tax.toFixed(2),
        total: totals.total.toFixed(2),
        amountPaid: amountPaid.toFixed(2),
        stockDecremented: false,
      })
      .returning();

    await tx.insert(invoiceItems).values(
      input.lines.map((l) => ({
        invoiceId: invoice.id,
        productId: l.productId,
        productName: l.productName,
        quantity: l.quantity,
        unitPrice: l.unitPrice.toFixed(2),
        lineTotal: lineTotal(l.unitPrice, l.quantity).toFixed(2),
      })),
    );

    // Stock for known products (free-text lines skip stock tracking).
    for (const l of input.lines) {
      if (l.productId) {
        const balanceAfter = await decrementStock(tx, l.productId, l.quantity, l.productName);
        await recordMovement(tx, {
          productId: l.productId,
          delta: -l.quantity,
          balanceAfter,
          reason: "sale",
          referenceType: "invoice",
          referenceId: invoice.id,
        });
      }
    }
    await tx
      .update(invoices)
      .set({ stockDecremented: true })
      .where(eq(invoices.id, invoice.id));

    if (amountPaid > 0) {
      await tx.insert(payments).values({
        invoiceId: invoice.id,
        amount: amountPaid.toFixed(2),
        method: input.payment.method ?? "cash",
        notes: input.payment.status === "partial" ? "Partial payment" : null,
      });
    }

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      publicToken: invoice.publicToken,
      orderId: null,
      customerId: customer.id,
      total: totals.total,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Admin places an order on behalf of a customer                       */
/* ------------------------------------------------------------------ */

export async function createAdminOrder(input: {
  /** Existing customer to attribute the order to (optional). */
  customerId?: string | null;
  customer: CustomerInput;
  discount: number;
  /** Only productId + quantity; unit prices are locked from the catalog. */
  lines: { productId: string; quantity: number }[];
  payment: { status: "paid" | "partial" | "unpaid"; amount: number; method?: PaymentMethod };
}): Promise<CreateInvoiceResult> {
  if (input.lines.length === 0) throw new PriceError("No items in order");

  return db.transaction(async (tx) => {
    // 1. Lock current catalog prices (never trust client prices).
    const priced: { productId: string; name: string; quantity: number; unitPrice: number }[] = [];
    for (const line of input.lines) {
      const [prod] = await tx
        .select()
        .from(products)
        .where(eq(products.id, line.productId))
        .limit(1);
      if (!prod || prod.status !== "active") throw new PriceError(line.productId);
      priced.push({
        productId: prod.id,
        name: prod.name,
        quantity: line.quantity,
        unitPrice: Number(prod.price),
      });
    }

    const totals = computeTotals({
      lines: priced.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
      discount: input.discount,
    });

    const customerType = input.customer.type ?? "guest";
    const fulfillment = input.customer.fulfillment ?? "pickup";
    const paymentMethod = input.customer.paymentMethod ?? "cash";

    // 2. Customer — attribute to an existing row, or upsert by email.
    let customer;
    if (input.customerId) {
      const [existing] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, input.customerId))
        .limit(1);
      if (!existing) throw new PriceError("Unknown customer");
      const [updated] = await tx
        .update(customers)
        .set({
          name: input.customer.name,
          phone: input.customer.phone || existing.phone,
          address: input.customer.address || existing.address,
          type: input.customer.type ?? existing.type,
          studentId: input.customer.studentId || existing.studentId,
          departmentId: input.customer.departmentId || existing.departmentId,
          faculty: input.customer.faculty || existing.faculty,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, existing.id))
        .returning();
      customer = updated!;
    } else {
      customer = await resolveCustomer(tx, input.customer);
    }

    // 3. Order + items.
    const createdAt = new Date();
    const [order] = await tx
      .insert(orders)
      .values({
        customerId: customer.id,
        status: "confirmed",
        customerType,
        departmentId: customer.departmentId,
        poNumber: input.customer.poNumber || null,
        fulfillment,
        preferredPaymentMethod: paymentMethod,
        notes: input.customer.notes || null,
        subtotal: totals.subtotal.toFixed(2),
        discount: totals.discount.toFixed(2),
        tax: totals.tax.toFixed(2),
        total: totals.total.toFixed(2),
        invoiceToken: randomToken(24),
      })
      .returning();

    await tx.insert(orderItems).values(
      priced.map((l) => ({
        orderId: order.id,
        productId: l.productId,
        productName: l.name,
        quantity: l.quantity,
        unitPrice: l.unitPrice.toFixed(2),
        lineTotal: lineTotal(l.unitPrice, l.quantity).toFixed(2),
      })),
    );

    // 4. Invoice with price snapshots.
    const invoiceNumber = await nextInvoiceNumber(tx, createdAt);
    const amountPaid =
      input.payment.status === "unpaid"
        ? 0
        : input.payment.status === "paid"
          ? totals.total
          : Math.min(input.payment.amount, totals.total);

    const [invoice] = await tx
      .insert(invoices)
      .values({
        invoiceNumber,
        orderId: order.id,
        customerId: customer.id,
        publicToken: randomToken(24),
        status: invoiceStatusFor(amountPaid, totals.total, input.payment.status),
        issueDate: isoDate(createdAt),
        dueDate: isoDate(new Date(createdAt.getTime() + DUE_DAYS * 86400000)),
        customerType,
        departmentId: customer.departmentId,
        poNumber: input.customer.poNumber || null,
        fulfillment,
        notes: input.customer.notes || null,
        customerNameSnapshot: customer.name,
        subtotal: totals.subtotal.toFixed(2),
        discount: totals.discount.toFixed(2),
        taxRate: String(shopConfig.taxRatePercent),
        tax: totals.tax.toFixed(2),
        total: totals.total.toFixed(2),
        amountPaid: amountPaid.toFixed(2),
        stockDecremented: false,
      })
      .returning();

    await tx.insert(invoiceItems).values(
      priced.map((l) => ({
        invoiceId: invoice.id,
        productId: l.productId,
        productName: l.name,
        quantity: l.quantity,
        unitPrice: l.unitPrice.toFixed(2),
        lineTotal: lineTotal(l.unitPrice, l.quantity).toFixed(2),
      })),
    );

    // 5. Stock decrement + ledger, same transaction.
    for (const l of priced) {
      const balanceAfter = await decrementStock(tx, l.productId, l.quantity, l.name);
      await recordMovement(tx, {
        productId: l.productId,
        delta: -l.quantity,
        balanceAfter,
        reason: "sale",
        referenceType: "order",
        referenceId: order.id,
      });
    }
    await tx
      .update(invoices)
      .set({ stockDecremented: true })
      .where(eq(invoices.id, invoice.id));

    // 6. Payment row (if any).
    if (amountPaid > 0) {
      await tx.insert(payments).values({
        invoiceId: invoice.id,
        amount: amountPaid.toFixed(2),
        method: input.payment.method ?? "cash",
        notes: input.payment.status === "partial" ? "Deposit recorded" : null,
      });
    }

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      publicToken: invoice.publicToken,
      orderId: order.id,
      customerId: customer.id,
      total: totals.total,
    };
  });
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
