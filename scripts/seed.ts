/**
 * Seed: departments, categories, 37 products, admin user, and demo
 * customers/orders/invoices plus stock movements so the admin dashboard has
 * realistic data.
 *
 * Run: npm run db:seed   (after npm run db:migrate)
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import {
  adminUsers,
  categories,
  customers,
  departments,
  invoiceItems,
  invoices,
  orderItems,
  orders,
  payments,
  products,
  stockMovements,
} from "../src/lib/db/schema";
import { hashPassword, randomToken } from "../src/lib/auth/password";
import { nextInvoiceNumber } from "../src/lib/invoice/number";
import { computeTotals } from "../src/lib/cart/totals";
import { randomBytes } from "node:crypto";

/** Unambiguous random password (no O/0, I/l/1) for the seeded admin. */
function randomPassword(length = 16): string {
  const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

const CATEGORY_DEFS = [
  { name: "Pens", slug: "pens", image: "/products/cat-pens.jpg", description: "Gel, ballpoint, fountain and pencils for everyday writing." },
  { name: "Notebooks", slug: "notebooks", image: "/products/cat-notebooks.jpg", description: "Hardcover, softcover and spiral notebooks for every idea." },
  { name: "Paper", slug: "paper", image: "/products/cat-paper.jpg", description: "Printer paper, craft paper and sketch pads." },
  { name: "Books", slug: "books", image: "/products/cat-books.jpg", description: "Journals, composition books and specialty stationery." },
  { name: "Art Supplies", slug: "art-supplies", image: "/products/cat-art-supplies.jpg", description: "Paints, pencils and markers for creative work." },
  { name: "Office", slug: "office", image: "/products/cat-office.jpg", description: "Files, folders, adhesives and desk essentials." },
] as const;

type CatSlug = (typeof CATEGORY_DEFS)[number]["slug"];

/** Known brands per category for the brand filter. */
const BRANDS: Record<CatSlug, string[]> = {
  pens: ["Pilot", "Faber-Castell", "Uni-ball", "Parker", "Muji"],
  notebooks: ["Moleskine", "Oxford", "Leuchtturm1917"],
  paper: ["Navigator", "Fabriano", "Canson"],
  books: ["Moleskine", "Carnival"],
  "art-supplies": ["Winsor & Newton", "Faber-Castell", "Derwent"],
  office: ["BIC", "3M", "Maped", "Deli"],
};

const DEPARTMENT_DEFS = [
  { name: "Department of Chemistry", code: "CHEM", faculty: "Faculty of Science", budgetCode: "SCI-CHEM-4400", contactName: "Dr. Hana Ali", contactEmail: "chemistry@northgate.edu" },
  { name: "Department of Physics", code: "PHYS", faculty: "Faculty of Science", budgetCode: "SCI-PHYS-4410", contactName: "Dr. Omar Daoud", contactEmail: "physics@northgate.edu" },
  { name: "Faculty of Engineering", code: "ENG", faculty: "Faculty of Engineering", budgetCode: "ENG-GEN-2200", contactName: "Ing. Layla Hassan", contactEmail: "engineering@northgate.edu" },
  { name: "University Library", code: "LIB", faculty: "Central Services", budgetCode: "LIB-OPS-1100", contactName: "Ms. Ruth Adeyemi", contactEmail: "library@northgate.edu" },
  { name: "Student Affairs Office", code: "SAO", faculty: "Student Services", budgetCode: "STU-AFF-3300", contactName: "Mr. Daniel Okoro", contactEmail: "studentaffairs@northgate.edu" },
];

type SeedProduct = {
  cat: CatSlug;
  name: string;
  sku: string;
  price: number;
  stock: number;
  image: string;
  desc: string;
  featured?: boolean;
  daysAgo?: number;
};

function p(
  cat: SeedProduct["cat"],
  name: string,
  sku: string,
  price: number,
  stock: number,
  idx: number,
  desc: string,
  extra: Partial<SeedProduct> = {},
): SeedProduct {
  return {
    cat,
    name,
    sku,
    price,
    stock,
    image: `/products/product-${String(idx).padStart(2, "0")}.jpg`,
    desc,
    ...extra,
  };
}

const SEED_PRODUCTS: SeedProduct[] = [
  p("pens", "Classic Gel Pen 0.7mm — Blue Ink", "PEN-001", 210, 120, 1,
    "A smooth 0.7mm gel roller with deep blue ink and a comfy soft-grip barrel. Our best-selling everyday pen for school and office.",
    { featured: true, daysAgo: 120 }),
  p("pens", "Classic Gel Pen 0.7mm — Black Ink", "PEN-002", 210, 115, 2,
    "The same reliable gel pen in archive-black ink. Quick-drying and smudge-resistant on most paper.", { daysAgo: 120 }),
  p("pens", "Retractable Ballpoint Pen 1.0mm — Red", "PEN-003", 150, 90, 3,
    "Bold 1.0mm ballpoint with vivid red ink. Perfect for marking, editing and teachers.", { daysAgo: 100 }),
  p("pens", "Student Fountain Pen — Fine Nib", "PEN-004", 1450, 40, 4,
    "A lightweight steel fine-nib fountain pen that writes like a much pricer pen. Includes one blue cartridge.", { daysAgo: 90 }),
  p("pens", "Inkwell Desk Luxury Fountain Pen", "PEN-005", 5750, 12, 5,
    "Balanced brass body with a smooth 14k-plated nib, presented in a gift box. Converter and two cartridges included.",
    { featured: true, daysAgo: 30 }),
  p("pens", "HB Graphite Pencils — Pack of 12", "PEN-006", 780, 85, 6,
    "Twelve cedar-wood HB pencils that sharpen to a clean point. The classroom classic.", { daysAgo: 110 }),
  p("art-supplies", "2B Sketching Pencils — Pack of 6", "ART-001", 950, 55, 7,
    "Soft 2B graphite for shading and line work, with a handy index of grades on the tin.", { daysAgo: 80 }),
  p("pens", "Mechanical Pencil 0.5mm — Navy", "PEN-007", 390, 70, 8,
    "Knurled metal grip, brass tip and 0.5mm lead advance. Refillable lead sleeve for precise lines.", { daysAgo: 80 }),
  p("notebooks", "Hardcover Notebook A5 — Ruled, 200 pages", "NB-001", 1140, 60, 9,
    "Thread-bound A5 notebook with 100gsm ruled pages that resist bleed-through. Expandable pocket and ribbon marker.",
    { featured: true, daysAgo: 75 }),
  p("notebooks", "Softcover Notebook A6 — Dotted, 120 pages", "NB-002", 690, 95, 10,
    "Pocket-sized dotted journal with a flexible lie-flat cover. Great for lists and sketches.", { daysAgo: 70 }),
  p("notebooks", "Spiral Notebook B5 — Grid, 150 pages", "NB-003", 870, 48, 11,
    "B5 wire-o notebook with graph pages for maths, plans and diagrams. Perforated sheets tear out cleanly.",
    { daysAgo: 65 }),
  p("notebooks", "Memo Pad — Brick Pattern, 100 sheets", "NB-004", 540, 3, 12,
    "A cheerful brick-pattern memo pad on 80gsm paper. Low stock — restock due next week.", { daysAgo: 55 }),
  p("notebooks", "To-Do Notepad — Daily Planner", "NB-005", 630, 66, 13,
    "Tear-off daily planner sheets with priorities, notes and a gratitude line.", { daysAgo: 55 }),
  p("paper", "Printer Paper A4 — 80gsm, 500 sheets", "PAP-001", 720, 140, 14,
    "Reliable multipurpose A4 paper, 80gsm, 500-sheet ream. Clean jam-free feeding in laser and inkjet printers.",
    { featured: true, daysAgo: 130 }),
  p("paper", "Colored Craft Paper — 50 Sheets Assorted", "PAP-002", 810, 44, 15,
    "Fifty A4 sheets in ten saturated colors. Smooth both sides for cutting, folding and collage.", { daysAgo: 60 }),
  p("paper", "Sketch Paper Pad A4 — 120gsm, 40 Sheets", "PAP-003", 1080, 2, 16,
    "Heavy 120gsm micro-perforated sketch paper for pencil, charcoal and light washes.", { daysAgo: 50 }),
  p("books", "Composition Book — Marble Cover, 100 pages", "BK-001", 510, 80, 17,
    "The classic marble-cover composition book with sewn binding and a lined interior.", { daysAgo: 95 }),
  p("books", "Reading Journal — Hardcover, 180 pages", "BK-002", 1680, 35, 18,
    "Track every book you read with prompts, rating grids and space for favorite quotes. Ribbon marker included.",
    { daysAgo: 45 }),
  p("books", "Address Book — Softcover, 144 pages", "BK-003", 900, 28, 19,
    "Alphabetized softcover address book with room for birthdays, notes and emergency contacts.", { daysAgo: 45 }),
  p("art-supplies", "Watercolor Pan Set — 24 Colors", "ART-002", 2640, 30, 20,
    "Twenty-four richly pigmented pans in a folding metal case with a mixing lid and water brush.",
    { featured: true, daysAgo: 40 }),
  p("art-supplies", "Colored Pencils Set — 36 Colors", "ART-003", 2220, 50, 21,
    "Soft-core colored pencils with excellent laydown and blendability. Sharpened and ready in a sturdy tin.",
    { daysAgo: 40 }),
  p("art-supplies", "Acrylic Paint Tubes — 12 × 22ml", "ART-004", 1890, 26, 22,
    "Twelve vivid acrylic colors with a buttery consistency. Water-resistant when dry, suitable for canvas and paper.",
    { daysAgo: 35 }),
  p("art-supplies", "Brush Pen Set — 8 Dual Tip", "ART-005", 1560, 38, 23,
    "Eight water-based brush pens with flexible brush and fine bullet tips. Ideal for lettering and illustration.",
    { daysAgo: 25 }),
  p("office", "Permanent Marker Set — Chisel Tip, 4 Colors", "OFF-001", 960, 72, 24,
    "Quick-drying permanent markers with chisel tips for bold lines on cardboard, plastic and metal.", { daysAgo: 85 }),
  p("office", "Highlighter Set — Assorted Pastels, 5 Pack", "OFF-002", 780, 90, 25,
    "Five smear-resistant pastel highlighters with a soft chisel tip. Won't bleed through most notebook paper.",
    { daysAgo: 30 }),
  p("office", "Whiteboard Markers — Low Odor, 4 Pack", "OFF-003", 990, 46, 26,
    "Dry-erase markers with easy-erase ink and ventilated caps. Includes black, blue, red and green.", { daysAgo: 30 }),
  p("office", "Document File Folder — Blue, Pack of 5", "OFF-004", 600, 64, 27,
    "Five polypropylene document folders with a printed spine label. Keeps paperwork tidy at home or work.",
    { daysAgo: 75 }),
  p("office", "Sheet Protectors A4 — 100 Pack", "OFF-005", 1110, 40, 28,
    "Crystal-clear A4 sheet protectors, 40-micron, three-hole punched. Archival-safe and dust resistant.",
    { daysAgo: 70 }),
  p("office", "Clipboard with Storage — A4", "OFF-006", 810, 33, 29,
    "A sturdy clipboard with a hinged storage compartment for pens, notes and a phone.", { daysAgo: 60 }),
  p("office", "12-inch Ruler — Transparent Flexi", "OFF-007", 210, 110, 30,
    "Flexible transparent ruler with inch and centimeter markings that stay crisp after bending.",
    { daysAgo: 105 }),
  p("office", "Geometry Set — Ruler, Compass, Protractor", "OFF-008", 660, 42, 31,
    "A complete 4-piece geometry set in a slim case: two rulers, protractor and lock-point compass.",
    { daysAgo: 55 }),
  p("office", "Craft Scissors — 8-inch Soft Grip", "OFF-009", 750, 58, 32,
    "Stainless blades with soft-grip handles. Smooth cutting for paper, card and fabric threads.",
    { daysAgo: 50 }),
  p("office", "Glue Stick — 20g, Pack of 3", "OFF-010", 480, 95, 33,
    "Three 20g glue sticks that dry clear and wash out of fabric. Safe for school projects.", { daysAgo: 90 }),
  p("office", "Liquid Glue — 100ml Fine Tip", "OFF-011", 340, 76, 34,
    "Precision fine-tip liquid glue for paper and card. Dries clear in seconds with a strong bond.",
    { daysAgo: 85 }),
  p("office", "Ring Binder A4 — 2-inch, Navy", "OFF-012", 960, 4, 35,
    "Two-inch D-ring binder with clear spine and pocket covers. Opens flat for easy filing.",
    { daysAgo: 45 }),
  p("office", "Sticky Notes — 3×3 inch, Pastel, 12 Pad", "OFF-013", 1020, 68, 36,
    "Twelve pastel pads with strong repositionable adhesive. 100 sheets per pad.",
    { featured: true, daysAgo: 20 }),
  p("office", "Index Tabs — Removable, 100 pieces", "OFF-014", 430, 5, 37,
    "One hundred removable index tabs in five colors for marking pages and filing.", { daysAgo: 20 }),
];

async function main() {
  console.log("Seeding database…");

  // Reset in FK-safe order (CASCADE handles the rest).
  await db.execute(sql`
    TRUNCATE
      payments, invoice_items, invoices, order_items, orders,
      stock_movements, products, categories, departments,
      customers, admin_sessions, admin_users, invoice_counters
    RESTART IDENTITY CASCADE
  `);

  // --- Departments ---
  const insertedDepts = await db.insert(departments).values(DEPARTMENT_DEFS).returning();
  const deptByCode = new Map(insertedDepts.map((d) => [d.code, d.id]));

  // --- Categories ---
  const insertedCats = await db
    .insert(categories)
    .values(CATEGORY_DEFS.map((c) => ({ ...c })))
    .returning();
  const catBySlug = new Map(insertedCats.map((c) => [c.slug, c.id]));

  // --- Products ---
  const now = Date.now();
  const insertedProducts = await db
    .insert(products)
    .values(
      SEED_PRODUCTS.map((sp) => {
        const brands = BRANDS[sp.cat];
        return {
          categoryId: catBySlug.get(sp.cat)!,
          name: sp.name,
          slug:
            sp.name
              .toLowerCase()
              .replace(/[^\w\s-]/g, "")
              .trim()
              .replace(/\s+/g, "-")
              .slice(0, 60) +
            "-" +
            sp.sku.toLowerCase().replace(/[^a-z0-9]/g, ""),
          description: sp.desc,
          sku: sp.sku,
          brand: brands[Number(sp.sku.replace(/\D/g, "")) % brands.length] ?? null,
          price: sp.price.toFixed(2),
          stock: sp.stock,
          image: sp.image,
          featured: sp.featured ?? false,
          createdAt: new Date(now - (sp.daysAgo ?? 30) * 24 * 60 * 60 * 1000),
        };
      }),
    )
    .returning();
  const prodBySku = new Map(insertedProducts.map((pr) => [pr.sku, pr]));

  // Opening stock ledger for every product.
  await db.insert(stockMovements).values(
    insertedProducts.map((pr) => ({
      productId: pr.id,
      delta: pr.stock,
      reason: "initial" as const,
      balanceAfter: pr.stock,
      note: "Opening balance",
    })),
  );

  // --- Admin (role: admin) ---
  // Never hardcode a credential: use SEED_ADMIN_PASSWORD, else generate a
  // strong random password and print it once for the operator.
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? randomPassword(16);
  await db.insert(adminUsers).values({
    email: "admin@northgate.edu",
    name: "Bookstore Admin",
    passwordHash: hashPassword(adminPassword),
    role: "admin",
  });

  // --- Demo customers + orders + invoices (exercise the real code path) ---
  const demo = [
    {
      customer: {
        name: "Alice Morgan",
        email: "alice.morgan@student.northgate.edu",
        phone: "+1 555 0138",
        address: null as string | null,
        type: "student" as const,
        studentId: "N1032845",
      },
      items: [
        { sku: "PEN-001", qty: 4 },
        { sku: "NB-001", qty: 2 },
        { sku: "PAP-001", qty: 1 },
      ],
      discount: 2,
      payNow: "full" as const,
      method: "card" as const,
      fulfillment: "pickup" as const,
      daysAgo: 1,
      notes: "Gift wrap please",
    },
    {
      customer: {
        name: "Dr. Ben Carter",
        email: "ben.carter@northgate.edu",
        phone: "+1 555 0192",
        address: null as string | null,
        type: "faculty_staff" as const,
        studentId: "STF-40871",
        faculty: "Faculty of Science",
      },
      items: [
        { sku: "ART-002", qty: 1 },
        { sku: "ART-005", qty: 1 },
      ],
      discount: 0,
      payNow: "partial" as const,
      method: "cash" as const,
      fulfillment: "campus_delivery" as const,
      daysAgo: 2,
      notes: null as string | null,
    },
    {
      customer: {
        name: "Dept. of Chemistry",
        email: "chemistry@northgate.edu",
        phone: "+1 555 0140",
        address: "Science Block B, Room 214",
        type: "department" as const,
        departmentKey: "CHEM" as const,
      },
      items: [
        { sku: "OFF-013", qty: 12 },
        { sku: "OFF-001", qty: 20 },
        { sku: "PAP-001", qty: 10 },
      ],
      discount: 0,
      payNow: "none" as const,
      method: "department_account" as const,
      fulfillment: "campus_delivery" as const,
      poNumber: "CHEM-2026-0142",
      daysAgo: 4,
      notes: "Department purchase order CHEM-2026-0142",
    },
  ];

  for (const d of demo) {
    await db.transaction(async (tx) => {
      const deptId = "departmentKey" in d.customer ? deptByCode.get(d.customer.departmentKey!) ?? null : null;
      const { departmentKey: _dk, ...custFields } = d.customer as typeof d.customer & {
        departmentKey?: string;
      };
      const [cust] = await tx
        .insert(customers)
        .values({
          ...custFields,
          departmentId: deptId,
          updatedAt: new Date(),
        })
        .returning();

      const lines = d.items.map((it) => {
        const pr = prodBySku.get(it.sku)!;
        return { productId: pr.id, name: pr.name, qty: it.qty, unitPrice: Number(pr.price) };
      });
      const totals = computeTotals({
        lines: lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.qty })),
        discount: d.discount,
      });

      const createdAt = new Date(now - d.daysAgo * 24 * 60 * 60 * 1000);
      const [order] = await tx
        .insert(orders)
        .values({
          customerId: cust.id,
          status: "confirmed",
          customerType: d.customer.type,
          departmentId: deptId,
          poNumber: "poNumber" in d ? d.poNumber : null,
          fulfillment: d.fulfillment,
          preferredPaymentMethod: d.method,
          notes: d.notes,
          subtotal: totals.subtotal.toFixed(2),
          discount: totals.discount.toFixed(2),
          tax: totals.tax.toFixed(2),
          total: totals.total.toFixed(2),
          invoiceToken: randomToken(24),
          createdAt,
          updatedAt: createdAt,
        })
        .returning();

      await tx.insert(orderItems).values(
        lines.map((l) => ({
          orderId: order.id,
          productId: l.productId,
          productName: l.name,
          quantity: l.qty,
          unitPrice: l.unitPrice.toFixed(2),
          lineTotal: (l.unitPrice * l.qty).toFixed(2),
        })),
      );

      const invoiceNumber = await nextInvoiceNumber(tx, createdAt);
      const issueDate = createdAt.toISOString().slice(0, 10);
      const due = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
      const amountPaid =
        d.payNow === "full" ? totals.total : d.payNow === "partial" ? totals.total / 2 : 0;

      const [inv] = await tx
        .insert(invoices)
        .values({
          invoiceNumber,
          orderId: order.id,
          customerId: cust.id,
          publicToken: randomToken(24),
          status: d.payNow === "full" ? "paid" : d.payNow === "partial" ? "partial" : "unpaid",
          issueDate,
          dueDate: due.toISOString().slice(0, 10),
          customerType: d.customer.type,
          departmentId: deptId,
          poNumber: "poNumber" in d ? d.poNumber : null,
          fulfillment: d.fulfillment,
          notes: d.notes,
          customerNameSnapshot: cust.name,
          subtotal: totals.subtotal.toFixed(2),
          discount: totals.discount.toFixed(2),
          taxRate: "0",
          tax: totals.tax.toFixed(2),
          total: totals.total.toFixed(2),
          amountPaid: amountPaid.toFixed(2),
          stockDecremented: true,
          createdAt,
          updatedAt: createdAt,
        })
        .returning();

      await tx.insert(invoiceItems).values(
        lines.map((l) => ({
          invoiceId: inv.id,
          productId: l.productId,
          productName: l.name,
          quantity: l.qty,
          unitPrice: l.unitPrice.toFixed(2),
          lineTotal: (l.unitPrice * l.qty).toFixed(2),
        })),
      );

      if (amountPaid > 0) {
        await tx.insert(payments).values({
          invoiceId: inv.id,
          amount: amountPaid.toFixed(2),
          method: d.method,
          notes: d.payNow === "partial" ? "Deposit paid in cash" : null,
          createdAt,
        });
      }

      // Decrement stock for demo orders and record the sale in the ledger.
      for (const l of lines) {
        const [updated] = await tx
          .update(products)
          .set({ stock: sql`stock - ${l.qty}` })
          .where(sql`id = ${l.productId}`)
          .returning({ stock: products.stock });
        await tx.insert(stockMovements).values({
          productId: l.productId,
          delta: -l.qty,
          reason: "sale",
          balanceAfter: updated.stock,
          referenceType: "order",
          referenceId: order.id,
        });
      }
    });
  }

  console.log(
    `Seeded ${DEPARTMENT_DEFS.length} departments, ${CATEGORY_DEFS.length} categories, ${SEED_PRODUCTS.length} products, 1 admin, 3 demo orders/invoices.`,
  );
  console.log(
    process.env.SEED_ADMIN_PASSWORD
      ? "Admin login: admin@northgate.edu (password from SEED_ADMIN_PASSWORD)"
      : `Admin login: admin@northgate.edu / ${adminPassword}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
