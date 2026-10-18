import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { formatMoney, shopConfig, toMoney, type ShopInfo } from "@/lib/config";
import type { InvoiceView } from "@/lib/queries/invoices";

/**
 * PDF rendering of an invoice. Mirrors InvoiceSheet markup and uses the
 * built-in Helvetica family — no font downloads, so PDFs render fast.
 */

/** ASCII-only money ("BDT 1,234.50") — Helvetica cannot render the ৳ glyph. */
const pdfMoney = (v: number | string) => formatMoney(v, shopConfig.currency, "code");

const ink = "#1F3A5F";
const muted = "#5A6B80";
const line = "#DCE4EC";
const paper = "#F7F8FA";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    color: "#22364A",
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: line,
    paddingBottom: 16,
  },
  shopName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: ink },
  shopMeta: { fontSize: 9, color: muted, marginTop: 4, maxWidth: 220, lineHeight: 1.5 },
  invoiceTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: ink, textAlign: "right" },
  invoiceNumber: { fontSize: 11, fontFamily: "Helvetica-Bold", color: ink, textAlign: "right", marginTop: 3 },
  statusChip: {
    alignSelf: "flex-end",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  section: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 16 },
  label: { fontSize: 8, color: muted, textTransform: "uppercase", letterSpacing: 0.6 },
  strong: { fontFamily: "Helvetica-Bold", color: "#22364A" },
  small: { fontSize: 9, color: muted, marginTop: 2, lineHeight: 1.5 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: paper,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: line,
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  th: { fontSize: 8, color: muted, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: line,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  colItem: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right", fontFamily: "Helvetica-Bold" },
  totals: { marginTop: 14, alignSelf: "flex-end", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: line,
    paddingTop: 7,
    marginTop: 3,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: ink,
  },
  footer: {
    marginTop: 28,
    borderTopWidth: 1,
    borderTopColor: line,
    paddingTop: 12,
  },
  noteLabel: { fontSize: 8, color: muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 },
  noteBody: { fontSize: 9, color: "#3D5266", lineHeight: 1.5 },
  thanks: { marginTop: 18, textAlign: "center", fontSize: 8, color: muted },
});

function statusStyle(status: string) {
  switch (status) {
    case "paid":
      return { backgroundColor: "#E6F4EC", color: "#1F5C40" };
    case "partial":
      return { backgroundColor: "#FDF3D0", color: "#7A5B10" };
    case "void":
      return { backgroundColor: "#FDECEA", color: "#8C3B34" };
    default:
      return { backgroundColor: "#FDECEA", color: "#8C3B34" };
  }
}

function statusLabel(status: string) {
  return status === "partial" ? "PARTIALLY PAID" : status.toUpperCase();
}

export function InvoicePDF({
  invoice,
  shop,
}: {
  invoice: InvoiceView;
  shop: ShopInfo;
}) {
  const balance = Math.round((toMoney(invoice.total) - toMoney(invoice.amountPaid)) * 100) / 100;
  const status = statusStyle(invoice.status);

  return (
    <Document
      title={`Invoice ${invoice.invoiceNumber}`}
      author={shop.name}
      subject={`Invoice ${invoice.invoiceNumber}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.shopName}>{shop.name}</Text>
            {shop.address ? <Text style={styles.shopMeta}>{shop.address}</Text> : null}
            <Text style={styles.shopMeta}>
              {shop.email}
              {shop.phone ? `  ·  ${shop.phone}` : ""}
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={[styles.statusChip, status]}>{statusLabel(invoice.status)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={{ maxWidth: 240 }}>
            <Text style={styles.label}>Billed to</Text>
            <Text style={[styles.strong, { marginTop: 4 }]}>{invoice.customer.name}</Text>
            {invoice.department ? (
              <Text style={styles.small}>
                {invoice.department.name} ({invoice.department.code})
              </Text>
            ) : null}
            {invoice.customer.studentId ? (
              <Text style={styles.small}>
                {invoice.customerType === "faculty_staff" ? "Staff ID" : "Student ID"}:{" "}
                {invoice.customer.studentId}
              </Text>
            ) : null}
            {invoice.customer.address ? <Text style={styles.small}>{invoice.customer.address}</Text> : null}
            <Text style={styles.small}>{invoice.customer.email}</Text>
            {invoice.customer.phone ? <Text style={styles.small}>{invoice.customer.phone}</Text> : null}
            {invoice.poNumber ? (
              <Text style={styles.small}>PO / budget: {invoice.poNumber}</Text>
            ) : null}
          </View>
          <View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 3 }}>
              <Text style={[styles.label, { marginRight: 12 }]}>Invoice date</Text>
              <Text style={styles.strong}>{invoice.issueDate}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 3 }}>
              <Text style={[styles.label, { marginRight: 12 }]}>Due date</Text>
              <Text style={styles.strong}>{invoice.dueDate}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 3 }}>
              <Text style={[styles.label, { marginRight: 12 }]}>Fulfilment</Text>
              <Text style={styles.strong}>
                {invoice.fulfillment === "campus_delivery" ? "Campus delivery" : "Pickup"}
              </Text>
            </View>
            {invoice.order ? (
              <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                <Text style={[styles.label, { marginRight: 12 }]}>Order</Text>
                <Text style={styles.strong}>#{invoice.order.id.slice(0, 8).toUpperCase()}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.tableHead}>
          <Text style={[styles.th, styles.colItem]}>Item</Text>
          <Text style={[styles.th, styles.colQty]}>Qty</Text>
          <Text style={[styles.th, styles.colPrice]}>Unit price</Text>
          <Text style={[styles.th, styles.colTotal]}>Line total</Text>
        </View>

        {invoice.items.map((item, i) => (
          <View key={i} style={styles.row} wrap={false}>
            <Text style={styles.colItem}>{item.productName}</Text>
            <Text style={[styles.colQty, { color: muted }]}>{item.quantity}</Text>
            <Text style={[styles.colPrice, { color: muted }]}>{pdfMoney(item.unitPrice)}</Text>
            <Text style={styles.colTotal}>{pdfMoney(item.lineTotal)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={{ color: muted }}>Subtotal</Text>
            <Text>{pdfMoney(invoice.subtotal)}</Text>
          </View>
          {toMoney(invoice.discount) > 0 ? (
            <View style={styles.totalRow}>
              <Text style={{ color: muted }}>Discount</Text>
              <Text>−{pdfMoney(invoice.discount)}</Text>
            </View>
          ) : null}
          {toMoney(invoice.tax) > 0 ? (
            <View style={styles.totalRow}>
              <Text style={{ color: muted }}>Tax ({toMoney(invoice.taxRate)}%)</Text>
              <Text>{pdfMoney(invoice.tax)}</Text>
            </View>
          ) : null}
          <View style={styles.grandRow}>
            <Text>Grand total</Text>
            <Text>{pdfMoney(invoice.total)}</Text>
          </View>
          {toMoney(invoice.amountPaid) > 0 ? (
            <>
              <View style={[styles.totalRow, { marginTop: 7 }]}>
                <Text style={{ color: muted }}>Amount paid</Text>
                <Text>{pdfMoney(invoice.amountPaid)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.strong}>Balance due</Text>
                <Text style={styles.strong}>{pdfMoney(balance)}</Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.footer}>
          {invoice.notes ? (
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.noteLabel}>Notes</Text>
              <Text style={styles.noteBody}>{invoice.notes}</Text>
            </View>
          ) : null}

          {invoice.payments.length > 0 ? (
            <View>
              <Text style={styles.noteLabel}>Payments received</Text>
              {invoice.payments.map((p, i) => (
                <Text key={i} style={styles.noteBody}>
                  {p.createdAt.slice(0, 10)} · {p.method.replace("_", " ")} · {pdfMoney(p.amount)}
                </Text>
              ))}
            </View>
          ) : null}

          <Text style={styles.thanks}>
            Thank you for shopping with {shop.name}. Questions? {shop.email}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Convenience wrapper so route handlers (plain .ts files) can render the
 * PDF without needing JSX themselves.
 */
export async function renderInvoicePdf(
  invoice: InvoiceView,
  shop: ShopInfo,
): Promise<Buffer> {
  return renderToBuffer(<InvoicePDF invoice={invoice} shop={shop} />);
}
