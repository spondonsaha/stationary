import { defaultReportRange, getSalesReport } from "@/lib/queries/admin";
import { getSessionAdmin } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  guest: "Guest (walk-in)",
  student: "Student",
  faculty_staff: "Faculty & staff",
  department: "Department",
};

/**
 * Sales report as CSV (daily totals + a customer-type breakdown), for opening
 * in a spreadsheet. Auth: the same admin session used by the dashboard.
 */
export async function GET(req: Request) {
  const admin = await getSessionAdmin();
  if (!admin) return new Response("Not authenticated", { status: 401 });

  const url = new URL(req.url);
  const fallback = defaultReportRange(30);
  const from = url.searchParams.get("from") ?? fallback.from;
  const to = url.searchParams.get("to") ?? fallback.to;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return new Response("Invalid date range", { status: 400 });
  }

  const report = await getSalesReport({ from, to: to >= from ? to : from });

  const rows: string[][] = [
    ["Northgate University Bookstore - sales report"],
    [`Range,${report.from},${report.to}`],
    [`Invoices,${report.totals.invoiceCount}`],
    [`Revenue,${report.totals.revenue.toFixed(2)}`],
    [],
    ["date", "invoices", "revenue"],
    ...report.days.map((d) => [d.date, String(d.invoiceCount), d.revenue.toFixed(2)]),
    [],
    ["customer_type", "invoices", "revenue"],
    ...report.byType.map((t) => [TYPE_LABEL[t.customerType] ?? t.customerType, String(t.invoiceCount), t.revenue.toFixed(2)]),
  ];

  const body = rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sales-report-${report.from}_${report.to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
