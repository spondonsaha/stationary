import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { listAdminProducts, listCategoriesWithCounts } from "@/lib/queries/admin";
import { getBrands } from "@/lib/queries/catalog";
import { formatMoney } from "@/lib/config";
import { DataTable, FilterForm, PageHeader, Pagination } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { CategoryFilterSelect } from "@/components/admin/CategoryFilterSelect";

export const metadata = { title: "Products" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; category?: string; brand?: string; created?: string; updated?: string; deleted?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").trim();
  const category = sp.category ?? "";
  const brand = sp.brand ?? "";

  const [{ items, pageCount, total }, cats, brands] = await Promise.all([
    listAdminProducts({ page, q, category, brand }),
    listCategoriesWithCounts(),
    getBrands(),
  ]);

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (p > 1) params.set("page", String(p));
    return `/admin/products${params.size ? `?${params}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${total} product${total === 1 ? "" : "s"} in the catalog`}
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex h-11 items-center rounded-md bg-ink px-5 text-sm font-medium text-paper-50 btn-press"
          >
            Add product
          </Link>
        }
      />

      {sp.created || sp.updated || sp.deleted ? (
        <p role="status" className="mb-4 rounded-md border border-[#c8e6d5] bg-leaf-soft px-4 py-3 text-sm font-medium text-[#1f5c40]">
          {sp.created ? "Product created." : sp.updated ? "Product updated." : "Product deleted."}
        </p>
      ) : null}

      <FilterForm action="/admin/products">
        <div>
          <label htmlFor="pq" className="mb-1 block text-xs font-medium text-ink-400">
            Search
          </label>
          <input
            id="pq"
            name="q"
            defaultValue={q}
            placeholder="Name or SKU"
            className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="pcategory" className="mb-1 block text-xs font-medium text-ink-400">
            Category
          </label>
          <CategoryFilterSelect categories={cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))} value={category} />
        </div>
        <div>
          <label htmlFor="pbrand" className="mb-1 block text-xs font-medium text-ink-400">
            Brand
          </label>
          <select
            id="pbrand"
            name="brand"
            defaultValue={brand}
            className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <input type="hidden" name="page" value="1" />
        <button
          type="submit"
          className="h-11 rounded-md bg-ink px-5 text-sm font-medium text-paper-50 btn-press"
        >
          Filter
        </button>
      </FilterForm>

      <DataTable
        caption="Products"
        empty={<span>No products match. Try clearing the filters or add a product.</span>}
        columns={[
          {
            key: "name",
            label: "Product",
            render: (r) => (
              <div className="flex items-center gap-3">
                {r.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image} alt="" className="h-10 w-10 rounded border border-ink-100 object-cover" />
                ) : (
                  <span className="h-10 w-10 rounded bg-paper-200" aria-hidden />
                )}
                <div className="min-w-0">
                  <Link href={`/admin/products/${r.id}`} className="block font-medium text-ink hover:underline">
                    {r.name}
                  </Link>
                  <span className="text-xs text-ink-400">
                    {r.sku} · {r.categoryName}
                    {r.brand ? ` · ${r.brand}` : ""}
                  </span>
                </div>
              </div>
            ),
          },
          { key: "price", label: "Price", align: "right", render: (r) => formatMoney(r.price) },
          {
            key: "stock",
            label: "Stock",
            align: "right",
            render: (r) =>
              r.stock === 0 ? (
                <Badge tone="danger">Out</Badge>
              ) : r.stock <= r.lowStockThreshold ? (
                <Badge tone="warning">{r.stock}</Badge>
              ) : (
                <span className="tabular-nums">{r.stock}</span>
              ),
          },
          {
            key: "status",
            label: "Status",
            align: "right",
            render: (r) => (
              <Badge tone={r.status === "active" ? "success" : "neutral"}>
                {r.status === "active" ? "Active" : "Archived"}
              </Badge>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            align: "right",
            render: (r) => <ProductRowActions id={r.id} name={r.name} status={r.status} />,
          },
        ]}
        rows={items}
      />

      <Pagination page={page} pageCount={pageCount} makeHref={makeHref} />
    </div>
  );
}
