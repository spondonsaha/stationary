import { requireAdmin } from "@/lib/auth/guard";
import { listCategoriesWithCounts } from "@/lib/queries/admin";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "New product" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();
  const cats = await listCategoriesWithCounts();

  return (
    <div>
      <PageHeader title="New product" description="Add an item to the catalog." />
      <ProductForm mode="create" categories={cats.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
