import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoiceCounters } from "@/lib/db/schema";

/**
 * Allocates the next invoice number inside a caller-provided transaction:
 * INV-YYYY-NNNNNN where the counter row is locked with FOR UPDATE so two
 * concurrent checkouts can never receive the same number.
 *
 * Must be called with a drizzle transaction (`tx`), not the root client.
 */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function nextInvoiceNumber(tx: Tx, date = new Date()): Promise<string> {
  const year = date.getUTCFullYear();

  // Ensure the counter row exists for this year (idempotent).
  await tx
    .insert(invoiceCounters)
    .values({ year, lastValue: 0 })
    .onConflictDoNothing();

  const rows = await tx.execute(
    sql`SELECT last_value FROM invoice_counters WHERE year = ${year} FOR UPDATE`,
  );
  const current = Number((rows[0] as { last_value: string | number }).last_value ?? 0);
  const next = current + 1;

  await tx
    .update(invoiceCounters)
    .set({ lastValue: next })
    .where(eq(invoiceCounters.year, year));

  return `INV-${year}-${String(next).padStart(6, "0")}`;
}
