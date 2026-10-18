import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { shopConfig } from "@/lib/config";
import { getCategories, getFeaturedProducts, getNewArrivals } from "@/lib/queries/catalog";
import { ProductCard, ProductGridSkeleton } from "@/components/storefront/ProductCard";
import { Reveal } from "@/components/ui/Reveal";

export default async function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero — navy mesh backdrop, serif headline, gold rule, trust chips  */}
      {/* ---------------------------------------------------------------- */}
      <section className="hero-mesh grain relative overflow-hidden text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div className="relative z-10 max-w-xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-pencil-200 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-pencil-300" aria-hidden />
              {shopConfig.university}
            </p>
            <h1 className="animate-fade-up font-serif text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl" style={{ animationDelay: "60ms" }}>
              The campus bookstore for courses, labs &amp; offices.
            </h1>
            <div className="rule-gold mt-6 animate-fade-up" style={{ animationDelay: "160ms" }} aria-hidden />
            <p className="mt-6 max-w-md animate-fade-up text-base leading-relaxed text-ink-100 sm:text-lg" style={{ animationDelay: "220ms" }}>
              Textbooks, stationery, drawing and lab supplies, and office essentials —
              with instant, itemised invoicing on every order.
            </p>
            <div className="mt-9 flex animate-fade-up flex-wrap gap-3" style={{ animationDelay: "300ms" }}>
              <Link
                href="/products"
                className="inline-flex h-12 items-center rounded-md bg-white px-7 text-sm font-semibold text-ink-700 shadow-lift transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                Browse the catalogue
              </Link>
              <Link
                href="#departments"
                className="inline-flex h-12 items-center rounded-md border border-white/25 bg-white/5 px-7 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-white/10"
              >
                Order for a department
              </Link>
            </div>

            <ul className="mt-10 flex animate-fade-up flex-wrap gap-x-5 gap-y-2.5 text-sm text-ink-100" style={{ animationDelay: "380ms" }}>
              {[
                ["Pickup or campus delivery", "M4 11l8-7 8 7v8a2 2 0 01-2 2h-4v-6h-4v6H6a2 2 0 01-2-2v-8z"],
                ["Instant numbered invoice", "M4 4h12v16H4zM7 8h6M7 12h6M7 16h4"],
                ["Department & PO accounts", "M3 7h18v12H3zM3 11h18M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"],
              ].map(([label, d]) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pencil-300/15 text-pencil-300">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden>
                      <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 mx-auto hidden aspect-[4/3] w-full max-w-md animate-fade-up md:block" style={{ animationDelay: "200ms" }}>
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-pencil-300/20 via-transparent to-white/10 blur-2xl" aria-hidden />
            <div className="relative h-full overflow-hidden rounded-2xl border border-white/15 shadow-card-hover">
              <Image
                src="/images/hero-bookstore.jpg"
                alt={`${shopConfig.university} ${shopConfig.name}`}
                fill
                priority
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/45 via-transparent to-transparent" aria-hidden />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Order for Department block                                        */}
      {/* ---------------------------------------------------------------- */}
      <section id="departments" className="border-b border-ink-100 bg-paper-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
          <Reveal className="max-w-2xl">
            <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
              Ordering for a department or faculty?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Departments can order on account using a purchase-order (PO) or budget code.
              Choose <span className="font-medium text-ink-700">Department</span> at checkout,
              enter your code, and we&rsquo;ll invoice the department directly with pickup or
              campus delivery.
            </p>
          </Reveal>
          <Reveal className="flex shrink-0 gap-3" delay={100}>
            <Link
              href="/products"
              className="inline-flex h-11 items-center rounded-md bg-ink px-5 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink-700 hover:shadow-lift"
            >
              Browse supplies
            </Link>
            <Link
              href="/products?audience=department"
              className="inline-flex h-11 items-center rounded-md border border-ink-200 bg-white px-5 text-sm font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-400 hover:shadow-soft"
            >
              Department picks
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Category tiles — full-bleed images, gradient overlay, hover zoom   */}
      {/* ---------------------------------------------------------------- */}
      <section id="categories" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Reveal className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-pencil-400">
            Catalogue
          </p>
          <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
            Shop by category
          </h2>
          <div className="rule-gold mt-4" aria-hidden />
        </Reveal>
        <CategoryTiles />
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Featured + New arrivals (streamed, shell renders instantly)       */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <Reveal className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-pencil-400">
            Staff picks
          </p>
          <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
            Featured picks
          </h2>
          <div className="rule-gold mt-4" aria-hidden />
        </Reveal>
        <div className="mt-2">
          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <FeaturedProducts />
          </Suspense>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Reveal className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-pencil-400">
            Just in
          </p>
          <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
            New arrivals
          </h2>
          <div className="rule-gold mt-4" aria-hidden />
        </Reveal>
        <div className="mt-2">
          <Suspense fallback={<ProductGridSkeleton count={8} />}>
            <NewArrivals />
          </Suspense>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* How ordering works — gold medallions on a connecting rail         */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-ink-100 bg-paper-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <Reveal className="text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-pencil-400">
              Simple process
            </p>
            <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
              How ordering works
            </h2>
            <div className="rule-gold mx-auto mt-4" aria-hidden />
          </Reveal>
          <ol className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-ink-200 to-transparent lg:block" aria-hidden />
            {[
              ["1", "Browse", "Search or pick a category to find your supplies.", "M11 4a7 7 0 105.2 11.7L21 20.5 22.5 19l-4.8-4.8A7 7 0 0011 4z"],
              ["2", "Add to cart", "Add items and adjust quantities any time.", "M4 6h2l1.4 9.2a1.5 1.5 0 001.5 1.3h7.5a1.5 1.5 0 001.5-1.2L19.5 9H7M10 19.5h.01M17 19.5h.01"],
              ["3", "Checkout", "Identify yourself as student, staff or department.", "M4 7h16v12H4zM4 11h16M8 4v3M16 4v3"],
              ["4", "Invoice", "A numbered invoice is issued for collection or delivery.", "M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h4"],
            ].map(([n, title, body, d], i) => (
              <Reveal as="li" key={title} delay={i * 90} className="relative flex flex-col items-center text-center">
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-pencil-200 bg-gradient-to-b from-white to-paper-100 shadow-soft">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" className="text-pencil-400" aria-hidden>
                    <path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">
                    {n}
                  </span>
                </span>
                <p className="mt-4 font-semibold text-ink">{title}</p>
                <p className="mt-1.5 max-w-[220px] text-sm leading-relaxed text-ink-500">{body}</p>
              </Reveal>
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
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {cats.map((c, i) => (
        <Reveal as="li" key={c.id} delay={i * 60}>
          <Link
            href={`/products?category=${c.slug}`}
            className="group relative block aspect-[4/5] overflow-hidden rounded-card border border-ink-100 bg-ink-700 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
          >
            {c.image ? (
              <>
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover img-zoom"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/25 to-transparent transition-opacity duration-300 group-hover:from-ink-900/90"
                  aria-hidden
                />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-ink-600 to-ink-800" aria-hidden />
            )}
            <span className="absolute inset-x-0 bottom-0 p-4 text-center text-sm font-semibold text-white drop-shadow-sm">
              {c.name}
            </span>
          </Link>
        </Reveal>
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
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
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
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
