"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function MobileMenu({ categories }: { categories: { name: string; slug: string }[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-category-menu"
        className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink transition-colors hover:bg-ink-50 btn-press"
        aria-label="Browse categories"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          ) : (
            <>
              <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            </>
          )}
        </svg>
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-16 z-40 border-b border-ink-100 bg-white shadow-lift lg:hidden">
          <nav
            id="mobile-category-menu"
            aria-label="Categories"
            className="mx-auto grid max-w-7xl grid-cols-2 gap-1 p-4"
          >
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/products?category=${c.slug}`}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-paper-100"
              >
                {c.name}
              </Link>
            ))}
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="col-span-2 mt-1 rounded-md bg-ink-50 px-3 py-2.5 text-center text-sm font-semibold text-ink"
            >
              Shop everything →
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
