import { requireAdmin } from "@/lib/auth/guard";
import { PageHeader } from "@/components/admin/ui";
import { ManualInvoiceForm } from "@/components/admin/ManualInvoiceForm";

export const metadata = { title: "New invoice" };
export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  await requireAdmin();
  return (
    <div>
      <PageHeader
        title="New invoice"
        description="Build a walk-in or phone order. Search the catalog or add free-text lines."
      />
      <ManualInvoiceForm />
    </div>
  );
}
