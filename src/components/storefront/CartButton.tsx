"use client";

import { useCartContext } from "@/components/cart/CartProvider";
import { useCartBump } from "@/lib/cart/store";

export function CartButton() {
  const { count, openCart } = useCartContext();
  const bump = useCartBump();

  return (
    <button
      type="button"
      onClick={openCart}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-ink transition-colors hover:bg-ink-50 btn-press"
      aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
    >
      <svg viewBox="0 0 24 24" className="h-5.5 w-5.5" fill="none" aria-hidden width="22" height="22">
        <path
          d="M4 6h2l1.2 9.5a1.5 1.5 0 001.5 1.3h7.9a1.5 1.5 0 001.5-1.2L20 9H7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="20" r="1.4" fill="currentColor" />
        <circle cx="16.5" cy="20" r="1.4" fill="currentColor" />
      </svg>
      {count > 0 ? (
        <span
          key={bump}
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-md bg-ink px-1 text-[11px] font-bold text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}
