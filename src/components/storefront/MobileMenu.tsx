"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function MobileMenu({ categories }: { categories: { name: string; slug: string }[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close when the route changes (link clicked inside the menu).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape and on outside click; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-category-menu"
        className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink transition-colors hover:bg-ink-50 btn-press"
        aria-label={open ? "Close menu" : "Browse categories"}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-7rem)] overflow-y-auto border-b border-ink-100 bg-white shadow-lift">
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
