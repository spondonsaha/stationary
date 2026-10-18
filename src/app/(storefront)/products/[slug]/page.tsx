import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatMoney, shopConfig } from "@/lib/config";
import { getProductBySlug, getProductsPage } from "@/lib/queries/catalog";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductPurchasePanel } from "@/components/storefront/ProductPurchasePanel";
import { Badge } from "@/components/ui/Badge";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      images: product.image ? [product.image] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const price = Number(product.price);
  const out = product.stock <= 0;
  const low = !out && product.stock <= 8;

  const related = await getProductsPage({
    category: product.categorySlug,
    sort: "newest",
    page: 1,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-400">
        <Link href="/" className="transition-colors hover:text-ink">
          Home
        </Link>{" "}
        /{" "}
        <Link href={`/products?category=${product.categorySlug}`} className="transition-colors hover:text-ink">
          {product.categoryName}
        </Link>{" "}
        / <span className="text-ink-600">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-ink-100 bg-paper-100 shadow-card">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : null}
          </div>
        </div>

        <div className="flex flex-col">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-pencil-400">
            {product.categoryName}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            {product.name}
          </h1>
          <div className="rule-gold mt-4" aria-hidden />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {out ? (
              <Badge tone="danger">Out of stock</Badge>
            ) : (
              <Badge tone="success">In stock · {product.stock} available</Badge>
            )}
            {low ? <Badge tone="warning">Low stock</Badge> : null}
            <Badge tone="neutral">SKU {product.sku}</Badge>
          </div>

          <p className="mt-6 font-display text-4xl font-semibold tabular-nums text-ink">
            {formatMoney(price)}
          </p>
          <p className="mt-1 text-xs text-ink-400">
            Tax ({shopConfig.taxRatePercent}%) calculated at checkout.
          </p>

          {/* Client: qty selector + add to cart. Server-rendered fallback keeps
              the price/details visible without JS. */}
          <ProductPurchasePanel
            product={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              sku: product.sku,
              image: product.image,
              unitPrice: price,
              stock: product.stock,
            }}
          />

          <div className="mt-8 rounded-card border border-ink-100 bg-white p-6 shadow-card">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-pencil-400">
              Description
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{product.description}</p>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-card border border-ink-100 bg-white p-4 shadow-card">
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">Category</dt>
              <dd className="mt-1 font-medium text-ink-800">{product.categoryName}</dd>
            </div>
            <div className="rounded-card border border-ink-100 bg-white p-4 shadow-card">
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">Added</dt>
              <dd className="mt-1 font-medium text-ink-800">
                {new Date(product.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </dd>
            </div>
          </dl>

          <ul className="mt-4 space-y-2.5 rounded-card border border-ink-100 bg-paper-100 p-4 text-sm text-ink-600">
            {[
              ["Instant numbered invoice", "M4 8.5l3.2 3.2L13 5"],
              ["Pickup or campus delivery", "M3 13h13V6H3zM16 9h3l2 3v4h-5M6.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"],
              ["Department PO accepted", "M3 7h18v12H3zM3 11h18M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"],
            ].map(([label, d]) => (
              <li key={label} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf-soft text-leaf">
                  <svg viewBox="0 0 16 16" width="11" height="11" fill="none" aria-hidden>
                    <path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="mt-20" aria-labelledby="related-heading">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-pencil-400">
          You may also like
        </p>
        <h2 id="related-heading" className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
          More in {product.categoryName}
        </h2>
        <div className="rule-gold mt-4" aria-hidden />
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {related.items
            .filter((p) => p.id !== product.id)
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>
    </div>
  );
}
