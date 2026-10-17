import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { defaultReportRange, getSalesReport, type SalesReport } from "@/lib/queries/admin";
import { formatMoney } from "@/lib/config";
import { Card, DataTable, FilterForm, PageHeader, StatCard } from "@/components/admin/ui";
import { SalesChart } from "@/components/admin/SalesChart";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  guest: "Guest (walk-in)",
  student: "Student",
  faculty_staff: "Faculty & staff",
  department: "Department",
};

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank transfer",
  mobile_payment: "Mobile payment",
  department_account: "Department account",
  other: "Other",
};

function isDay(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const fallback = defaultReportRange(30);
  const from = isDay(sp.from) ? sp.from : fallback.from;
  const to = isDay(sp.to) && sp.to >= from ? sp.to : fallback.to;

  const report = await getSalesReport({ from, to });
  const csvHref = `/admin/reports/export?from=${report.from}&to=${report.to}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description={`Sales activity from ${report.from} to ${report.to}.`}
        actions={
          <Link
            href={csvHref}
            className="inline-flex h-11 items-center rounded-md border border-ink-200 bg-white px-5 text-sm font-medium text-ink btn-press"
          >
            Export CSV
          </Link>
        }
      />

      <FilterForm action="/admin/reports">
        <Field label="From" htmlFor="report-from">
          <Input id="report-from" name="from" type="date" defaultValue={report.from} />
        </Field>
        <Field label="To" htmlFor="report-to">
          <Input id="report-to" name="to" type="date" defaultValue={report.to} />
        </Field>
        <Button type="submit">Apply</Button>
      </FilterForm>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatMoney(report.totals.revenue)} hint="Non-void invoices" />
        <StatCard label="Invoices" value={String(report.totals.invoiceCount)} />
        <StatCard label="Average invoice" value={formatMoney(report.totals.avgInvoice)} />
        <StatCard
          label="Department share"
          value={formatMoney(departmentShare(report))}
          hint={`${sharePercent(report)}% of revenue`}
          tone="pencil"
        />
      </div>

      <Card title="Daily sales" description="Revenue per day in the selected range">
        <SalesChart data={report.days} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="By customer type" className="[&>div]:p-0">
          <DataTable
            caption="Revenue by customer type"
            empty={<span>No invoices in this range.</span>}
            columns={[
              { key: "type", label: "Type", render: (r) => TYPE_LABEL[r.customerType] ?? r.customerType },
              {
                key: "count",
                label: "Invoices",
                align: "right",
                render: (r) => String(r.invoiceCount),
              },
              {
                key: "revenue",
                label: "Revenue",
                align: "right",
                render: (r) => <span className="tabular-nums">{formatMoney(r.revenue)}</span>,
              },
            ]}
            rows={report.byType.map((r, i) => ({ ...r, id: i }))}
          />
        </Card>

        <Card title="By payment method" description="Payments recorded in range" className="[&>div]:p-0">
          <DataTable
            caption="Revenue by payment method"
            empty={<span>No payments recorded in this range.</span>}
            columns={[
              { key: "method", label: "Method", render: (r) => METHOD_LABEL[r.method] ?? r.method },
              {
                key: "amount",
                label: "Amount",
                align: "right",
                render: (r) => <span className="tabular-nums">{formatMoney(r.amount)}</span>,
              },
            ]}
            rows={report.byPayment.map((r, i) => ({ ...r, id: i }))}
          />
        </Card>
      </div>

      <Card title="Top products" description="Best sellers by revenue" className="[&>div]:p-0">
        <DataTable
          caption="Top products"
          empty={<span>No items sold in this range.</span>}
          columns={[
            { key: "name", label: "Product", render: (r) => r.name },
            { key: "qty", label: "Units", align: "right", render: (r) => String(r.quantity) },
            {
              key: "revenue",
              label: "Revenue",
              align: "right",
              render: (r) => <span className="tabular-nums">{formatMoney(r.revenue)}</span>,
            },
          ]}
          rows={report.topProducts.map((r, i) => ({ ...r, id: i }))}
        />
      </Card>
    </div>
  );
}

function departmentShare(report: SalesReport): number {
  const dept = report.byType.find((r) => r.customerType === "department");
  return dept ? dept.revenue : 0;
}

function sharePercent(report: SalesReport): number {
  if (report.totals.revenue <= 0) return 0;
  return Math.round((departmentShare(report) / report.totals.revenue) * 100);
}
