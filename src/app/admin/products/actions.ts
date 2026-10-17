"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { categories, invoiceItems, products, stockMovements } from "@/lib/db/schema";
import { requireAdminOrThrow } from "@/lib/auth/guard";
import { assertSameOrigin } from "@/lib/security/csrf";
import { slugify } from "@/lib/utils";

export type ProductState = { error?: string; fieldErrors?: Record<string, string> } | null;

const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(160),
  slug: z.string().trim().max(180).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  sku: z.string().trim().min(1, "SKU is required").max(40),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price cannot be negative").max(9_999_999),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative").max(9_999_999),
  lowStockThreshold: z.coerce.number().int().min(0).max(9_999_999),
  categoryId: z.string().uuid("Choose a category"),
  image: z.string().trim().max(255).optional().or(z.literal("")),
  status: z.enum(["active", "archived"]),
  featured: z.coerce.boolean().optional(),
});

function uniqueSlug(base: string, sku: string, provided?: string) {
  const source = provided?.trim() || slugify(base);
  return `${source || "product"}-${slugify(sku)}`.slice(0, 180);
}

export async function createProductAction(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  let admin;
  try {
    admin = await requireAdminOrThrow();
    await assertSameOrigin();
  } catch {
    return { error: "Your session expired. Please sign in again." };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    sku: formData.get("sku"),
    brand: formData.get("brand"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    lowStockThreshold: formData.get("lowStockThreshold") || 10,
    categoryId: formData.get("categoryId"),
    image: formData.get("image"),
    status: formData.get("status") ?? "active",
    featured: formData.get("featured") === "on",
  });

  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };
  const data = parsed.data;

  try {
    const [created] = await db
      .insert(products)
      .values({
        name: data.name,
        slug: uniqueSlug(data.name, data.sku, data.slug || undefined),
        description: data.description || "",
        sku: data.sku,
        brand: data.brand || null,
        price: data.price.toFixed(2),
        stock: data.stock,
        lowStockThreshold: data.lowStockThreshold,
        categoryId: data.categoryId,
        image: data.image || null,
        status: data.status,
        featured: Boolean(data.featured),
      })
      .returning({ id: products.id });

    if (created && data.stock > 0) {
      await db.insert(stockMovements).values({
        productId: created.id,
        delta: data.stock,
        reason: "initial",
        balanceAfter: data.stock,
        note: "Opening stock on product creation",
        createdBy: admin.id,
      });
    }
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: "A product with that SKU or slug already exists." };
    }
    throw err;
  }

  revalidateTag("products");
  redirect("/admin/products?created=1");
}

export async function updateProductAction(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  let admin;
  try {
    admin = await requireAdminOrThrow();
    await assertSameOrigin();
  } catch {
    return { error: "Your session expired. Please sign in again." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing product id." };

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    sku: formData.get("sku"),
    brand: formData.get("brand"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    lowStockThreshold: formData.get("lowStockThreshold") || 10,
    categoryId: formData.get("categoryId"),
    image: formData.get("image"),
    status: formData.get("status") ?? "active",
    featured: formData.get("featured") === "on",
  });

  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };
  const data = parsed.data;

  try {
    const [current] = await db
      .select({ stock: products.stock })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    await db
      .update(products)
      .set({
        name: data.name,
        slug: uniqueSlug(data.name, data.sku, data.slug || undefined),
        description: data.description || "",
        sku: data.sku,
        brand: data.brand || null,
        price: data.price.toFixed(2),
        stock: data.stock,
        lowStockThreshold: data.lowStockThreshold,
        categoryId: data.categoryId,
        image: data.image || null,
        status: data.status,
        featured: Boolean(data.featured),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    if (current && current.stock !== data.stock) {
      await db.insert(stockMovements).values({
        productId: id,
        delta: data.stock - current.stock,
        reason: data.stock > current.stock ? "restock" : "adjustment",
        balanceAfter: data.stock,
        note: "Stock edited in admin",
        createdBy: admin.id,
      });
    }
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: "A product with that SKU or slug already exists." };
    }
    throw err;
  }

  revalidateTag("products");
  redirect("/admin/products?updated=1");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdminOrThrow();
  await assertSameOrigin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Preserve invoice history: archive instead of hard-deleting when the
  // product has already been sold; a clean delete is fine otherwise.
  const [sold] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(invoiceItems)
    .where(eq(invoiceItems.productId, id));

  if (Number(sold?.c ?? 0) > 0) {
    await db
      .update(products)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(products.id, id));
  } else {
    await db.delete(products).where(eq(products.id, id));
  }

  revalidateTag("products");
  redirect("/admin/products?deleted=1");
}

export async function toggleProductStatusAction(formData: FormData): Promise<void> {
  await requireAdminOrThrow();
  await assertSameOrigin();
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "");
  if (!id) return;
  await db
    .update(products)
    .set({ status: next === "active" ? "active" : "archived", updatedAt: new Date() })
    .where(eq(products.id, id));
  revalidateTag("products");
}

/* ---------------- Categories ---------------- */

const categorySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  slug: z.string().trim().max(100).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  image: z.string().trim().max(255).optional().or(z.literal("")),
});

export type CategoryState = { error?: string; fieldErrors?: Record<string, string> } | null;

export async function createCategoryAction(
  _prev: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  try {
    await requireAdminOrThrow();
    await assertSameOrigin();
  } catch {
    return { error: "Your session expired. Please sign in again." };
  }

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    image: formData.get("image"),
  });
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  try {
    await db.insert(categories).values({
      name: parsed.data.name,
      slug: parsed.data.slug?.trim() || slugify(parsed.data.name),
      description: parsed.data.description || null,
      image: parsed.data.image || null,
    });
  } catch (err) {
    if (isUniqueViolation(err)) return { error: "A category with that slug already exists." };
    throw err;
  }

  revalidateTag("categories");
  revalidateTag("products");
  redirect("/admin/categories?created=1");
}

export async function updateCategoryAction(
  _prev: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  try {
    await requireAdminOrThrow();
    await assertSameOrigin();
  } catch {
    return { error: "Your session expired. Please sign in again." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing category id." };

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    image: formData.get("image"),
  });
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  try {
    await db
      .update(categories)
      .set({
        name: parsed.data.name,
        slug: parsed.data.slug?.trim() || slugify(parsed.data.name),
        description: parsed.data.description || null,
        image: parsed.data.image || null,
      })
      .where(eq(categories.id, id));
  } catch (err) {
    if (isUniqueViolation(err)) return { error: "A category with that slug already exists." };
    throw err;
  }

  revalidateTag("categories");
  revalidateTag("products");
  redirect("/admin/categories?updated=1");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdminOrThrow();
  await assertSameOrigin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.categoryId, id));
  if (Number(row?.c ?? 0) > 0) {
    // Block deleting a category that still has products (FK is RESTRICT anyway).
    redirect("/admin/categories?error=in-use");
  }

  await db.delete(categories).where(eq(categories.id, id));
  revalidateTag("categories");
  revalidateTag("products");
  redirect("/admin/categories?deleted=1");
}

/* ---------------- helpers ---------------- */

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
