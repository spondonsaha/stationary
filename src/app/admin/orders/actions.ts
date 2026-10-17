"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, orders } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import { assertSameOrigin } from "@/lib/security/csrf";
import { createAdminOrder, StockError, PriceError } from "@/lib/invoice/create";
import { adminOrderSchema } from "@/lib/validation/checkout";

export type AdminOrderState = { error?: string; fieldErrors?: Record<string, string> } | null;

const ORDER_STATUSES = ["pending", "confirmed", "cancelled"] as const;

/** Change an order's status from the order detail page. */
export async function setOrderStatusAction(formData: FormData): Promise<void> {
  await requireAdminOrThrow();
  await assertSameOrigin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id) return;
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return;

  await db
    .update(orders)
    .set({ status: status as (typeof ORDER_STATUSES)[number], updatedAt: new Date() })
    .where(eq(orders.id, id));

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
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

export type OrderCustomerHit = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  type: "guest" | "student" | "faculty_staff" | "department";
  studentId: string | null;
  departmentId: string | null;
  faculty: string | null;
};

/** Customer search for the "order on behalf of" picker. */
export async function searchCustomersForOrderAction(query: string): Promise<OrderCustomerHit[]> {
  await requireAdminOrThrow();
  const q = query.trim();
  if (q.length < 2) return [];

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      type: customers.type,
      studentId: customers.studentId,
      departmentId: customers.departmentId,
      faculty: customers.faculty,
    })
    .from(customers)
    .where(
      or(
        ilike(customers.name, `%${q}%`),
        ilike(customers.email, `%${q}%`),
        ilike(customers.phone, `%${q}%`),
        ilike(customers.studentId, `%${q}%`),
      ),
    )
    .orderBy(asc(customers.name))
    .limit(8);

  return rows as OrderCustomerHit[];
}

/**
 * Submit an admin-assisted order. The client posts a JSON `payload`
 * (structured items + payment). Prices are locked server-side.
 */
export async function createAdminOrderAction(
  _prev: AdminOrderState,
  formData: FormData,
): Promise<AdminOrderState> {
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
    return { error: "Could not read the order form. Please try again." };
  }

  const parsed = adminOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the form.",
      fieldErrors: flattenZod(parsed.error),
    };
  }

  const data = parsed.data;
  const customerId = data.customerId?.trim() || null;

  try {
    const result = await createAdminOrder({
      customerId,
      customer: {
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone || null,
        address: data.customerAddress || null,
        type: data.customerType,
        studentId: data.studentId || null,
        departmentId: data.departmentId || null,
        faculty: data.faculty || null,
        poNumber: data.poNumber || null,
        fulfillment: data.fulfillment,
        notes: data.notes || null,
      },
      discount: data.discount,
      lines: data.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      payment: {
        status: data.payment.status,
        amount: data.payment.amount,
        method: data.payment.status === "unpaid" ? undefined : data.payment.method,
      },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/invoices");
    revalidatePath("/admin/customers");
    revalidatePath("/admin");
    redirect(`/admin/orders/${result.orderId}?created=1`);
  } catch (err) {
    if (err instanceof StockError) {
      return { error: `Not enough stock (${err.available} available). Adjust the quantity.` };
    }
    if (err instanceof PriceError) {
      return { error: `A selected product is no longer available: ${err.productName}.` };
    }
    throw err;
  }
}
