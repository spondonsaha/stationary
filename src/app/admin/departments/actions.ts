"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { departments } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import { assertSameOrigin } from "@/lib/security/csrf";

export type DepartmentState = { error?: string; fieldErrors?: Record<string, string> } | null;

const departmentSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(160),
  code: z
    .string()
    .trim()
    .min(2, "Code is required")
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, "Letters, numbers and dashes only"),
  faculty: z.string().trim().max(160).optional().or(z.literal("")),
  budgetCode: z.string().trim().max(60).optional().or(z.literal("")),
  contactName: z.string().trim().max(160).optional().or(z.literal("")),
  contactEmail: z.string().trim().email("Enter a valid email").max(254).optional().or(z.literal("")),
  active: z.coerce.boolean().optional(),
});

export async function createDepartmentAction(
  _prev: DepartmentState,
  formData: FormData,
): Promise<DepartmentState> {
  try {
    await requireAdminOrThrow();
    await assertSameOrigin();
  } catch {
    return { error: "Your session expired. Please sign in again." };
  }

  const parsed = departmentSchema.safeParse(readDepartment(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };
  const data = parsed.data;

  try {
    await db.insert(departments).values({
      name: data.name,
      code: data.code.toUpperCase(),
      faculty: data.faculty || null,
      budgetCode: data.budgetCode || null,
      contactName: data.contactName || null,
      contactEmail: data.contactEmail || null,
      active: data.active ?? true,
    });
  } catch (err) {
    if (isUniqueViolation(err)) return { error: "A department with that code already exists." };
    throw err;
  }

  revalidateTag("departments");
  redirect("/admin/departments?created=1");
}

export async function updateDepartmentAction(
  _prev: DepartmentState,
  formData: FormData,
): Promise<DepartmentState> {
  try {
    await requireAdminOrThrow();
    await assertSameOrigin();
  } catch {
    return { error: "Your session expired. Please sign in again." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing department id." };

  const parsed = departmentSchema.safeParse(readDepartment(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };
  const data = parsed.data;

  try {
    await db
      .update(departments)
      .set({
        name: data.name,
        code: data.code.toUpperCase(),
        faculty: data.faculty || null,
        budgetCode: data.budgetCode || null,
        contactName: data.contactName || null,
        contactEmail: data.contactEmail || null,
        active: data.active ?? true,
      })
      .where(eq(departments.id, id));
  } catch (err) {
    if (isUniqueViolation(err)) return { error: "A department with that code already exists." };
    throw err;
  }

  revalidateTag("departments");
  redirect("/admin/departments?updated=1");
}

export async function deleteDepartmentAction(formData: FormData): Promise<void> {
  await requireAdminOrThrow();
  await assertSameOrigin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // References (customers/orders/invoices) use ON DELETE SET NULL, so history is
  // preserved and the department simply disappears from the pickers.
  await db.delete(departments).where(eq(departments.id, id));
  revalidateTag("departments");
  redirect("/admin/departments?deleted=1");
}

/* ---------------- helpers ---------------- */

function readDepartment(formData: FormData) {
  return {
    name: formData.get("name"),
    code: formData.get("code"),
    faculty: formData.get("faculty"),
    budgetCode: formData.get("budgetCode"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    active: formData.get("active") === "on",
  };
}

function flatten(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Postgres unique violation (23505). Drizzle wraps the driver error, so the
 *  code can sit on `err` or on a nested `cause` — walk the chain. */
function isUniqueViolation(err: unknown): boolean {
  let node: unknown = err;
  for (let depth = 0; depth < 5 && node; depth += 1) {
    if (typeof node === "object" && "code" in node && (node as { code?: string }).code === "23505") {
      return true;
    }
    node = (node as { cause?: unknown }).cause;
  }
  return false;
}
