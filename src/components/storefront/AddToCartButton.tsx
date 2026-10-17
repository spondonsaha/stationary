"use client";

import { useCartContext } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";

export type CartProduct = {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  image: string | null;
  unitPrice: number;
  stock: number;
};

/**
 * One-tap "Add to cart". Disabled when out of stock; qty is clamped
 * to available stock inside the cart store.
 */
export function AddToCartButton({
  product,
  quantity = 1,
  size = "md",
  className,
  addToCartLabel = "Add to cart",
}: {
  product: CartProduct;
  quantity?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  addToCartLabel?: string;
}) {
  const { addItem } = useCartContext();
  const out = product.stock <= 0;

  return (
    <Button
      size={size}
      variant={out ? "secondary" : "primary"}
      disabled={out}
      className={className}
      onClick={() => addItem(product, quantity)}
      aria-label={out ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
    >
      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden>
        <path
          d="M3.5 5h1.6l1 7.6a1.2 1.2 0 001.2 1h6.5a1.2 1.2 0 001.2-1L16 7.5H6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8.2" cy="16.2" r="1.1" fill="currentColor" />
        <circle cx="13.2" cy="16.2" r="1.1" fill="currentColor" />
      </svg>
      {out ? "Out of stock" : addToCartLabel}
    </Button>
  );
}
