import { shopConfig, formatMoney, toMoney } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import type { InvoiceView } from "@/lib/queries/invoices";
import { StatusBadge } from "./StatusBadge";

/**
 * Print-friendly A4 invoice. Pure markup, no client JS — the same data
 * also drives the PDF renderer (components/invoice/InvoicePDF.tsx).
 */
export function InvoiceSheet({ invoice }: { invoice: InvoiceView }) {
  const balance =
    Math.round((toMoney(invoice.total) - toMoney(invoice.amountPaid)) * 100) / 100;

  return (
    <article className="print-sheet mx-auto w-full max-w-3xl rounded-card border border-ink-100 bg-white p-4 shadow-soft sm:p-10">
      {/* Header: shop + invoice meta */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-100 pb-5 sm:gap-6 sm:pb-6">
        <div className="flex items-start gap-3">
          <InvoiceLogo />
          <div>
            <h1 className="font-display text-lg font-semibold text-ink sm:text-xl">{shopConfig.name}</h1>
            {shopConfig.address ? (
              <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-ink-500">
                {shopConfig.address}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-ink-500">
              {shopConfig.email}
              {shopConfig.phone ? ` · ${shopConfig.phone}` : ""}
            </p>
          </div>
        </div>

        <div className="ml-auto text-right">
          <p className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">INVOICE</p>
          <div className="mt-1.5 flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
            <p className="font-mono text-sm font-semibold text-ink-700">{invoice.invoiceNumber}</p>
            <StatusBadge status={invoice.status} />
          </div>
        </div>
      </header>

      {/* Billed-to + dates */}
      <section className="grid gap-4 py-5 sm:grid-cols-2 sm:gap-6 sm:py-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            Billed to
          </h2>
          <p className="mt-2 font-medium text-ink-800">{invoice.customer.name}</p>
          {invoice.department ? (
            <p className="mt-0.5 text-sm text-ink-500">
              {invoice.department.name} ({invoice.department.code})
            </p>
          ) : null}
          {invoice.customer.studentId ? (
            <p className="mt-0.5 text-sm text-ink-500">
              {invoice.customerType === "faculty_staff" ? "Staff ID" : "Student ID"}:{" "}
              {invoice.customer.studentId}
            </p>
          ) : null}
          {invoice.customer.address ? (
            <p className="mt-0.5 text-sm text-ink-500">{invoice.customer.address}</p>
          ) : null}
          <p className="mt-0.5 text-sm text-ink-500">{invoice.customer.email}</p>
          {invoice.customer.phone ? (
            <p className="text-sm text-ink-500">{invoice.customer.phone}</p>
          ) : null}
          {invoice.poNumber ? (
            <p className="mt-1 text-sm text-ink-500">
              <span className="text-ink-400">PO / budget:</span>{" "}
              <span className="font-medium text-ink-700">{invoice.poNumber}</span>
            </p>
          ) : null}
        </div>
        <dl className="space-y-1.5 text-sm sm:text-right">
          <div className="flex justify-between gap-4 sm:justify-end">
            <dt className="text-ink-400">Invoice date</dt>
            <dd className="font-medium text-ink-800">{formatDate(invoice.issueDate)}</dd>
          </div>
          <div className="flex justify-between gap-4 sm:justify-end">
            <dt className="text-ink-400">Due date</dt>
            <dd className="font-medium text-ink-800">{formatDate(invoice.dueDate)}</dd>
          </div>
          <div className="flex justify-between gap-4 sm:justify-end">
            <dt className="text-ink-400">Fulfilment</dt>
            <dd className="font-medium capitalize text-ink-800">
              {invoice.fulfillment === "campus_delivery" ? "Campus delivery" : "Pickup"}
            </dd>
          </div>
          {invoice.order ? (
            <div className="flex justify-between gap-4 sm:justify-end">
              <dt className="text-ink-400">Order</dt>
              <dd className="font-mono text-xs text-ink-700">
                #{invoice.order.id.slice(0, 8).toUpperCase()}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {/* Line items: table on wide screens, stacked cards on phones */}
      <section aria-labelledby="items-heading">
        <h2 id="items-heading" className="sr-only">
          Invoice items
        </h2>

        <table className="hidden w-full border-collapse text-sm md:table">
          <thead>
            <tr className="border-y border-ink-100 bg-paper-100 text-left text-xs uppercase tracking-wide text-ink-400">
              <th scope="col" className="px-3 py-2.5 font-semibold">Item</th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">Qty</th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">Unit price</th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">Line total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} className="border-b border-ink-100/70">
                <td className="px-3 py-3 font-medium text-ink-800">{item.productName}</td>
                <td className="px-3 py-3 text-right tabular-nums text-ink-600">{item.quantity}</td>
                <td className="px-3 py-3 text-right tabular-nums text-ink-600">
                  {formatMoney(item.unitPrice)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums font-medium text-ink-800">
                  {formatMoney(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="divide-y divide-ink-100 md:hidden">
          {invoice.items.map((item, i) => (
            <li key={i} className="py-3">
              <p className="font-medium text-ink-800">{item.productName}</p>
              <p className="mt-0.5 text-xs text-ink-500">
                {item.quantity} × {formatMoney(item.unitPrice)}
              </p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-ink-800">
                {formatMoney(item.lineTotal)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Totals */}
      <section className="mt-5 flex justify-end sm:mt-6">
        <dl className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-500">Subtotal</dt>
            <dd className="tabular-nums text-ink-800">{formatMoney(invoice.subtotal)}</dd>
          </div>
          {toMoney(invoice.discount) > 0 ? (
            <div className="flex justify-between">
              <dt className="text-ink-500">Discount</dt>
              <dd className="tabular-nums text-ink-800">−{formatMoney(invoice.discount)}</dd>
            </div>
          ) : null}
          {toMoney(invoice.tax) > 0 ? (
            <div className="flex justify-between">
              <dt className="text-ink-500">Tax ({toMoney(invoice.taxRate)}%)</dt>
              <dd className="tabular-nums text-ink-800">{formatMoney(invoice.tax)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-semibold text-ink">
            <dt>Grand total</dt>
            <dd className="tabular-nums">{formatMoney(invoice.total)}</dd>
          </div>
          {toMoney(invoice.amountPaid) > 0 ? (
            <>
              <div className="flex justify-between text-ink-500">
                <dt>Amount paid</dt>
                <dd className="tabular-nums text-ink-800">{formatMoney(invoice.amountPaid)}</dd>
              </div>
              <div className="flex justify-between font-semibold text-ink-800">
                <dt>Balance due</dt>
                <dd className="tabular-nums">{formatMoney(balance)}</dd>
              </div>
            </>
          ) : null}
        </dl>
      </section>

      {/* Notes + payment history */}
      <footer className="mt-8 space-y-4 border-t border-ink-100 pt-5">
        {invoice.notes ? (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400">Notes</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{invoice.notes}</p>
          </div>
        ) : null}

        {invoice.payments.length > 0 ? (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Payments received
            </h2>
            <ul className="mt-1.5 space-y-1 text-sm text-ink-600">
              {invoice.payments.map((p, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>
                    {formatDate(p.createdAt)} · <span className="capitalize">{p.method.replace("_", " ")}</span>
                  </span>
                  <span className="tabular-nums">{formatMoney(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="pt-2 text-center text-xs text-ink-400">
          Thank you for shopping with {shopConfig.name}. Questions? {shopConfig.email}
        </p>
      </footer>
    </article>
  );
}

export function InvoiceLogo({ size = 44 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md bg-ink"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 40 40" width={size * 0.62} height={size * 0.62} fill="none">
        <path d="M10 28l13-17c.5-.7 1.5-.7 2 0l2.4 3.1c.5.7.5 1.6 0 2.3L16 30h-6v-2z" fill="#C9A961" />
        <circle cx="13" cy="28" r="1.8" fill="#F7F8FA" />
      </svg>
    </span>
  );
}
