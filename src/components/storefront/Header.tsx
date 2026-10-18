import Link from "next/link";
import { Suspense } from "react";
import { getCategories } from "@/lib/queries/catalog";
import { shopConfig } from "@/lib/config";
import { CartButton } from "@/components/storefront/CartButton";
import { SearchBox } from "@/components/storefront/SearchBox";
import { MobileMenu } from "@/components/storefront/MobileMenu";
import { BrandMark } from "@/components/BrandMark";

export async function Header() {
  const cats = await getCategories();

  return (
    <header className="sticky top-0 z-40 print-hide">
      <div className="bg-ink text-white">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs sm:px-6">
          <span className="font-semibold tracking-[0.14em] text-pencil-200 uppercase">{shopConfig.university}</span>
          <span className="hidden text-ink-200 sm:inline">
            {shopConfig.name}
            {shopConfig.hours ? ` · ${shopConfig.hours}` : ""}
          </span>
        </div>
      </div>

      <div className="border-b border-ink-100 bg-paper-50/95 shadow-[0_1px_0_rgba(16,24,40,0.04)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 rounded"
            aria-label={`${shopConfig.name} home`}
          >
            <BrandMark />
            <span className="font-display text-lg font-semibold tracking-tight text-ink transition-colors group-hover:text-ink-700">
              {shopConfig.name}
            </span>
          </Link>

          <nav aria-label="Categories" className="ml-4 hidden items-center gap-0.5 lg:flex">
            {cats.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink"
              >
                {c.name}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:block">
              <Suspense fallback={<SearchBoxFallback />}>
                <SearchBox />
              </Suspense>
            </div>
            <CartButton />
            <MobileMenu categories={cats.map((c) => ({ name: c.name, slug: c.slug }))} />
          </div>
        </div>

        {/* Mobile search row */}
        <div className="px-4 pb-3 md:hidden">
          <Suspense fallback={<SearchBoxFallback />}>
            <SearchBox />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

/**
 * Static placeholder shown while the search box (which reads ?q) hydrates.
 * Keeps the shell fully static and avoids a layout shift.
 */
function SearchBoxFallback() {
  return (
    <div className="relative w-full">
      <div className="h-10 w-full rounded-md border border-ink-200 bg-white" aria-hidden />
      <span className="sr-only">Search products</span>
    </div>
  );
}
