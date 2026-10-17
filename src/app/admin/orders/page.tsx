import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { listAdminOrders } from "@/lib/queries/admin";
import { formatMoney } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import { DataTable, FilterForm, PageHeader, Pagination } from "@/components/admin/ui";
import { OrderStatusBadge, StatusBadge } from "@/components/invoice/StatusBadge";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const STATUSES = ["", "pending", "confirmed", "cancelled"] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string; from?: string; to?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = sp.status ?? "";
  const q = (sp.q ?? "").trim();
  const from = sp.from ?? "";
  const to = sp.to ?? "";

  const { items, total, pageCount } = await listAdminOrders({ page, status, q, from, to });

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (p > 1) params.set("page", String(p));
    return `/admin/orders${params.size ? `?${params}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`${total} order${total === 1 ? "" : "s"}`}
        actions={
          <Link
            href="/admin/orders/new"
            className="inline-flex h-11 items-center rounded-md bg-ink px-4 text-sm font-medium text-paper-50 btn-press"
          >
            New order
          </Link>
        }
      />

      <FilterForm action="/admin/orders">
        <div>
          <label htmlFor="oq" className="mb-1 block text-xs font-medium text-ink-400">
            Search
          </label>
          <input
            id="oq"
            name="q"
            defaultValue={q}
            placeholder="Customer or invoice no."
            className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="ostatus" className="mb-1 block text-xs font-medium text-ink-400">
            Status
          </label>
          <select
            id="ostatus"
            name="status"
            defaultValue={status}
            className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "" ? "All statuses" : s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="ofrom" className="mb-1 block text-xs font-medium text-ink-400">
              From
            </label>
            <input
              id="ofrom"
              name="from"
              type="date"
              defaultValue={from}
              className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="oto" className="mb-1 block text-xs font-medium text-ink-400">
              To
            </label>
            <input
              id="oto"
              name="to"
              type="date"
              defaultValue={to}
              className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          className="h-11 rounded-md bg-ink px-5 text-sm font-medium text-paper-50 btn-press"
        >
          Filter
        </button>
      </FilterForm>

      <DataTable
        caption="Orders"
        empty={<span>No orders match these filters.</span>}
        columns={[
          {
            key: "id",
            label: "Order",
            render: (r) => (
              <Link
                href={`/admin/orders/${r.id}`}
                className="font-mono text-xs font-semibold text-ink hover:underline"
              >
                #{r.id.slice(0, 8).toUpperCase()}
              </Link>
            ),
          },
          {
            key: "customer",
            label: "Customer",
            render: (r) => (
              <div className="min-w-0">
                <p className="font-medium text-ink-800">{r.customerName}</p>
                <p className="truncate text-xs text-ink-400">{r.customerEmail}</p>
              </div>
            ),
          },
          {
            key: "invoice",
            label: "Invoice",
            render: (r) =>
              r.invoiceToken ? (
                <Link
                  href={`/admin/invoices?q=${r.invoiceNumber}`}
                  className="font-mono text-xs text-ink-600 hover:underline"
                >
                  {r.invoiceNumber}
                </Link>
              ) : (
                <span className="text-ink-300">—</span>
              ),
          },
          {
            key: "date",
            label: "Date",
            render: (r) => <span className="text-ink-500">{formatDate(r.createdAt)}</span>,
          },
          { key: "total", label: "Total", align: "right", render: (r) => formatMoney(r.total) },
          {
            key: "status",
            label: "Status",
            align: "right",
            render: (r) => (
              <div className="flex flex-col items-end gap-1">
                <OrderStatusBadge status={r.status} />
                {r.invoiceStatus ? <StatusBadge status={r.invoiceStatus} /> : null}
              </div>
            ),
          },
        ]}
        rows={items}
      />

      <Pagination page={page} pageCount={pageCount} makeHref={makeHref} />
    </div>
  );
}
