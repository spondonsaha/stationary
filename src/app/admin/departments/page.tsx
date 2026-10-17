import { requireAdmin } from "@/lib/auth/guard";
import { listDepartmentsWithCounts } from "@/lib/queries/admin";
import { Card, PageHeader } from "@/components/admin/ui";
import { DepartmentForm } from "@/components/admin/DepartmentForm";

export const metadata = { title: "Departments" };
export const dynamic = "force-dynamic";

export default async function AdminDepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; deleted?: string; error?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const depts = await listDepartmentsWithCounts();

  const notice = sp.error
    ? { tone: "error" as const, text: "Something went wrong." }
    : sp.created
      ? { tone: "ok" as const, text: "Department created." }
      : sp.updated
        ? { tone: "ok" as const, text: "Department updated." }
        : sp.deleted
          ? { tone: "ok" as const, text: "Department deleted." }
          : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Faculties and administrative departments that can order on account."
      />

      {notice ? (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={
            notice.tone === "error"
              ? "rounded-md border border-[#f5c9c4] bg-eraser-soft px-4 py-3 text-sm font-medium text-[#8c3b34]"
              : "rounded-md border border-[#c8e6d5] bg-leaf-soft px-4 py-3 text-sm font-medium text-[#1f5c40]"
          }
        >
          {notice.text}
        </p>
      ) : null}

      <Card title="Add a department" description="Name, code and optional billing contact">
        <DepartmentForm mode="create" />
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {depts.map((d) => (
          <Card
            key={d.id}
            title={`${d.name} (${d.code})`}
            description={`${d.active ? "Active" : "Inactive"}${d.faculty ? ` · ${d.faculty}` : ""}`}
          >
            <DepartmentForm
              mode="edit"
              values={{
                id: d.id,
                name: d.name,
                code: d.code,
                faculty: d.faculty,
                budgetCode: d.budgetCode,
                contactName: d.contactName,
                contactEmail: d.contactEmail,
                active: d.active,
                orderCount: Number(d.orderCount),
              }}
            />
          </Card>
        ))}
        {depts.length === 0 ? (
          <p className="text-sm text-ink-400">No departments yet — add your first above.</p>
        ) : null}
      </div>
    </div>
  );
}
