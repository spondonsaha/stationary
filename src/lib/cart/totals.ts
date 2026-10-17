import { roundMoney, shopConfig } from "@/lib/config";

export type TotalsInput = {
  /** Sum of unitPrice * quantity, computed by the caller from cart lines */
  lines: { unitPrice: number; quantity: number }[];
  discount?: number;
  taxRatePercent?: number;
};

export type Totals = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
};

/**
 * Single source of truth for money math. Client and server both use this so
 * displayed totals always match what checkout persists.
 */
export function computeTotals({
  lines,
  discount = 0,
  taxRatePercent = shopConfig.taxRatePercent,
}: TotalsInput): Totals {
  const subtotal = roundMoney(
    lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
  );
  const cappedDiscount = roundMoney(Math.max(0, Math.min(discount, subtotal)));
  const taxable = roundMoney(subtotal - cappedDiscount);
  const tax = roundMoney((taxable * taxRatePercent) / 100);
  const total = roundMoney(taxable + tax);
  return { subtotal, discount: cappedDiscount, tax, total };
}

/** Format a line total the same way everywhere (2 decimals, half-up). */
export function lineTotal(unitPrice: number, quantity: number): number {
  return roundMoney(unitPrice * quantity);
}
