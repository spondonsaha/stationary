import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { listAdminInvoices } from "@/lib/queries/admin";
import { formatMoney } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import { DataTable, FilterForm, PageHeader, Pagination } from "@/components/admin/ui";
import { StatusBadge } from "@/components/invoice/StatusBadge";

export const metadata = { title: "Invoices" };
export const dynamic = "force-dynamic";

const STATUSES = ["", "unpaid", "partial", "paid", "void"] as const;

export default async function AdminInvoicesPage({
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

  const { items, total, pageCount } = await listAdminInvoices({ page, status, q, from, to });

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (p > 1) params.set("page", String(p));
    return `/admin/invoices${params.size ? `?${params}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        description={`${total} invoice${total === 1 ? "" : "s"}`}
        actions={
          <Link
            href="/admin/invoices/new"
            className="inline-flex h-11 items-center rounded-md bg-ink px-5 text-sm font-medium text-paper-50 btn-press"
          >
            New invoice
          </Link>
        }
      />

      <FilterForm action="/admin/invoices">
        <div>
          <label htmlFor="iq" className="mb-1 block text-xs font-medium text-ink-400">
            Search
          </label>
          <input
            id="iq"
            name="q"
            defaultValue={q}
            placeholder="Number, name or email"
            className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="istatus" className="mb-1 block text-xs font-medium text-ink-400">
            Status
          </label>
          <select
            id="istatus"
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
            <label htmlFor="ifrom" className="mb-1 block text-xs font-medium text-ink-400">
              From
            </label>
            <input
              id="ifrom"
              name="from"
              type="date"
              defaultValue={from}
              className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="ito" className="mb-1 block text-xs font-medium text-ink-400">
              To
            </label>
            <input
              id="ito"
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
        caption="Invoices"
        empty={<span>No invoices match these filters.</span>}
        columns={[
          {
            key: "number",
            label: "Invoice",
            render: (r) => (
              <Link
                href={`/admin/invoices/${r.id}`}
                className="font-mono text-xs font-semibold text-ink hover:underline"
              >
                {r.invoiceNumber}
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
            key: "date",
            label: "Issued",
            render: (r) => <span className="text-ink-500">{formatDate(r.issueDate)}</span>,
          },
          { key: "total", label: "Total", align: "right", render: (r) => formatMoney(r.total) },
          {
            key: "balance",
            label: "Balance",
            align: "right",
            render: (r) => {
              const balance = Number(r.total) - Number(r.amountPaid);
              return (
                <span className={balance > 0.001 ? "text-[#8c3b34]" : "text-ink-400"}>
                  {formatMoney(balance)}
                </span>
              );
            },
          },
          {
            key: "status",
            label: "Status",
            align: "right",
            render: (r) => <StatusBadge status={r.status} />,
          },
        ]}
        rows={items}
      />

      <Pagination page={page} pageCount={pageCount} makeHref={makeHref} />
    </div>
  );
}
