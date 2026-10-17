import Link from "next/link";
import { shopConfig } from "@/lib/config";
import { getCategories } from "@/lib/queries/catalog";
import { BrandMark } from "@/components/BrandMark";

export async function Footer() {
  const cats = await getCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink-100 bg-paper-50 print-hide">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="font-display text-lg font-semibold text-ink">{shopConfig.name}</span>
          </div>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-400">
            {shopConfig.university}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
            {shopConfig.tagline}. Browse, add to cart, check out — your itemised invoice is issued
            immediately.
          </p>
          <address className="mt-4 space-y-1 text-sm not-italic text-ink-500">
            {shopConfig.address ? <p>{shopConfig.address}</p> : null}
            {shopConfig.hours ? <p>{shopConfig.hours}</p> : null}
            {shopConfig.phone ? (
              <p>
                <a className="link-underline" href={`tel:${shopConfig.phone.replace(/[^+\d]/g, "")}`}>
                  {shopConfig.phone}
                </a>
              </p>
            ) : null}
            <p>
              <a className="link-underline" href={`mailto:${shopConfig.email}`}>
                {shopConfig.email}
              </a>
            </p>
          </address>
        </div>

        <nav aria-label="Shop categories">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Shop</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {cats.map((c) => (
              <li key={c.id}>
                <Link href={`/products?category=${c.slug}`} className="link-underline text-ink-500">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Help">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Help</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/products" className="link-underline text-ink-500">
                All products
              </Link>
            </li>
            <li>
              <Link href="/cart" className="link-underline text-ink-500">
                Your cart
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="link-underline text-ink-500">
                Checkout
              </Link>
            </li>
            <li className="text-ink-500">
              Departments can order on account with a PO or budget code at checkout.
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-ink-100 py-4 text-center text-xs text-ink-400">
        © {year} {shopConfig.university} {shopConfig.name}. All prices in {shopConfig.currency}.
      </div>
    </footer>
  );
}
