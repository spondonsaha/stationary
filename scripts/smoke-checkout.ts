/**
 * End-to-end checkout / invoice smoke test against the real database.
 * Verifies: invoice numbering, totals math, price snapshots, stock
 * decrement, oversell protection (rollback), and manual invoices.
 *
 * Run: npm run test:checkout   (needs a migrated + seeded DB)
 * Cleans up after itself.
 */
import "dotenv/config";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import {
  customers,
  invoiceItems,
  invoices,
  orderItems,
  orders,
  payments,
  products,
} from "../src/lib/db/schema";
import {
  createOrderWithInvoice,
  createManualInvoice,
  StockError,
} from "../src/lib/invoice/create";
import { computeTotals } from "../src/lib/cart/totals";

const TEST_EMAIL = "smoke.test@example.com";
const TEST_EMAIL_2 = "smoke.walkin@example.com";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  const mark = cond ? "PASS" : "FAIL";
  if (!cond) failures += 1;
  console.log(`  [${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function cleanup() {
  const custs = await db
    .select({ id: customers.id })
    .from(customers)
    .where(inArray(sql`lower(${customers.email})`, [TEST_EMAIL, TEST_EMAIL_2]));
  const ids = custs.map((c) => c.id);
  if (ids.length === 0) return;
  const invIds = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(inArray(invoices.customerId, ids));
  if (invIds.length) {
    await db.delete(payments).where(inArray(payments.invoiceId, invIds.map((i) => i.id)));
    await db.delete(invoiceItems).where(inArray(invoiceItems.invoiceId, invIds.map((i) => i.id)));
    await db.delete(invoices).where(inArray(invoices.id, invIds.map((i) => i.id)));
  }
  const ordIds = await db
    .select({ id: orders.id })
    .from(orders)
    .where(inArray(orders.customerId, ids));
  if (ordIds.length) {
    await db.delete(orderItems).where(inArray(orderItems.orderId, ordIds.map((o) => o.id)));
    await db.delete(orders).where(inArray(orders.id, ordIds.map((o) => o.id)));
  }
  await db.delete(customers).where(inArray(customers.id, ids));
}

async function main() {
  console.log("Checkout / invoice smoke test\n");
  await cleanup();

  const [pen] = await db.select().from(products).where(eq(products.sku, "PEN-001"));
  const [notebook] = await db.select().from(products).where(eq(products.sku, "NB-001"));
  const [scarce] = await db.select().from(products).where(eq(products.sku, "PAP-003"));
  if (!pen || !notebook || !scarce) throw new Error("Seed products missing — run npm run db:seed");

  const penStockBefore = pen.stock;
  const nbStockBefore = notebook.stock;

  /* ---------------- 1. Checkout creates order + invoice ---------------- */
  console.log("1. createOrderWithInvoice");
  const orderResult = await createOrderWithInvoice({
    customer: {
      name: "Smoke Test",
      email: TEST_EMAIL,
      phone: "+1 555 0000",
      address: "1 Test Lane",
      notes: "smoke",
    },
    lines: [
      { productId: pen.id, quantity: 3 },
      { productId: notebook.id, quantity: 1 },
    ],
  });

  check(
    "invoice number format INV-YYYY-NNNNNN",
    /^INV-\d{4}-\d{6}$/.test(orderResult.invoiceNumber),
    orderResult.invoiceNumber,
  );
  check("returned an order id", Boolean(orderResult.orderId));

  const expected = computeTotals({
    lines: [
      { unitPrice: Number(pen.price), quantity: 3 },
      { unitPrice: Number(notebook.price), quantity: 1 },
    ],
  });
  const [savedInvoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, orderResult.invoiceId));
  check(
    "stored total matches server-side math",
    Number(savedInvoice.total) === expected.total,
    `stored=${savedInvoice.total} expected=${expected.total.toFixed(2)}`,
  );
  check("invoice starts unpaid with 0 paid", savedInvoice.status === "unpaid" && Number(savedInvoice.amountPaid) === 0);

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, orderResult.invoiceId));
  check("invoice has 2 line items", items.length === 2, `got ${items.length}`);
  check(
    "price snapshots stored (unit_price)",
    items.some((i) => i.productId === pen.id && Number(i.unitPrice) === Number(pen.price)),
  );

  const [penAfter] = await db.select().from(products).where(eq(products.id, pen.id));
  const [nbAfter] = await db.select().from(products).where(eq(products.id, notebook.id));
  check(
    "stock decremented for both products",
    penAfter.stock === penStockBefore - 3 && nbAfter.stock === nbStockBefore - 1,
    `pen ${penStockBefore}->${penAfter.stock}, nb ${nbStockBefore}->${nbAfter.stock}`,
  );

  /* ---------------- 2. Public token is unguessable ---------------- */
  console.log("2. Public invoice token");
  check(
    "token is >= 32 hex chars",
    /^[a-f0-9]{32,}$/i.test(savedInvoice.publicToken),
    `len=${savedInvoice.publicToken.length}`,
  );

  /* ---------------- 3. Oversell protection + rollback ---------------- */
  console.log("3. Oversell protection");
  const scarceStock = scarce.stock;
  const ordersBefore = await db.select({ c: sql<number>`count(*)` }).from(orders);
  let threw = false;
  try {
    await createOrderWithInvoice({
      customer: {
        name: "Smoke Test",
        email: TEST_EMAIL,
        phone: "+1 555 0000",
        address: "1 Test Lane",
      },
      lines: [{ productId: scarce.id, quantity: scarceStock + 5 }],
    });
  } catch (err) {
    threw = err instanceof StockError;
  }
  const ordersAfter = await db.select({ c: sql<number>`count(*)` }).from(orders);
  check("insufficient stock throws StockError", threw);
  check(
    "failed checkout rolled back (no order added)",
    Number(ordersAfter[0].c) === Number(ordersBefore[0].c),
  );
  const [scarceAfter] = await db.select().from(products).where(eq(products.id, scarce.id));
  check("stock unchanged after rollback", scarceAfter.stock === scarceStock);

  /* ---------------- 4. Manual invoice (walk-in, paid in full) ---------------- */
  console.log("4. createManualInvoice");
  const manual = await createManualInvoice({
    customer: { name: "Walk-in Wendy", email: TEST_EMAIL_2, phone: "+1 555 1111" },
    notes: "walk-in sale",
    discount: 1.5,
    lines: [
      { productId: pen.id, productName: pen.name, quantity: 2, unitPrice: Number(pen.price) },
      { productId: null, productName: "Gift wrapping", quantity: 1, unitPrice: 2.0 },
    ],
    payment: { status: "paid", amount: 0, method: "cash" },
  });
  const [manualInv] = await db.select().from(invoices).where(eq(invoices.id, manual.invoiceId));
  check("manual invoice marked paid", manualInv.status === "paid");
  check(
    "amount paid equals grand total",
    Number(manualInv.amountPaid) === Number(manualInv.total),
    `${manualInv.amountPaid} vs ${manualInv.total}`,
  );
  check("manual invoice is not tied to an order", manual.orderId === null);
  const manualLines = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, manual.invoiceId));
  check("free-text line stored without product id", manualLines.some((l) => l.productId === null));
  const [penAfterManual] = await db.select().from(products).where(eq(products.id, pen.id));
  check("stock decremented by manual invoice too", penAfterManual.stock === penAfter.stock - 2);

  /* ---------------- 5. Customer reuse (same email) ---------------- */
  console.log("5. Customer resolution");
  const custs = await db
    .select()
    .from(customers)
    .where(and(sql`lower(${customers.email}) = ${TEST_EMAIL}`, sql`true`));
  check("one customer row for repeated email", custs.length === 1, `got ${custs.length}`);

  await cleanup();
  console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error(err);
  try {
    await cleanup();
  } catch {}
  process.exit(1);
});
