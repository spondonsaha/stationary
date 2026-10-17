import { requireAdmin } from "@/lib/auth/guard";
import { PageHeader } from "@/components/admin/ui";
import { listDepartmentsWithCounts } from "@/lib/queries/admin";
import { AdminOrderForm } from "@/components/admin/AdminOrderForm";

export const metadata = { title: "New order" };
export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  await requireAdmin();
  const departments = await listDepartmentsWithCounts();

  return (
    <div>
      <PageHeader
        title="New order"
        description="Place an order on behalf of a student, staff member or department. Prices are taken from the live catalog."
      />
      <AdminOrderForm departments={departments.map((d) => ({ id: d.id, name: d.name, code: d.code }))} />
    </div>
  );
}
