import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  customers,
  departments,
  invoiceItems,
  invoices,
  orders,
  payments,
} from "@/lib/db/schema";

export type InvoiceView = {
  id: string;
  invoiceNumber: string;
  status: "unpaid" | "partial" | "paid" | "void";
  publicToken: string;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  customerType: "guest" | "student" | "faculty_staff" | "department";
  poNumber: string | null;
  fulfillment: "pickup" | "campus_delivery";
  department: { name: string; code: string } | null;
  subtotal: string;
  discount: string;
  taxRate: string;
  tax: string;
  total: string;
  amountPaid: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    studentId: string | null;
    faculty: string | null;
  };
  items: {
    productName: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }[];
  payments: {
    amount: string;
    method: string;
    createdAt: string;
  }[];
  order: { id: string } | null;
};

/** Loads a full invoice by its public (unguessable) token. */
export async function getInvoiceByToken(token: string): Promise<InvoiceView | null> {
  const rows = await db
    .select({
      invoice: invoices,
      customer: customers,
      department: departments,
    })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .leftJoin(departments, eq(invoices.departmentId, departments.id))
    .where(eq(invoices.publicToken, token))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const [items, pays] = await Promise.all([
    db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, row.invoice.id))
      .orderBy(invoiceItems.id),
    db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, row.invoice.id))
      .orderBy(desc(payments.createdAt)),
  ]);

  return {
    id: row.invoice.id,
    invoiceNumber: row.invoice.invoiceNumber,
    status: row.invoice.status,
    publicToken: row.invoice.publicToken,
    issueDate: toDateStr(row.invoice.issueDate),
    dueDate: toDateStr(row.invoice.dueDate),
    notes: row.invoice.notes,
    customerType: row.invoice.customerType,
    poNumber: row.invoice.poNumber,
    fulfillment: row.invoice.fulfillment,
    department: row.department ? { name: row.department.name, code: row.department.code } : null,
    subtotal: row.invoice.subtotal,
    discount: row.invoice.discount,
    taxRate: row.invoice.taxRate,
    tax: row.invoice.tax,
    total: row.invoice.total,
    amountPaid: row.invoice.amountPaid,
    createdAt: row.invoice.createdAt.toISOString(),
    customer: {
      name: row.customer.name,
      email: row.customer.email,
      phone: row.customer.phone,
      address: row.customer.address,
      studentId: row.customer.studentId,
      faculty: row.customer.faculty,
    },
    items: items.map((i) => ({
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    payments: pays.map((p) => ({
      amount: p.amount,
      method: p.method,
      createdAt: p.createdAt.toISOString(),
    })),
    order: row.invoice.orderId ? { id: row.invoice.orderId } : null,
  };
}

/** Order confirmation page data (order + its invoice token). */
export async function getOrderByInvoiceToken(token: string) {
  const rows = await db
    .select({ order: orders, invoice: invoices })
    .from(orders)
    .innerJoin(invoices, eq(invoices.orderId, orders.id))
    .where(eq(invoices.publicToken, token))
    .limit(1);
  return rows[0] ?? null;
}

function toDateStr(d: Date | string): string {
  if (typeof d === "string") return d;
  return d.toISOString().slice(0, 10);
}
