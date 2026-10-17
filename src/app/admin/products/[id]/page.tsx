import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { getAdminProduct, listCategoriesWithCounts, listProductMovements } from "@/lib/queries/admin";
import { formatDate } from "@/lib/utils";
import { Card, PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Edit product" };
export const dynamic = "force-dynamic";

const REASON_LABEL: Record<string, string> = {
  initial: "Opening stock",
  restock: "Restock",
  sale: "Sale",
  adjustment: "Adjustment",
  return: "Return",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [product, cats, movements] = await Promise.all([
    getAdminProduct(id),
    listCategoriesWithCounts(),
    listProductMovements(id, 20),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Edit product" description={product.name} />
      <ProductForm
        mode="edit"
        categories={cats.map((c) => ({ id: c.id, name: c.name }))}
        values={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          sku: product.sku,
          brand: product.brand,
          price: product.price,
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold,
          categoryId: product.categoryId,
          image: product.image,
          status: product.status,
          featured: product.featured,
        }}
      />

      <Card title="Stock ledger" description="Every change to this product's stock">
        {movements.length === 0 ? (
          <p className="text-sm text-ink-400">No stock movements recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="py-2 pr-4 font-semibold">When</th>
                  <th className="py-2 pr-4 font-semibold">Reason</th>
                  <th className="py-2 pr-4 text-right font-semibold">Change</th>
                  <th className="py-2 pr-4 text-right font-semibold">Balance</th>
                  <th className="py-2 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b border-ink-100/70 last:border-0">
                    <td className="py-2.5 pr-4 text-ink-500">{formatDate(m.createdAt)}</td>
                    <td className="py-2.5 pr-4">{REASON_LABEL[m.reason] ?? m.reason}</td>
                    <td className="py-2.5 pr-4 text-right">
                      <Badge tone={m.delta >= 0 ? "success" : "danger"}>
                        {m.delta >= 0 ? `+${m.delta}` : m.delta}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-ink-700">{m.balanceAfter}</td>
                    <td className="py-2.5 text-ink-400">
                      {m.note ?? (m.referenceType ? `${m.referenceType} ${String(m.referenceId).slice(0, 8)}` : "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
