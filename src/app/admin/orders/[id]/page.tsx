import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { getAdminOrder } from "@/lib/queries/admin";
import { formatMoney } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import { Card, PageHeader } from "@/components/admin/ui";
import { OrderStatusBadge, StatusBadge } from "@/components/invoice/StatusBadge";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";

export const metadata = { title: "Order" };
export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const data = await getAdminOrder(id);
  if (!data) notFound();

  const { order, customer, items, invoice } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order #${order.id.slice(0, 8).toUpperCase()}`}
        description={`Placed ${formatDate(order.createdAt)} by ${customer.name}`}
        actions={
          <>
            <Link
              href="/admin/orders"
              className="inline-flex h-11 items-center rounded-md border border-ink-200 bg-white px-4 text-sm font-medium text-ink btn-press"
            >
              All orders
            </Link>
            {invoice ? (
              <Link
                href={`/admin/invoices/${invoice.id}`}
                className="inline-flex h-11 items-center rounded-md bg-ink px-5 text-sm font-medium text-paper-50 btn-press"
              >
                View invoice
              </Link>
            ) : null}
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card title="Items" description={`${items.length} line${items.length === 1 ? "" : "s"}`}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                <th scope="col" className="py-2 font-semibold">Item</th>
                <th scope="col" className="py-2 text-right font-semibold">Qty</th>
                <th scope="col" className="py-2 text-right font-semibold">Unit</th>
                <th scope="col" className="py-2 text-right font-semibold">Line</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-ink-100/70 last:border-0">
                  <td className="py-2.5 font-medium text-ink-800">{i.productName}</td>
                  <td className="py-2.5 text-right tabular-nums text-ink-600">{i.quantity}</td>
                  <td className="py-2.5 text-right tabular-nums text-ink-600">{formatMoney(i.unitPrice)}</td>
                  <td className="py-2.5 text-right tabular-nums font-medium text-ink-800">{formatMoney(i.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="mt-4 ml-auto max-w-xs space-y-2 text-sm">
            <Row label="Subtotal" value={formatMoney(order.subtotal)} />
            {Number(order.discount) > 0 ? <Row label="Discount" value={`−${formatMoney(order.discount)}`} /> : null}
            <Row label="Tax" value={formatMoney(order.tax)} />
            <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-semibold text-ink">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(order.total)}</dd>
            </div>
          </dl>

          {order.notes ? (
            <div className="mt-4 border-t border-ink-100 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Customer notes</h3>
              <p className="mt-1 text-sm text-ink-600">{order.notes}</p>
            </div>
          ) : null}
        </Card>

        <aside className="h-fit space-y-4">
          <Card title="Status">
            <div className="mb-3 flex items-center gap-2">
              <OrderStatusBadge status={order.status} />
              {invoice ? <StatusBadge status={invoice.status} /> : null}
            </div>
            <OrderStatusForm orderId={order.id} status={order.status} />
          </Card>

          <Card title="Customer">
            <dl className="space-y-1.5 text-sm">
              <Row label="Name" value={customer.name} />
              <Row label="Email" value={customer.email} />
              {customer.phone ? <Row label="Phone" value={customer.phone} /> : null}
              {customer.address ? <Row label="Address" value={customer.address} /> : null}
            </dl>
            <Link
              href={`/admin/customers/${customer.id}`}
              className="mt-3 inline-block text-sm font-medium text-ink-500 hover:text-ink"
            >
              View customer history →
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-ink-500">
      <dt>{label}</dt>
      <dd className="text-right text-ink-800">{value}</dd>
    </div>
  );
}
