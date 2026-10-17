import {
  pgTable,
  pgEnum,
  uuid,
  bigserial,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  date,
  boolean,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const productStatus = pgEnum("product_status", ["active", "archived"]);
export const orderStatus = pgEnum("order_status", ["pending", "confirmed", "cancelled"]);
export const invoiceStatus = pgEnum("invoice_status", ["unpaid", "partial", "paid", "void"]);
export const paymentMethod = pgEnum("payment_method", [
  "cash",
  "card",
  "bank_transfer",
  "mobile_payment",
  "department_account",
  "other",
]);
// Who the order/invoice is for. Departments pay on account with a PO/budget code.
export const customerType = pgEnum("customer_type", [
  "guest",
  "student",
  "faculty_staff",
  "department",
]);
// How the order is handed over (spec: pickup or campus delivery).
export const fulfillmentMethod = pgEnum("fulfillment_method", ["pickup", "campus_delivery"]);
// Staff roles for the admin dashboard.
export const userRole = pgEnum("user_role", ["admin", "cashier", "store_manager"]);
// Why stock changed — full audit trail per product.
export const stockMovementReason = pgEnum("stock_movement_reason", [
  "initial",
  "restock",
  "sale",
  "adjustment",
  "return",
]);

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    // Relative path under /public, e.g. "/products/cat-pens.svg"
    image: varchar("image", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("categories_slug_idx").on(t.slug)],
);

/* ------------------------------------------------------------------ */
/* Departments / faculties (department accounts order on account)      */
/* ------------------------------------------------------------------ */

export const departments = pgTable(
  "departments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    // Short code used on invoices, e.g. "CHEM"
    code: varchar("code", { length: 20 }).notNull(),
    faculty: varchar("faculty", { length: 160 }),
    // Default budget / cost-centre code for on-account orders.
    budgetCode: varchar("budget_code", { length: 60 }),
    contactName: varchar("contact_name", { length: 160 }),
    contactEmail: varchar("contact_email", { length: 254 }),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("departments_code_idx").on(t.code),
    index("departments_name_idx").on(t.name),
  ],
);

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    description: text("description").default("").notNull(),
    sku: varchar("sku", { length: 40 }).notNull(),
    // Manufacturer / brand for the brand filter, e.g. "Faber-Castell".
    brand: varchar("brand", { length: 80 }),
    // Money as numeric(12,2) per requirements; app converts to minor units only for math.
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    stock: integer("stock").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(10).notNull(),
    image: varchar("image", { length: 255 }),
    status: productStatus("status").default("active").notNull(),
    featured: boolean("featured").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("products_category_id_idx").on(t.categoryId),
    index("products_slug_idx").on(t.slug),
    index("products_brand_idx").on(t.brand),
    index("products_status_created_at_idx").on(t.status, t.createdAt),
    uniqueIndex("products_sku_idx").on(t.sku),
    check("products_price_nonneg", sql`${t.price} >= 0`),
    check("products_stock_nonneg", sql`${t.stock} >= 0`),
  ],
);

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    address: text("address"),
    // Who this customer is — drives pricing/on-account behaviour.
    type: customerType("type").default("guest").notNull(),
    // Student or staff ID number (validated at checkout for student/faculty_staff).
    studentId: varchar("student_id", { length: 40 }),
    // Owning department (for department accounts and staff/faculty affiliation).
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    faculty: varchar("faculty", { length: 160 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("customers_email_idx").on(t.email),
    index("customers_name_idx").on(t.name),
    index("customers_type_idx").on(t.type),
    index("customers_department_id_idx").on(t.departmentId),
  ],
);

/* ------------------------------------------------------------------ */
/* Orders + order items                                                */
/* ------------------------------------------------------------------ */

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    status: orderStatus("status").default("pending").notNull(),
    // Snapshot of who ordered and how it is fulfilled (department orders carry a PO).
    customerType: customerType("customer_type").default("guest").notNull(),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    poNumber: varchar("po_number", { length: 60 }),
    fulfillment: fulfillmentMethod("fulfillment").default("pickup").notNull(),
    preferredPaymentMethod: paymentMethod("preferred_payment_method").default("cash").notNull(),
    notes: text("notes"),
    // Snapshotted totals in money; recomputed server-side on every mutation.
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    discount: numeric("discount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    tax: numeric("tax", { precision: 12, scale: 2 }).notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    // Unguessable token for post-checkout invoice access.
    invoiceToken: varchar("invoice_token", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("orders_customer_id_created_at_idx").on(t.customerId, t.createdAt),
    index("orders_status_idx").on(t.status),
    index("orders_department_id_idx").on(t.departmentId),
    uniqueIndex("orders_invoice_token_idx").on(t.invoiceToken),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    productName: varchar("product_name", { length: 160 }).notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
  },
  (t) => [
    index("order_items_order_id_idx").on(t.orderId),
    index("order_items_product_id_idx").on(t.productId),
    check("order_items_qty_positive", sql`${t.quantity} > 0`),
  ],
);

/* ------------------------------------------------------------------ */
/* Invoices + invoice items (price snapshots keep history immutable)    */
/* ------------------------------------------------------------------ */

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Human-facing sequential number, e.g. INV-2026-000123
    invoiceNumber: varchar("invoice_number", { length: 20 }).notNull(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    // Public, unguessable link token (32 hex chars). No sequential ids exposed.
    publicToken: varchar("public_token", { length: 64 }).notNull(),
    status: invoiceStatus("status").default("unpaid").notNull(),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    // Who is billed and how it is fulfilled (department invoices carry a PO/budget code).
    customerType: customerType("customer_type").default("guest").notNull(),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    poNumber: varchar("po_number", { length: 60 }),
    fulfillment: fulfillmentMethod("fulfillment").default("pickup").notNull(),
    notes: text("notes"),
    // Customer-facing label for who this walk-in invoice is billed to (also in customers row)
    customerNameSnapshot: varchar("customer_name_snapshot", { length: 160 }).notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    discount: numeric("discount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    taxRate: numeric("tax_rate", { precision: 6, scale: 3 }).notNull(),
    tax: numeric("tax", { precision: 12, scale: 2 }).notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }).default("0.00").notNull(),
    // true when stock was already decremented for this invoice (idempotency flag)
    stockDecremented: boolean("stock_decremented").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("invoices_invoice_number_idx").on(t.invoiceNumber),
    uniqueIndex("invoices_public_token_idx").on(t.publicToken),
    index("invoices_customer_id_idx").on(t.customerId),
    index("invoices_order_id_idx").on(t.orderId),
    index("invoices_department_id_idx").on(t.departmentId),
    index("invoices_status_idx").on(t.status),
    index("invoices_issue_date_idx").on(t.issueDate),
    check("invoices_totals_nonneg", sql`${t.total} >= 0 AND ${t.subtotal} >= 0`),
  ],
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    // Price/name snapshots: historical invoices never change when the catalog does.
    productName: varchar("product_name", { length: 160 }).notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
  },
  (t) => [
    index("invoice_items_invoice_id_idx").on(t.invoiceId),
    index("invoice_items_product_id_idx").on(t.productId),
    check("invoice_items_qty_positive", sql`${t.quantity} > 0`),
  ],
);

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    method: paymentMethod("method").default("cash").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("payments_invoice_id_idx").on(t.invoiceId),
    check("payments_amount_positive", sql`${t.amount} > 0`),
  ],
);

/* ------------------------------------------------------------------ */
/* Admin auth                                                          */
/* ------------------------------------------------------------------ */

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 254 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    // scrypt hash in format: scrypt$N$r$p$salt_b64$hash_b64
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").default("admin").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("admin_users_email_idx").on(t.email)],
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // sha256 of the raw cookie token; the raw token never hits the DB.
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    adminUserId: uuid("admin_user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("admin_sessions_token_hash_idx").on(t.tokenHash),
    index("admin_sessions_user_id_idx").on(t.adminUserId),
  ],
);

/* ------------------------------------------------------------------ */
/* Per-year invoice number counters (row-locked inside transactions)    */
/* ------------------------------------------------------------------ */

export const invoiceCounters = pgTable("invoice_counters", {
  year: integer("year").primaryKey(),
  lastValue: bigserial("last_value", { mode: "number" }).notNull(),
});

/* ------------------------------------------------------------------ */
/* Stock movements (audit trail for every inventory change)            */
/* ------------------------------------------------------------------ */

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    // Signed change: negative for sales, positive for restocks/returns.
    delta: integer("delta").notNull(),
    reason: stockMovementReason("reason").notNull(),
    // Resulting stock level after this movement (for a readable ledger).
    balanceAfter: integer("balance_after").notNull(),
    // Loose reference to the source document (invoice/order id), no FK to keep it generic.
    referenceType: varchar("reference_type", { length: 30 }),
    referenceId: uuid("reference_id"),
    note: text("note"),
    createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("stock_movements_product_id_created_at_idx").on(t.productId, t.createdAt),
    index("stock_movements_reason_idx").on(t.reason),
  ],
);

