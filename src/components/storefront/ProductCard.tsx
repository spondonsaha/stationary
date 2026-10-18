import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/config";
import type { ProductListItem } from "@/lib/queries/catalog";
import { AddToCartButton } from "./AddToCartButton";
import { Badge } from "@/components/ui/Badge";

export function ProductCard({ product }: { product: ProductListItem }) {
  const price = Number(product.price);
  const out = product.stock <= 0;
  const low = !out && product.stock <= 5;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-ink-100 bg-white shadow-card card-lift">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-paper-100"
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover img-zoom"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300" aria-hidden>
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M3 16l5-5 4 4 3-3 6 6" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {out ? (
          <span className="absolute left-3 top-3">
            <Badge tone="danger">Out of stock</Badge>
          </span>
        ) : low ? (
          <span className="absolute left-3 top-3">
            <Badge tone="warning">Only {product.stock} left</Badge>
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-pencil-400">
          {product.categoryName}
        </p>
        <h3 className="text-sm font-semibold leading-snug text-ink-800">
          <Link href={`/products/${product.slug}`} className="transition-colors hover:text-ink-700">
            <span className="line-clamp-2">{product.name}</span>
          </Link>
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <p className="font-display text-lg font-semibold tabular-nums text-ink">{formatMoney(price)}</p>
          <AddToCartButton
            product={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              sku: product.sku,
              image: product.image,
              unitPrice: price,
              stock: product.stock,
            }}
            size="sm"
            className="h-9 rounded-md px-3"
            addToCartLabel="Add"
          />
        </div>
      </div>
    </article>
  );
}

export function ProductRow({ product }: { product: ProductListItem }) {
  const price = Number(product.price);
  const out = product.stock <= 0;
  const low = !out && product.stock <= 5;

  return (
    <article className="flex gap-4 rounded-card border border-ink-100 bg-white p-3 shadow-card card-lift">
      <Link
        href={`/products/${product.slug}`}
        className="relative block h-28 w-28 shrink-0 overflow-hidden rounded-md bg-paper-100 sm:h-32 sm:w-32"
      >
        {product.image ? (
          <Image src={product.image} alt={product.name} fill sizes="128px" className="object-cover img-zoom" />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-pencil-400">
            {product.categoryName}
            {product.brand ? <span className="ml-1.5 font-medium normal-case tracking-normal text-ink-300">· {product.brand}</span> : null}
          </p>
          <h3 className="mt-0.5 text-base font-semibold leading-snug text-ink-800">
            <Link href={`/products/${product.slug}`} className="transition-colors hover:text-ink-700">
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-ink-500">{product.description}</p>
          <div className="mt-2 flex items-center gap-2">
            {out ? <Badge tone="danger">Out of stock</Badge> : null}
            {low ? <Badge tone="warning">Only {product.stock} left</Badge> : null}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 sm:mt-0 sm:shrink-0 sm:flex-col sm:items-end">
          <p className="font-display text-xl font-semibold text-ink">{formatMoney(price)}</p>
          <AddToCartButton
            product={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              sku: product.sku,
              image: product.image,
              unitPrice: price,
              stock: product.stock,
            }}
            size="sm"
            className="h-9 rounded-md px-3"
            addToCartLabel="Add"
          />
        </div>
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-card border border-ink-100 bg-white"
          aria-hidden
        >
          <div className="skeleton aspect-square rounded-none" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-3 w-1/3 rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton mt-3 h-8 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
