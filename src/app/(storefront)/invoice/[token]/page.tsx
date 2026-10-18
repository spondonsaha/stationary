import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getInvoiceByToken } from "@/lib/queries/invoices";
import { InvoiceSheet } from "@/components/invoice/InvoiceSheet";
import { PrintButton } from "@/components/invoice/PrintButton";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

/**
 * Public invoice view — reachable only via the unguessable invoice token.
 * No login required for customers; admin uses /admin/invoices for lists.
 */
export default async function InvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await getInvoiceByToken(token);
  if (!invoice) notFound();

  return (
    <div className="mx-auto max-w-4xl px-3 py-6 sm:px-6 sm:py-8 print:px-0 print:py-0">
      <div className="print-hide mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl">Invoice</h1>
          <p className="text-sm text-ink-500">{invoice.invoiceNumber}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrintButton />
        </div>
      </div>

      <InvoiceSheet invoice={invoice} />

      <p className="print-hide mt-6 text-center text-xs text-ink-400">
        Looking for your other orders?{" "}
        <Link href="/products" className="link-underline text-ink-500">
          Visit the shop
        </Link>
      </p>
    </div>
  );
}
