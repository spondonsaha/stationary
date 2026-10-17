import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { and, asc, desc, eq, ilike, inArray, or, sql, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { computeTotals } from "@/lib/cart/totals";

export const PAGE_SIZE = 12;

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string | null;
  price: string;
  stock: number;
  image: string | null;
  description: string;
  categoryName: string;
  categorySlug: string;
  featured: boolean;
  createdAt: string;
};

export type SortKey = "newest" | "price-asc" | "price-desc" | "name";

const SORTS: Record<SortKey, ReturnType<typeof asc>> = {
  newest: desc(products.createdAt),
  "price-asc": asc(products.price),
  "price-desc": desc(products.price),
  name: asc(products.name),
};

export function isSortKey(v: string | undefined): v is SortKey {
  return v === "newest" || v === "price-asc" || v === "price-desc" || v === "name";
}

const productRowToItem = (row: {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string | null;
  price: string;
  stock: number;
  image: string | null;
  description: string;
  featured: boolean;
  createdAt: Date;
  categoryName: string;
  categorySlug: string;
}): ProductListItem => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  sku: row.sku,
  brand: row.brand,
  price: row.price,
  stock: row.stock,
  image: row.image,
  description: row.description ?? "",
  categoryName: row.categoryName,
  categorySlug: row.categorySlug,
  featured: row.featured,
  createdAt: row.createdAt.toISOString(),
});

const baseSelect = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  sku: products.sku,
  brand: products.brand,
  price: products.price,
  stock: products.stock,
  image: products.image,
  description: products.description,
  featured: products.featured,
  createdAt: products.createdAt,
  categoryName: categories.name,
  categorySlug: categories.slug,
};

/* ------------------------------------------------------------------ */
/* Cached query helpers (ISR-style revalidation via tags)              */
/* ------------------------------------------------------------------ */

export const getCategories = unstable_cache(
  async () =>
    db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        image: categories.image,
      })
      .from(categories)
      .orderBy(asc(categories.name)),
  ["catalog:categories"],
  { tags: ["categories"], revalidate: 300 },
);

export async function getCategoryBySlug(slug: string) {
  const all = await getCategories();
  return all.find((c) => c.slug === slug) ?? null;
}

export type ProductQuery = {
  page?: number;
  category?: string;
  q?: string;
  sort?: SortKey;
  brand?: string[];
  audience?: string;
  featured?: boolean;
  inStockOnly?: boolean;
};

/** Categories considered department/bulk supplies for the "Order for Department" view. */
export const DEPARTMENT_CATEGORIES = ["office", "paper", "books"] as const;

export const getBrands = unstable_cache(
  async () =>
    db
      .selectDistinct({ brand: products.brand })
      .from(products)
      .where(and(eq(products.status, "active"), sql`${products.brand} is not null`))
      .orderBy(asc(products.brand))
      .then((rows) => rows.map((r) => r.brand!).filter(Boolean)),
  ["catalog:brands"],
  { tags: ["products"], revalidate: 300 },
);

export const getProductsPage = unstable_cache(
  async (query: ProductQuery) => {
    const page = Math.max(1, query.page ?? 1);
    const brands = (query.brand ?? []).filter(Boolean);
    const audienceSlugs =
      query.audience === "department" ? [...DEPARTMENT_CATEGORIES] : null;
    const conditions = [
      eq(products.status, "active"),
      ...(query.category ? [eq(categories.slug, query.category)] : []),
      ...(audienceSlugs ? [inArray(categories.slug, audienceSlugs)] : []),
      ...(brands.length ? [inArray(products.brand, brands)] : []),
      ...(query.q
        ? [
            or(
              ilike(products.name, `%${query.q}%`),
              ilike(products.description, `%${query.q}%`),
              ilike(products.sku, `%${query.q}%`),
              ilike(products.brand, `%${query.q}%`),
            )!,
          ]
        : []),
      ...(query.featured ? [eq(products.featured, true)] : []),
      ...(query.inStockOnly ? [sql`${products.stock} > 0`] : []),
    ];

    const where = and(...conditions);
    const orderBy = SORTS[query.sort ?? "newest"];

    const [items, [totalRow]] = await Promise.all([
      db
        .select(baseSelect)
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(where)
        .orderBy(orderBy, desc(products.id))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
      db
        .select({ total: count() })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(where),
    ]);

    const total = totalRow?.total ?? 0;
    return {
      items: items.map(productRowToItem),
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  },
  ["catalog:products"],
  { tags: ["products"], revalidate: 120 },
);

export const getFeaturedProducts = unstable_cache(
  async (limit = 4) => {
    const rows = await db
      .select(baseSelect)
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.status, "active"), eq(products.featured, true)))
      .orderBy(desc(products.createdAt))
      .limit(limit);
    return rows.map(productRowToItem);
  },
  ["catalog:featured"],
  { tags: ["products"], revalidate: 300 },
);

export const getNewArrivals = unstable_cache(
  async (limit = 8) => {
    const rows = await db
      .select(baseSelect)
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.status, "active"))
      .orderBy(desc(products.createdAt), desc(products.id))
      .limit(limit);
    return rows.map(productRowToItem);
  },
  ["catalog:new"],
  { tags: ["products"], revalidate: 300 },
);

/** Per-request memoized so layout + page share one query. */
export const getProductBySlug = cache(async (slug: string) => {
  const rows = await db
    .select(baseSelect)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.status, "active")))
    .limit(1);
  return rows[0] ? productRowToItem(rows[0]) : null;
});

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

/** Batch price lookup used by checkout to re-price cart lines server-side. */
export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      price: products.price,
      stock: products.stock,
      image: products.image,
    })
    .from(products)
    .where(sql`${products.id} = ANY(${ids}::uuid[]) AND ${products.status} = 'active'`);
}

/** Stock-aware pricing helper shared by checkout & manual invoices. */
export function priceFor(unitPrice: string | number, quantity: number) {
  const unit = typeof unitPrice === "string" ? Number(unitPrice) : unitPrice;
  return computeTotals({ lines: [{ unitPrice: unit, quantity }], discount: 0 });
}
