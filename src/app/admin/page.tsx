import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { getDashboardStats } from "@/lib/queries/admin";
import { formatMoney } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import { Card, DataTable, PageHeader, StatCard } from "@/components/admin/ui";
import { StatusBadge } from "@/components/invoice/StatusBadge";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Today's activity, outstanding money and stock alerts."
        actions={
          <>
            <Link
              href="/admin/invoices/new"
              className="inline-flex h-11 items-center rounded-md bg-ink px-5 text-sm font-medium text-paper-50 btn-press"
            >
              New invoice
            </Link>
            <Link
              href="/admin/products/new"
              className="inline-flex h-11 items-center rounded-md border border-ink-200 bg-white px-5 text-sm font-medium text-ink btn-press"
            >
              Add product
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's sales" value={formatMoney(stats.todaySales)} hint={`${stats.todayOrders} invoice${stats.todayOrders === 1 ? "" : "s"} issued`} />
        <StatCard label="Total orders" value={String(stats.totalOrders)} tone="ink" />
        <StatCard
          label="Unpaid invoices"
          value={String(stats.unpaidCount)}
          hint={`${formatMoney(stats.unpaidAmount)} outstanding`}
          tone={stats.unpaidCount > 0 ? "eraser" : "leaf"}
        />
        <StatCard
          label="Low-stock items"
          value={String(stats.lowStock.length)}
          hint={stats.lowStock.length > 0 ? "Restock soon" : "All healthy"}
          tone={stats.lowStock.length > 0 ? "pencil" : "leaf"}
        />
      </div>

      <Card
        title="Recent invoices"
        description="The six most recently issued invoices"
        actions={
          <Link href="/admin/invoices" className="text-sm font-medium text-ink-500 hover:text-ink">
            View all →
          </Link>
        }
        className="[&>div]:p-0"
      >
        <DataTable
          caption="Recent invoices"
          empty={<span>No invoices yet. They appear here after the first checkout.</span>}
          columns={[
            {
              key: "number",
              label: "Invoice",
              render: (r) => (
                <Link
                  href={`/invoice/${r.publicToken}`}
                  className="font-mono text-xs font-semibold text-ink hover:underline"
                >
                  {r.invoiceNumber}
                </Link>
              ),
            },
            { key: "customer", label: "Customer", render: (r) => r.customerName },
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
              render: (r) => <StatusBadge status={r.status} />,
            },
          ]}
          rows={stats.recentInvoices}
        />
      </Card>

      <Card
        title="Low-stock alerts"
        description="At or below each product's threshold"
        className="[&>div]:p-0"
      >
        {stats.lowStock.length === 0 ? (
          <p className="p-5 text-sm text-ink-500">Everything is above its stock threshold.</p>
        ) : (
          <DataTable
            caption="Low stock products"
            empty={null}
            columns={[
              { key: "name", label: "Product", render: (r) => r.name },
              {
                key: "stock",
                label: "In stock",
                align: "right",
                render: (r) => (
                  <Badge tone={r.stock === 0 ? "danger" : "warning"}>
                    {r.stock} left
                  </Badge>
                ),
              },
              {
                key: "threshold",
                label: "Threshold",
                align: "right",
                render: (r) => <span className="text-ink-400">{r.threshold}</span>,
              },
              {
                key: "action",
                label: "",
                align: "right",
                hideOnMobileCard: true,
                render: (r) => (
                  <Link
                    href={`/admin/products/${r.id}`}
                    className="text-sm font-medium text-ink-500 hover:text-ink"
                  >
                    Restock →
                  </Link>
                ),
              },
            ]}
            rows={stats.lowStock}
          />
        )}
      </Card>
    </div>
  );
}
