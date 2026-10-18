import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getInvoiceByToken } from "@/lib/queries/invoices";
import { formatMoney } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import { ClearCartOnMount } from "./ClearCartOnMount";
import { StatusBadge } from "@/components/invoice/StatusBadge";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await getInvoiceByToken(token);
  if (!invoice) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <ClearCartOnMount />

      <div className="rounded-card border border-ink-100 bg-white p-6 text-center shadow-soft sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-md bg-leaf-soft">
          <svg viewBox="0 0 32 32" width="32" height="32" fill="none" aria-hidden className="text-leaf">
            <path d="M8 17l5.5 5.5L24 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-5 font-display text-3xl font-semibold text-ink">Order confirmed!</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Thanks, {invoice.customer.name.split(" ")[0]}. Your order is being prepared at the
          counter. Invoice <strong className="text-ink-700">{invoice.invoiceNumber}</strong> is
          ready below.
        </p>

        <dl className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3 text-left text-sm">
          <div className="rounded-md bg-paper-100 p-3">
            <dt className="text-ink-400">Total</dt>
            <dd className="mt-0.5 font-semibold text-ink">{formatMoney(invoice.total)}</dd>
          </div>
          <div className="rounded-md bg-paper-100 p-3">
            <dt className="text-ink-400">Status</dt>
            <dd className="mt-0.5">
              <StatusBadge status={invoice.status} />
            </dd>
          </div>
          <div className="rounded-md bg-paper-100 p-3">
            <dt className="text-ink-400">Invoice date</dt>
            <dd className="mt-0.5 font-medium text-ink">{formatDate(invoice.issueDate)}</dd>
          </div>
          <div className="rounded-md bg-paper-100 p-3">
            <dt className="text-ink-400">Due date</dt>
            <dd className="mt-0.5 font-medium text-ink">{formatDate(invoice.dueDate)}</dd>
          </div>
        </dl>

        <div className="mt-8 grid gap-2 sm:grid-cols-2">
          <Link
            href={`/invoice/${invoice.publicToken}`}
            className="inline-flex h-12 items-center justify-center rounded-md bg-ink text-sm font-medium text-paper-50 btn-press hover:bg-ink-700"
          >
            View invoice
          </Link>
        </div>
        <Link
          href="/products"
          className="mt-4 inline-flex h-11 items-center rounded-md px-5 text-sm font-medium text-ink-500 hover:bg-paper-100"
        >
          Continue shopping →
        </Link>

        <p className="mt-6 text-xs text-ink-400">
          Keep this link handy — it lets you view this invoice any time. We&apos;ll
          also email a copy if you provided your email at checkout.
        </p>
      </div>
    </div>
  );
}
