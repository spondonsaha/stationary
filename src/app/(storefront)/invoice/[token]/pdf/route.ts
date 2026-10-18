import { getInvoiceByToken } from "@/lib/queries/invoices";
import { renderInvoicePdf } from "@/components/invoice/InvoicePDF";
import { shopConfig } from "@/lib/config";

export const runtime = "nodejs";

/**
 * Renders the invoice PDF on the server. Access requires the invoice's
 * unguessable public token — the same link the customer receives.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  // Tokens are 48 hex chars; reject anything else before touching the DB.
  if (!/^[a-f0-9]{32,64}$/i.test(token)) {
    return new Response("Not found", { status: 404 });
  }

  const invoice = await getInvoiceByToken(token);
  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const buffer = await renderInvoicePdf(invoice, shopConfig);
    const filename = `${invoice.invoiceNumber}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    // TEMP diagnostic: remove after root-causing the 500.
    const msg = err instanceof Error ? `${err.name}: ${err.message}\n${err.stack ?? ""}` : String(err);
    console.error("PDF render failed", err);
    return new Response(msg, { status: 500 });
  }
}
