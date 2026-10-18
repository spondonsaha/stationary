"use client";

import Link from "next/link";
import { useCartContext } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/config";
import { CartLines } from "./CartLines";

/**
 * Full cart page. Reads the same localStorage-backed store as the drawer,
 * so state is always in sync. Renders a skeleton until hydrated to avoid
 * SSR/client markup mismatches.
 */
export function CartPageClient() {
  const { items, subtotal, count } = useCartContext();

  if (items.length === 0) {
    return (
      <div className="mt-8 flex min-h-[40vh] flex-col rounded-card border border-ink-100 bg-white shadow-soft">
        <CartLines />
      </div>
    );
  }

  const total = subtotal;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col overflow-hidden rounded-card border border-ink-100 bg-white shadow-soft">
        <div className="border-b border-ink-100 px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
            {count} item{count === 1 ? "" : "s"}
          </h2>
        </div>
        <CartLines />
      </div>

      <aside className="h-fit rounded-card border border-ink-100 bg-white p-5 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-ink-500">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-semibold text-ink">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(total)}</dd>
          </div>
        </dl>
        <Link
          href="/checkout"
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-md bg-ink text-sm font-medium text-paper-50 btn-press hover:bg-ink-700"
        >
          Proceed to checkout
        </Link>
        <Link
          href="/products"
          className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-md border border-ink-200 bg-white text-sm font-medium text-ink btn-press hover:border-ink-400"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
