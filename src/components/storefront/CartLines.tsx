"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartContext } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/config";
import { QuantitySelector } from "./QuantitySelector";

/** Shared line-item list used by both the drawer and the full cart page. */
export function CartLines({ onNavigate }: { onNavigate?: () => void }) {
  const { items, setQuantity, removeItem } = useCartContext();

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <svg viewBox="0 0 48 48" width="56" height="56" fill="none" aria-hidden className="text-ink-200">
          <path
            d="M8 12h4l2.8 19a3 3 0 003 2.6h14.6a3 3 0 003-2.4L38 18H13"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="19" cy="39" r="2.4" fill="currentColor" />
          <circle cx="31" cy="39" r="2.4" fill="currentColor" />
        </svg>
        <p className="font-display text-lg font-semibold text-ink">Your cart is empty</p>
        <p className="max-w-xs text-sm text-ink-500">
          Fill it with pens, notebooks and everything in between.
        </p>
        <Link
          href="/products"
          onClick={onNavigate}
          className="mt-2 inline-flex h-11 items-center rounded-md bg-ink px-5 text-sm font-medium text-paper-50 btn-press"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex-1 divide-y divide-ink-100 overflow-y-auto px-4">
      {items.map((item) => (
        <li key={item.productId} className="flex gap-3 py-4">
          <Link
            href={`/products/${item.slug}`}
            onClick={onNavigate}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-ink-100 bg-paper-100"
          >
            {item.image ? (
              <Image
                src={item.image}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : null}
          </Link>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/products/${item.slug}`}
                onClick={onNavigate}
                className="text-sm font-semibold leading-snug text-ink-800 hover:text-ink line-clamp-2"
              >
                {item.name}
              </Link>
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="shrink-0 rounded-md p-1.5 text-ink-300 transition-colors hover:bg-eraser-soft hover:text-[#8c3b34]"
                aria-label={`Remove ${item.name} from cart`}
              >
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
                  <path d="M3 4.5h10M6.5 4V3h3v1M4.5 4.5l.6 8a1 1 0 001 .9h3.8a1 1 0 001-.9l.6-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="mt-0.5 text-xs text-ink-400">
              {item.sku} · {formatMoney(item.unitPrice)} each
            </p>
            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
              <QuantitySelector
                size="sm"
                value={item.quantity}
                max={Math.max(1, item.stock)}
                onChange={(v) => setQuantity(item.productId, v)}
                label={`Quantity of ${item.name}`}
              />
              <p className="text-sm font-semibold tabular-nums text-ink">
                {formatMoney(item.unitPrice * item.quantity)}
              </p>
            </div>
            {item.quantity >= item.stock ? (
              <p className="mt-1 text-xs text-pencil-500">Max stock reached ({item.stock} available)</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
