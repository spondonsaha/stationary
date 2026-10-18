import { roundMoney } from "@/lib/config";

export type TotalsInput = {
  /** Sum of unitPrice * quantity, computed by the caller from cart lines */
  lines: { unitPrice: number; quantity: number }[];
  discount?: number;
};

export type Totals = {
  subtotal: number;
  discount: number;
  /** Always 0 — kept for DB columns that require a value. */
  tax: number;
  total: number;
};

/**
 * Single source of truth for money math. Client and server both use this so
 * displayed totals always match what checkout persists. No tax is applied.
 */
export function computeTotals({
  lines,
  discount = 0,
}: TotalsInput): Totals {
  const subtotal = roundMoney(
    lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
  );
  const cappedDiscount = roundMoney(Math.max(0, Math.min(discount, subtotal)));
  const total = roundMoney(subtotal - cappedDiscount);
  return { subtotal, discount: cappedDiscount, tax: 0, total };
}

/** Format a line total the same way everywhere (2 decimals, half-up). */
export function lineTotal(unitPrice: number, quantity: number): number {
  return roundMoney(unitPrice * quantity);
}
