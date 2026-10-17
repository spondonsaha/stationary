"use client";

import { useState } from "react";
import { QuantitySelector } from "./QuantitySelector";
import { AddToCartButton, type CartProduct } from "./AddToCartButton";

/**
 * Purchase panel on the product detail page: quantity picker + add to cart.
 * Renders a no-JS friendly note when disabled via server markup around it.
 */
export function ProductPurchasePanel({ product }: { product: CartProduct }) {
  const [qty, setQty] = useState(1);
  const max = Math.max(1, product.stock);

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-card border border-ink-100 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink-600">Quantity</span>
        <QuantitySelector
          value={qty}
          onChange={(v) => setQty(Math.min(Math.max(1, v), max))}
          max={max}
        />
      </div>
      <AddToCartButton
        product={product}
        quantity={qty}
        size="lg"
        className="w-full"
        addToCartLabel={product.stock > 0 ? `Add ${qty} to cart` : "Add to cart"}
      />
      <p className="text-center text-xs text-ink-400">
        Packed at the shop counter — your invoice is ready instantly after checkout.
      </p>
    </div>
  );
}
