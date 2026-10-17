"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices, payments, products } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import { assertSameOrigin } from "@/lib/security/csrf";
import { createManualInvoice, StockError, PriceError } from "@/lib/invoice/create";
import { manualInvoiceSchema } from "@/lib/validation/checkout";

export type InvoiceActionState = { error?: string; ok?: string } | null;
export type ManualInvoiceState = { error?: string; fieldErrors?: Record<string, string> } | null;

function recomputeStatus(amountPaid: number, total: number): "paid" | "partial" | "unpaid" {
  if (amountPaid <= 0) return "unpaid";
  if (amountPaid + 0.009 >= total) return "paid";
  return "partial";
}

/** Record a payment against an invoice and roll the status forward. */
export async function addPaymentAction(
  _prev: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  try {
    await requireAdminOrThrow();
    await assertSameOrigin();
  } catch {
    return { error: "Your session expired. Please sign in again." };
  }

  const invoiceId = String(formData.get("invoiceId") ?? "");
  const amount = Number(formData.get("amount"));
  const method = String(formData.get("method") ?? "cash");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!invoiceId) return { error: "Missing invoice." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a payment amount greater than zero." };
  if (!["cash", "card", "bank_transfer", "other"].includes(method)) return { error: "Invalid payment method." };

  const result = await db.transaction(async (tx) => {
    const [inv] = await tx
      .select({ total: invoices.total, amountPaid: invoices.amountPaid })
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);
    if (!inv) return { error: "Invoice not found." } as const;

    const total = Number(inv.total);
    const already = Number(inv.amountPaid);
    const remaining = Math.max(0, Math.round((total - already) * 100) / 100);
    if (remaining <= 0) return { error: "This invoice is already paid in full." } as const;

    const applied = Math.min(amount, remaining);
    const nextPaid = Math.round((already + applied) * 100) / 100;

    await tx.insert(payments).values({
      invoiceId,
      amount: applied.toFixed(2),
      method: method as "cash" | "card" | "bank_transfer" | "other",
      notes: notes || null,
    });

    await tx
      .update(invoices)
      .set({
        amountPaid: nextPaid.toFixed(2),
        status: recomputeStatus(nextPaid, total),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    return { ok: `Recorded ${applied.toFixed(2)}.` } as const;
  });

  if ("error" in result) return result;
  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
  return { ok: result.ok };
}

/** Mark the outstanding balance as paid in one click (balance -> a payment row). */
export async function markInvoicePaidAction(formData: FormData): Promise<void> {
  await requireAdminOrThrow();
  await assertSameOrigin();
  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (!invoiceId) return;

  await db.transaction(async (tx) => {
    const [inv] = await tx
      .select({ total: invoices.total, amountPaid: invoices.amountPaid })
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);
    if (!inv) return;

    const total = Number(inv.total);
    const already = Number(inv.amountPaid);
    const remaining = Math.round((total - already) * 100) / 100;
    if (remaining <= 0) return;

    await tx.insert(payments).values({
      invoiceId,
      amount: remaining.toFixed(2),
      method: "cash",
      notes: "Marked paid from admin",
    });
    await tx
      .update(invoices)
      .set({ amountPaid: total.toFixed(2), status: "paid", updatedAt: new Date() })
      .where(eq(invoices.id, invoiceId));
  });

  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
}

/** Void an invoice (keeps the record; excluded from unpaid totals). */
export async function voidInvoiceAction(formData: FormData): Promise<void> {
  await requireAdminOrThrow();
  await assertSameOrigin();
  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (!invoiceId) return;
  await db
    .update(invoices)
    .set({ status: "void", updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId));
  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
}

function flattenZod(err: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Manual invoice builder submit. The client posts a JSON payload in
 * `payload` (items + payment are structured, not flat fields).
 */
export async function createManualInvoiceAction(
  _prev: ManualInvoiceState,
  formData: FormData,
): Promise<ManualInvoiceState> {
  try {
    await requireAdminOrThrow();
    await assertSameOrigin();
  } catch {
    return { error: "Your session expired. Please sign in again." };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { error: "Could not read the invoice form. Please try again." };
  }

  const parsed = manualInvoiceSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the form.",
      fieldErrors: flattenZod(parsed.error),
    };
  }

  const data = parsed.data;
  // customers.email is required; use a placeholder for walk-in cash sales.
  const email = data.customerEmail?.trim() || `walkin+${crypto.randomUUID()}@local.invalid`;

  try {
    const result = await createManualInvoice({
      customer: {
        name: data.customerName,
        email,
        phone: data.customerPhone || null,
        address: data.customerAddress || null,
      },
      notes: data.notes || null,
      discount: data.discount,
      lines: data.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      payment: {
        status: data.payment.status,
        amount: data.payment.amount,
        method: data.payment.status === "unpaid" ? undefined : data.payment.method,
      },
    });

    revalidatePath("/admin/invoices");
    revalidatePath("/admin");
    redirect(`/admin/invoices/${result.invoiceId}?created=1`);
  } catch (err) {
    if (err instanceof StockError) {
      return { error: `Not enough stock for ${err.productName} (${err.available} available).` };
    }
    if (err instanceof PriceError) {
      return { error: `A selected product is no longer available: ${err.productName}.` };
    }
    throw err;
  }
}

/** Product search for the manual invoice builder. */
export async function searchProductsAction(query: string): Promise<
  { id: string; name: string; sku: string; price: string; stock: number }[]
> {
  await requireAdminOrThrow();
  const q = query.trim();
  if (q.length < 2) return [];

  return db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      price: products.price,
      stock: products.stock,
    })
    .from(products)
    .where(
      and(
        eq(products.status, "active"),
        or(ilike(products.name, `%${q}%`), ilike(products.sku, `%${q}%`)),
      ),
    )
    .orderBy(asc(products.name))
    .limit(8);
}
