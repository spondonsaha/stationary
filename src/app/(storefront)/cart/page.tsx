import type { Metadata } from "next";
import { CartPageClient } from "@/components/storefront/CartPageClient";

export const metadata: Metadata = {
  title: "Your cart",
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">Your cart</h1>
      <p className="mt-1 text-sm text-ink-500">
        Review items, adjust quantities, then head to checkout.
      </p>
      <CartPageClient />
    </div>
  );
}
