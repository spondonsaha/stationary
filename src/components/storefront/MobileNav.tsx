"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartContext } from "@/components/cart/CartProvider";

const items = [
  {
    href: "/",
    label: "Home",
    icon: (
      <path d="M4 11l8-7 8 7v8a2 2 0 01-2 2h-4v-6h-4v6H6a2 2 0 01-2-2v-8z" strokeLinejoin="round" />
    ),
  },
  {
    href: "/products",
    label: "Shop",
    icon: (
      <>
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    href: "/cart",
    label: "Cart",
    icon: (
      <>
        <path d="M4 6h2l1.4 9.2a1.5 1.5 0 001.5 1.3h7.5a1.5 1.5 0 001.5-1.2L19.5 9H7" strokeLinejoin="round" />
        <circle cx="10" cy="19.5" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="16" cy="19.5" r="1.2" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    href: "/checkout",
    label: "Checkout",
    icon: (
      <>
        <rect x="4" y="7" width="16" height="12" rx="2" />
        <path d="M4 11h16M8 4v3M16 4v3" strokeLinecap="round" />
      </>
    ),
  },
];

/** Sticky bottom navigation bar on mobile (thumb-friendly, min 44px targets). */
export function MobileNav() {
  const pathname = usePathname();
  const { count } = useCartContext();

  // Hidden on invoice print views and when the on-screen keyboard is likely open.
  if (pathname.startsWith("/invoice/")) return null;

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-paper/95 backdrop-blur print-hide md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href) && !(item.href === "/checkout" && pathname === "/cart");
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                  active ? "text-ink" : "text-ink-400"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden
                >
                  {item.icon}
                </svg>
                {item.label}
                {item.label === "Cart" && count > 0 ? (
                  <span className="absolute right-[calc(50%-22px)] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-md bg-pencil px-1 text-[10px] font-bold text-ink-900">
                    {count}
                  </span>
                ) : null}
                {active ? (
                  <span className="absolute inset-x-6 top-0 h-0.5 rounded-md bg-pencil" aria-hidden />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
