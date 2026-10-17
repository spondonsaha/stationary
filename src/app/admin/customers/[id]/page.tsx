import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { getAdminCustomer } from "@/lib/queries/admin";
import { formatMoney } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import { Card, DataTable, PageHeader } from "@/components/admin/ui";
import { OrderStatusBadge, StatusBadge } from "@/components/invoice/StatusBadge";

export const metadata = { title: "Customer" };
export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const data = await getAdminCustomer(id);
  if (!data) notFound();

  const { customer, orders, invoices } = data;

  const lifetime = invoices.reduce((sum, i) => sum + Number(i.amountPaid), 0);
  const outstanding = invoices.reduce(
    (sum, i) => sum + (i.status === "unpaid" || i.status === "partial" ? Number(i.total) - Number(i.amountPaid) : 0),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        description={`${customer.email}${customer.phone ? ` · ${customer.phone}` : ""}`}
        actions={
          <Link
            href="/admin/customers"
            className="inline-flex h-11 items-center rounded-md border border-ink-200 bg-white px-4 text-sm font-medium text-ink btn-press"
          >
            All customers
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Lifetime paid" value={formatMoney(lifetime)} />
        <Stat label="Outstanding" value={formatMoney(outstanding)} tone={outstanding > 0.001 ? "eraser" : "leaf"} />
        <Stat label="Orders" value={String(orders.length)} />
      </div>

      <Card title="Invoices" className="[&>div]:p-0">
        <DataTable
          caption="Customer invoices"
          empty={<span>No invoices for this customer yet.</span>}
          columns={[
            {
              key: "number",
              label: "Invoice",
              render: (i) => (
                <Link
                  href={`/admin/invoices/${i.id}`}
                  className="font-mono text-xs font-semibold text-ink hover:underline"
                >
                  {i.invoiceNumber}
                </Link>
              ),
            },
            {
              key: "date",
              label: "Issued",
              render: (i) => <span className="text-ink-500">{formatDate(i.issueDate)}</span>,
            },
            { key: "total", label: "Total", align: "right", render: (i) => formatMoney(i.total) },
            {
              key: "balance",
              label: "Balance",
              align: "right",
              render: (i) => {
                const b = Number(i.total) - Number(i.amountPaid);
                return <span className={b > 0.001 ? "text-[#8c3b34]" : "text-ink-400"}>{formatMoney(b)}</span>;
              },
            },
            { key: "status", label: "Status", align: "right", render: (i) => <StatusBadge status={i.status} /> },
          ]}
          rows={invoices}
        />
      </Card>

      <Card title="Orders" className="[&>div]:p-0">
        <DataTable
          caption="Customer orders"
          empty={<span>No orders for this customer yet.</span>}
          columns={[
            {
              key: "id",
              label: "Order",
              render: (o) => (
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="font-mono text-xs font-semibold text-ink hover:underline"
                >
                  #{o.id.slice(0, 8).toUpperCase()}
                </Link>
              ),
            },
            {
              key: "date",
              label: "Date",
              render: (o) => <span className="text-ink-500">{formatDate(o.createdAt)}</span>,
            },
            { key: "total", label: "Total", align: "right", render: (o) => formatMoney(o.total) },
            { key: "status", label: "Status", align: "right", render: (o) => <OrderStatusBadge status={o.status} /> },
          ]}
          rows={orders}
        />
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: string;
  tone?: "ink" | "leaf" | "eraser";
}) {
  const tones = { ink: "text-ink", leaf: "text-leaf", eraser: "text-[#b3372c]" } as const;
  return (
    <div className="rounded-card border border-ink-100 bg-white p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className={`mt-1 font-display text-xl font-semibold ${tones[tone]}`}>{value}</p>
    </div>
  );
}
