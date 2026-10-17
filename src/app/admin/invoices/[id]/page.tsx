import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { getAdminInvoice } from "@/lib/queries/admin";
import { formatMoney } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import type { InvoiceView } from "@/lib/queries/invoices";
import { Card, PageHeader } from "@/components/admin/ui";
import { StatusBadge } from "@/components/invoice/StatusBadge";
import { InvoiceSheet } from "@/components/invoice/InvoiceSheet";
import { AddPaymentForm } from "@/components/admin/AddPaymentForm";
import { InvoiceStatusActions } from "@/components/admin/InvoiceStatusActions";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";

export const metadata = { title: "Invoice" };
export const dynamic = "force-dynamic";

export default async function AdminInvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  const data = await getAdminInvoice(id);
  if (!data) notFound();

  const { invoice, customer, department, items, payments } = data;
  const balance = Math.round((Number(invoice.total) - Number(invoice.amountPaid)) * 100) / 100;

  const view: InvoiceView = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    publicToken: invoice.publicToken,
    issueDate: toDateStr(invoice.issueDate),
    dueDate: toDateStr(invoice.dueDate),
    notes: invoice.notes,
    customerType: invoice.customerType,
    poNumber: invoice.poNumber,
    fulfillment: invoice.fulfillment,
    department: department ? { name: department.name, code: department.code } : null,
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    taxRate: invoice.taxRate,
    tax: invoice.tax,
    total: invoice.total,
    amountPaid: invoice.amountPaid,
    createdAt: invoice.createdAt.toISOString(),
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      studentId: customer.studentId,
      faculty: customer.faculty,
    },
    items: items.map((i) => ({
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    payments: payments.map((p) => ({
      amount: p.amount,
      method: p.method,
      createdAt: p.createdAt.toISOString(),
    })),
    order: invoice.orderId ? { id: invoice.orderId } : null,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.invoiceNumber}
        description={`${customer.name} · issued ${formatDate(invoice.issueDate)}`}
        actions={
          <>
            <Link
              href={`/admin/invoices`}
              className="inline-flex h-11 items-center rounded-md border border-ink-200 bg-white px-4 text-sm font-medium text-ink btn-press"
            >
              All invoices
            </Link>
            <CopyLinkButton path={`/invoice/${invoice.publicToken}`} />
            <a
              href={`/invoice/${invoice.publicToken}/pdf`}
              className="inline-flex h-11 items-center rounded-md border border-ink-200 bg-white px-4 text-sm font-medium text-ink btn-press"
            >
              Download PDF
            </a>
          </>
        }
      />

      {created ? (
        <p role="status" className="rounded-md border border-[#c8e6d5] bg-leaf-soft px-4 py-3 text-sm font-medium text-[#1f5c40]">
          Invoice created.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <StatusBadge status={invoice.status} />
            <span className="text-sm text-ink-500">
              Balance due{" "}
              <strong className={balance > 0.001 ? "text-[#8c3b34]" : "text-ink-700"}>
                {formatMoney(balance)}
              </strong>
            </span>
          </div>
          <InvoiceSheet invoice={view} />
        </div>

        <aside className="h-fit space-y-4">
          <Card title="Status actions" description="Mark paid, void, or download">
            <InvoiceStatusActions invoiceId={invoice.id} status={invoice.status} />
            <div className="mt-4 space-y-1.5 text-sm text-ink-500">
              <div className="flex justify-between">
                <span>Total</span>
                <span className="tabular-nums text-ink-800">{formatMoney(invoice.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid</span>
                <span className="tabular-nums text-ink-800">{formatMoney(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold text-ink-800">
                <span>Balance</span>
                <span className="tabular-nums">{formatMoney(balance)}</span>
              </div>
            </div>
          </Card>

          {invoice.status !== "void" && balance > 0.001 ? (
            <Card title="Record a payment" description="Partial or full">
              <AddPaymentForm invoiceId={invoice.id} balance={balance} />
            </Card>
          ) : null}

          <Card title="Payment history">
            {payments.length === 0 ? (
              <p className="text-sm text-ink-400">No payments recorded yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span className="text-ink-500">
                      {formatDate(p.createdAt)} ·{" "}
                      <span className="capitalize">{p.method.replace("_", " ")}</span>
                      {p.notes ? <span className="text-ink-400"> · {p.notes}</span> : null}
                    </span>
                    <span className="tabular-nums text-ink-800">{formatMoney(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Customer">
            <dl className="space-y-1.5 text-sm">
              <Field label="Name" value={customer.name} />
              <Field label="Type" value={typeLabel(invoice.customerType)} />
              <Field label="Email" value={customer.email} />
              {customer.studentId ? (
                <Field
                  label={invoice.customerType === "faculty_staff" ? "Staff ID" : "Student ID"}
                  value={customer.studentId}
                />
              ) : null}
              {department ? <Field label="Department" value={`${department.name} (${department.code})`} /> : null}
              {invoice.poNumber ? <Field label="PO / budget" value={invoice.poNumber} /> : null}
              <Field
                label="Fulfilment"
                value={invoice.fulfillment === "campus_delivery" ? "Campus delivery" : "Pickup"}
              />
              {customer.phone ? <Field label="Phone" value={customer.phone} /> : null}
              {customer.address ? <Field label="Address" value={customer.address} /> : null}
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-400">{label}</dt>
      <dd className="text-right text-ink-800">{value}</dd>
    </div>
  );
}

function toDateStr(d: Date | string): string {
  if (typeof d === "string") return d;
  return d.toISOString().slice(0, 10);
}

function typeLabel(t: string): string {
  switch (t) {
    case "student":
      return "Student";
    case "faculty_staff":
      return "Faculty & Staff";
    case "department":
      return "Department";
    default:
      return "Guest";
  }
}
