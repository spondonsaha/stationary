import Link from "next/link";
import { shopConfig } from "@/lib/config";
import { getCategories } from "@/lib/queries/catalog";
import { BrandMark } from "@/components/BrandMark";

export async function Footer() {
  const cats = await getCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t-4 border-pencil-300 bg-ink-800 text-ink-100 print-hide">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-9 w-9" />
            <div>
              <p className="font-display text-lg font-semibold leading-tight text-white">
                {shopConfig.name}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-pencil-300">
                {shopConfig.university}
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-200">
            {shopConfig.tagline}. Browse, add to cart, check out — your itemised invoice is issued
            immediately.
          </p>
          <address className="mt-5 space-y-1.5 text-sm not-italic text-ink-200">
            {shopConfig.address ? <p>{shopConfig.address}</p> : null}
            {shopConfig.hours ? (
              <p className="flex items-center gap-2">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" className="shrink-0 text-pencil-300" aria-hidden>
                  <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {shopConfig.hours}
              </p>
            ) : null}
            {shopConfig.phone ? (
              <p>
                <a className="link-underline text-ink-200 hover:text-white" href={`tel:${shopConfig.phone.replace(/[^+\d]/g, "")}`}>
                  {shopConfig.phone}
                </a>
              </p>
            ) : null}
            <p>
              <a className="link-underline text-ink-200 hover:text-white" href={`mailto:${shopConfig.email}`}>
                {shopConfig.email}
              </a>
            </p>
          </address>
        </div>

        <nav aria-label="Shop categories">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-pencil-300">Shop</h2>
          <span className="mt-2.5 mb-3 block h-px w-8 bg-ink-500" aria-hidden />
          <ul className="space-y-2.5 text-sm">
            {cats.map((c) => (
              <li key={c.id}>
                <Link href={`/products?category=${c.slug}`} className="link-underline text-ink-200 hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Help">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-pencil-300">Help</h2>
          <span className="mt-2.5 mb-3 block h-px w-8 bg-ink-500" aria-hidden />
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/products" className="link-underline text-ink-200 hover:text-white">
                All products
              </Link>
            </li>
            <li>
              <Link href="/cart" className="link-underline text-ink-200 hover:text-white">
                Your cart
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="link-underline text-ink-200 hover:text-white">
                Checkout
              </Link>
            </li>
            <li className="pt-2 text-xs leading-relaxed text-ink-300">
              Departments can order on account with a PO or budget code at checkout.
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-ink-600">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-ink-300 sm:flex-row sm:px-6">
          <p>© {year} {shopConfig.university} {shopConfig.name}. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            All prices in <span className="font-semibold text-pencil-300">{shopConfig.currency}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
