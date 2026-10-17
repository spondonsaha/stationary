"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCartContext } from "@/components/cart/CartProvider";
import { formatMoney, shopConfig } from "@/lib/config";
import { CartLines } from "./CartLines";

const TAX = shopConfig.taxRatePercent;

export function CartDrawer() {
  const { open, closeCart, items, subtotal, count } = useCartContext();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus into the drawer when it opens (a11y).
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const tax = Math.round(subtotal * TAX) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 print-hide" role="presentation">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px] animate-fade-in"
        onClick={closeCart}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper shadow-drawer animate-slide-in-right"
      >
        <header className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Your cart{" "}
            <span className="text-sm font-sans font-medium text-ink-400">
              ({count} item{count === 1 ? "" : "s"})
            </span>
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeCart}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-ink-50"
            aria-label="Close cart"
          >
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <CartLines onNavigate={closeCart} />

        {items.length > 0 ? (
          <footer className="space-y-3 border-t border-ink-100 bg-white px-4 py-4">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-ink-500">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-500">
                <dt>Tax ({TAX}%)</dt>
                <dd className="tabular-nums">{formatMoney(tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-ink-100 pt-1.5 text-base font-semibold text-ink">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatMoney(total)}</dd>
              </div>
            </dl>
            <div className="grid gap-2">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="inline-flex h-12 items-center justify-center rounded-md bg-ink text-sm font-medium text-paper-50 btn-press"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="inline-flex h-11 items-center justify-center rounded-md border border-ink-200 bg-white text-sm font-medium text-ink btn-press"
              >
                View full cart
              </Link>
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
