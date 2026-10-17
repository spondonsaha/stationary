import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { shopConfig } from "@/lib/config";
import { getCategories, getFeaturedProducts, getNewArrivals } from "@/lib/queries/catalog";
import { ProductCard, ProductGridSkeleton } from "@/components/storefront/ProductCard";

export default async function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero — institutional navy, classic serif heading, no client JS     */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-ink-700 bg-ink-700 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink-200">
              {shopConfig.university}
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              The campus bookstore for courses, labs &amp; offices.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-100 sm:text-lg">
              Textbooks, stationery, drawing and lab supplies, and office essentials —
              with instant, itemised invoicing on every order.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex h-12 items-center rounded-md bg-white px-6 text-sm font-semibold text-ink-700 btn-press hover:bg-ink-50"
              >
                Browse the catalogue
              </Link>
              <Link
                href="#departments"
                className="inline-flex h-12 items-center rounded-md border border-ink-300 px-6 text-sm font-semibold text-white btn-press hover:bg-ink-600"
              >
                Order for a department
              </Link>
            </div>

            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-100">
              {["Pickup or campus delivery", "Instant numbered invoice", "Department &amp; PO accounts"].map(
                (label) => (
                  <li key={label} className="flex items-center gap-2">
                    <svg viewBox="0 0 16 16" width="16" height="16" className="text-pencil-300" aria-hidden>
                      <path
                        d="M3 8.5l3.2 3.2L13 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span dangerouslySetInnerHTML={{ __html: label }} />
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="relative mx-auto hidden aspect-[4/3] w-full max-w-md overflow-hidden rounded-card border border-ink-600 md:block">
            <Image
              src="/images/hero-bookstore.jpg"
              alt={`${shopConfig.university} ${shopConfig.name}`}
              fill
              priority
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Order for Department block                                        */}
      {/* ---------------------------------------------------------------- */}
      <section id="departments" className="border-b border-ink-100 bg-paper-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Ordering for a department or faculty?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Departments can order on account using a purchase-order (PO) or budget code.
              Choose <span className="font-medium text-ink-700">Department</span> at checkout,
              enter your code, and we&rsquo;ll invoice the department directly with pickup or
              campus delivery.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link
              href="/products"
              className="inline-flex h-11 items-center rounded-md bg-ink px-5 text-sm font-semibold text-white btn-press hover:bg-ink-700"
            >
              Browse supplies
            </Link>
            <Link
              href="/products?audience=department"
              className="inline-flex h-11 items-center rounded-md border border-ink-200 bg-white px-5 text-sm font-semibold text-ink btn-press hover:border-ink-400"
            >
              Department picks
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Category tiles                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section id="categories" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
            Shop by category
          </h2>
          <Link href="/products" className="text-sm font-medium text-ink-500 hover:text-ink">
            View all →
          </Link>
        </div>
        <CategoryTiles />
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Featured + New arrivals (streamed, shell renders instantly)       */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">Featured picks</h2>
        <p className="mt-1 text-sm text-ink-500">Recommended by bookstore staff.</p>
        <div className="mt-6">
          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <FeaturedProducts />
          </Suspense>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">New arrivals</h2>
        <p className="mt-1 text-sm text-ink-500">Recently added to the shelf.</p>
        <div className="mt-6">
          <Suspense fallback={<ProductGridSkeleton count={8} />}>
            <NewArrivals />
          </Suspense>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* How ordering works                                                */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-ink-100 bg-paper-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="text-center font-serif text-2xl font-semibold text-ink sm:text-3xl">
            How ordering works
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["1. Browse", "Search or pick a category to find your supplies."],
              ["2. Add to cart", "Add items and adjust quantities any time."],
              ["3. Checkout", "Identify yourself as student, staff or department."],
              ["4. Invoice", "A numbered invoice is issued for collection or delivery."],
            ].map(([title, body]) => (
              <li key={title} className="rounded-card border border-ink-100 bg-white p-5 shadow-soft">
                <p className="font-semibold text-ink">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

async function CategoryTiles() {
  const cats = await getCategories();
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cats.map((c) => (
        <li key={c.id}>
          <Link
            href={`/products?category=${c.slug}`}
            className="group flex flex-col items-center gap-2 rounded-card border border-ink-100 bg-white p-4 text-center shadow-soft transition-colors hover:border-ink-300"
          >
            <span className="relative block h-20 w-20 overflow-hidden rounded-md bg-paper-100">
              {c.image ? (
                <Image src={c.image} alt="" fill sizes="80px" className="object-cover" />
              ) : null}
            </span>
            <span className="text-sm font-semibold text-ink-700 group-hover:text-ink">{c.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function FeaturedProducts() {
  const items = await getFeaturedProducts(4);
  if (items.length === 0) {
    return <p className="text-sm text-ink-500">No featured products yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

async function NewArrivals() {
  const items = await getNewArrivals(8);
  if (items.length === 0) {
    return <p className="text-sm text-ink-500">Nothing new right now — check back soon.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
