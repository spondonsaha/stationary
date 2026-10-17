import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { listCategoriesWithCounts } from "@/lib/queries/admin";
import { Card, PageHeader } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; deleted?: string; error?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const cats = await listCategoriesWithCounts();

  const notice = sp.error
    ? { tone: "error" as const, text: sp.error === "in-use" ? "That category still has products — move or delete them first." : "Something went wrong." }
    : sp.created
      ? { tone: "ok" as const, text: "Category created." }
      : sp.updated
        ? { tone: "ok" as const, text: "Category updated." }
        : sp.deleted
          ? { tone: "ok" as const, text: "Category deleted." }
          : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Group the catalog for storefront browsing." />

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

      <Card title="Add a category" description="Name, optional slug and image">
        <CategoryForm mode="create" />
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {cats.map((c) => (
          <Card
            key={c.id}
            title={c.name}
            description={`/${c.slug} · ${c.productCount} product${c.productCount === 1 ? "" : "s"}`}
          >
            <CategoryForm
              mode="edit"
              values={{
                id: c.id,
                name: c.name,
                slug: c.slug,
                description: c.description,
                image: c.image,
                productCount: c.productCount,
              }}
            />
          </Card>
        ))}
        {cats.length === 0 ? (
          <p className="text-sm text-ink-400">No categories yet — add your first above.</p>
        ) : null}
      </div>

      <p className="text-sm text-ink-400">
        Products are managed in{" "}
        <Link href="/admin/products" className="font-medium text-ink-500 hover:text-ink">
          Products
        </Link>
        .
      </p>
    </div>
  );
}
