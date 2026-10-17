import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { listAdminCustomers } from "@/lib/queries/admin";
import { formatMoney } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import { DataTable, FilterForm, PageHeader, Pagination } from "@/components/admin/ui";

export const metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").trim();

  const { items, total, pageCount } = await listAdminCustomers({ page, q });

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    return `/admin/customers${params.size ? `?${params}` : ""}`;
  };

  return (
    <div>
      <PageHeader title="Customers" description={`${total} customer${total === 1 ? "" : "s"}`} />

      <FilterForm action="/admin/customers">
        <div className="sm:col-span-1">
          <label htmlFor="cq" className="mb-1 block text-xs font-medium text-ink-400">
            Search
          </label>
          <input
            id="cq"
            name="q"
            defaultValue={q}
            placeholder="Name, email or phone"
            className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
          />
        </div>
        <button
          type="submit"
          className="h-11 rounded-md bg-ink px-5 text-sm font-medium text-paper-50 btn-press"
        >
          Search
        </button>
      </FilterForm>

      <DataTable
        caption="Customers"
        empty={<span>No customers match this search.</span>}
        columns={[
          {
            key: "name",
            label: "Customer",
            render: (r) => (
              <div className="min-w-0">
                <Link href={`/admin/customers/${r.id}`} className="font-medium text-ink-800 hover:underline">
                  {r.name}
                </Link>
                <p className="truncate text-xs text-ink-400">
                  {r.email}
                  {r.phone ? ` · ${r.phone}` : ""}
                </p>
              </div>
            ),
          },
          {
            key: "joined",
            label: "Since",
            render: (r) => <span className="text-ink-500">{formatDate(r.createdAt)}</span>,
          },
          {
            key: "orders",
            label: "Orders",
            align: "right",
            render: (r) => <span className="tabular-nums">{r.orderCount}</span>,
          },
          {
            key: "spent",
            label: "Paid",
            align: "right",
            render: (r) => <span className="tabular-nums">{formatMoney(r.spent)}</span>,
          },
          {
            key: "outstanding",
            label: "Outstanding",
            align: "right",
            render: (r) => {
              const owed = Number(r.outstanding);
              return (
                <span className={owed > 0.001 ? "tabular-nums text-[#8c3b34]" : "tabular-nums text-ink-400"}>
                  {formatMoney(owed)}
                </span>
              );
            },
          },
        ]}
        rows={items}
      />

      <Pagination page={page} pageCount={pageCount} makeHref={makeHref} />
    </div>
  );
}
