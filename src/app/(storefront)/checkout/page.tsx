import type { Metadata } from "next";
import { CheckoutForm } from "./CheckoutForm";
import { getActiveDepartments } from "@/lib/queries/departments";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Confirm your order and get your invoice instantly.",
};

export default async function CheckoutPage() {
  const departments = await getActiveDepartments();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">Checkout</h1>
      <p className="mt-1 text-sm text-ink-500">
        Choose who you are ordering as — your invoice is generated the moment you place the order.
      </p>
      <CheckoutForm departments={departments} />
    </div>
  );
}
