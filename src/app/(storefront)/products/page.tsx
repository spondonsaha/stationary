import Link from "next/link";
import { Suspense } from "react";
import {
  getBrands,
  getCategories,
  getProductsPage,
  isSortKey,
  type SortKey,
} from "@/lib/queries/catalog";
import { ProductCard, ProductRow, ProductGridSkeleton } from "@/components/storefront/ProductCard";

export const metadata = {
  title: "Shop",
  description: "Browse textbooks, pens, notebooks, paper, art supplies and office essentials.",
};

type Search = { [key: string]: string | string[] | undefined };

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function all(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  return (Array.isArray(v) ? v : [v]).filter(Boolean);
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = first(sp.q).trim();
  const category = first(sp.category);
  const audience = first(sp.audience);
  const brands = all(sp.brand);
  const sortParam = first(sp.sort);
  const sort = isSortKey(sortParam) ? sortParam : "newest";
  const view = first(sp.view) === "list" ? "list" : "grid";
  const page = Math.max(1, Number(first(sp.page)) || 1);

  const heading = category
    ? category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : audience === "department"
      ? "Department supplies"
      : "All products";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-400">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>{" "}
        / <span className="text-ink-600">Shop</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">{heading}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {q ? (
              <>
                Results for <span className="font-semibold text-ink-700">“{q}”</span>
              </>
            ) : audience === "department" ? (
              "Office, paper and book supplies suited to department accounts."
            ) : (
              "Everything in the store, 12 per page."
            )}
          </p>
        </div>
        <ViewToggle view={view} q={q} category={category} audience={audience} brands={brands} sort={sort} />
      </div>

      <FilterBar
        q={q}
        category={category}
        audience={audience}
        brands={brands}
        sort={sort}
        view={view}
      />

      <div className="mt-6">
        <Suspense
          key={`${q}|${category}|${audience}|${brands.join(",")}|${sort}|${view}|${page}`}
          fallback={<ProductGridSkeleton count={12} />}
        >
          <ProductResults
            q={q}
            category={category}
            audience={audience}
            brands={brands}
            sort={sort}
            view={view}
            page={page}
          />
        </Suspense>
      </div>
    </div>
  );
}

function buildQuery(opts: {
  q?: string;
  category?: string;
  audience?: string;
  brands?: string[];
  sort?: string;
  view?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.category) params.set("category", opts.category);
  if (opts.audience) params.set("audience", opts.audience);
  for (const b of opts.brands ?? []) params.append("brand", b);
  if (opts.sort && opts.sort !== "newest") params.set("sort", opts.sort);
  if (opts.view === "list") params.set("view", "list");
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  return params.size ? `?${params}` : "";
}

function ViewToggle({
  view,
  q,
  category,
  audience,
  brands,
  sort,
}: {
  view: string;
  q: string;
  category: string;
  audience: string;
  brands: string[];
  sort: SortKey;
}) {
  const gridHref = `/products${buildQuery({ q, category, audience, brands, sort })}`;
  const listHref = `/products${buildQuery({ q, category, audience, brands, sort, view: "list" })}`;
  const base = "inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm";
  return (
    <div className="flex items-center gap-1" role="group" aria-label="View">
      <Link
        href={gridHref}
        aria-current={view === "grid" ? "true" : undefined}
        className={`${base} ${view === "grid" ? "border-ink bg-ink text-white" : "border-ink-200 bg-white text-ink-500 hover:border-ink-400"}`}
        title="Grid view"
      >
        <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden>
          <rect x="1" y="1" width="6" height="6" fill="currentColor" />
          <rect x="9" y="1" width="6" height="6" fill="currentColor" />
          <rect x="1" y="9" width="6" height="6" fill="currentColor" />
          <rect x="9" y="9" width="6" height="6" fill="currentColor" />
        </svg>
      </Link>
      <Link
        href={listHref}
        aria-current={view === "list" ? "true" : undefined}
        className={`${base} ${view === "list" ? "border-ink bg-ink text-white" : "border-ink-200 bg-white text-ink-500 hover:border-ink-400"}`}
        title="List view"
      >
        <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden>
          <rect x="1" y="2" width="14" height="2.5" fill="currentColor" />
          <rect x="1" y="6.75" width="14" height="2.5" fill="currentColor" />
          <rect x="1" y="11.5" width="14" height="2.5" fill="currentColor" />
        </svg>
      </Link>
    </div>
  );
}

/**
 * Filters are a plain GET form — zero JavaScript required for
 * search / filter / sort; results are server-rendered.
 */
async function FilterBar({
  q,
  category,
  audience,
  brands,
  sort,
  view,
}: {
  q: string;
  category: string;
  audience: string;
  brands: string[];
  sort: SortKey;
  view: string;
}) {
  const [cats, brandList] = await Promise.all([getCategories(), getBrands()]);

  return (
    <div className="mt-6 rounded-card border border-ink-100 bg-white p-3 shadow-soft sm:p-4">
      <form method="get" action="/products" className="space-y-3">
        {audience ? <input type="hidden" name="audience" value={audience} /> : null}
        {view === "list" ? <input type="hidden" name="view" value="list" /> : null}

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <label htmlFor="fq" className="sr-only">
              Search products
            </label>
            <input
              id="fq"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search products…"
              className="h-11 w-full rounded-md border border-ink-200 bg-white pl-3.5 pr-3 text-sm placeholder:text-ink-300 focus:border-ink-400"
            />
          </div>
          <div>
            <label htmlFor="fcategory" className="sr-only">
              Category
            </label>
            <select
              id="fcategory"
              name="category"
              defaultValue={category}
              className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm sm:w-48"
            >
              <option value="">All categories</option>
              {cats.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div>
              <label htmlFor="fsort" className="sr-only">
                Sort by
              </label>
              <select
                id="fsort"
                name="sort"
                defaultValue={sort}
                className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm sm:w-44"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="h-11 shrink-0 rounded-md bg-ink px-5 text-sm font-medium text-white btn-press hover:bg-ink-700"
            >
              Apply
            </button>
          </div>
        </div>

        <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink-100 pt-3">
          <legend className="sr-only">Brand</legend>
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">Brand</span>
          {brandList.map((b) => (
            <label key={b} className="flex items-center gap-1.5 text-sm text-ink-600">
              <input
                type="checkbox"
                name="brand"
                value={b}
                defaultChecked={brands.includes(b)}
                className="h-4 w-4 rounded border-ink-300 text-ink focus:ring-ink-400"
              />
              {b}
            </label>
          ))}
        </fieldset>
      </form>
    </div>
  );
}

async function ProductResults({
  q,
  category,
  audience,
  brands,
  sort,
  view,
  page,
}: {
  q: string;
  category: string;
  audience: string;
  brands: string[];
  sort: SortKey;
  view: string;
  page: number;
}) {
  const { items, total, pageCount } = await getProductsPage({
    q: q || undefined,
    category: category || undefined,
    audience: audience || undefined,
    brand: brands,
    sort,
    page,
  });

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-ink-200 bg-white px-6 py-16 text-center">
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none" className="mx-auto text-ink-200" aria-hidden>
          <circle cx="21" cy="21" r="12" stroke="currentColor" strokeWidth="2.5" />
          <path d="M30 30l9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <h2 className="mt-4 font-display text-xl font-semibold text-ink">No products found</h2>
        <p className="mt-1 text-sm text-ink-500">Try a different search, or clear the filters.</p>
        <Link
          href="/products"
          className="mt-5 inline-flex h-11 items-center rounded-md bg-ink px-5 text-sm font-medium text-white btn-press"
        >
          Clear filters
        </Link>
      </div>
    );
  }

  const href = (p: number) =>
    `/products${buildQuery({ q, category, audience, brands, sort, view, page: p })}`;

  return (
    <>
      <p className="mb-4 text-sm text-ink-400" aria-live="polite">
        {total} product{total === 1 ? "" : "s"}
      </p>

      {view === "list" ? (
        <div className="space-y-3">
          {items.map((p) => (
            <ProductRow key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {pageCount > 1 ? (
        <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
          {page > 1 ? (
            <Link
              href={href(page - 1)}
              className="inline-flex h-11 items-center rounded-md border border-ink-200 bg-white px-4 text-sm font-medium text-ink btn-press hover:border-ink-400"
            >
              ← Prev
            </Link>
          ) : (
            <span className="inline-flex h-11 items-center rounded-md border border-ink-100 px-4 text-sm text-ink-300">
              ← Prev
            </span>
          )}
          {Array.from({ length: pageCount })
            .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
            .map((_, i) => {
              const p = Math.max(0, page - 3) + i + 1;
              const current = p === page;
              return (
                <Link
                  key={p}
                  href={href(p)}
                  aria-current={current ? "page" : undefined}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-md text-sm font-medium btn-press ${
                    current
                      ? "bg-ink text-white"
                      : "border border-ink-200 bg-white text-ink hover:border-ink-400"
                  }`}
                >
                  {p}
                </Link>
              );
            })}
          {page < pageCount ? (
            <Link
              href={href(page + 1)}
              className="inline-flex h-11 items-center rounded-md border border-ink-200 bg-white px-4 text-sm font-medium text-ink btn-press hover:border-ink-400"
            >
              Next →
            </Link>
          ) : (
            <span className="inline-flex h-11 items-center rounded-md border border-ink-100 px-4 text-sm text-ink-300">
              Next →
            </span>
          )}
        </nav>
      ) : null}
    </>
  );
}
