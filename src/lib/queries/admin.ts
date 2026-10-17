import "server-only";
import { and, asc, count, desc, eq, gte, ilike, lte, or, sql, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import {
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
} from "@/lib/db/schema";

export const ADMIN_PAGE_SIZE = 15;

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export type DashboardStats = {
  todaySales: number;
  todayOrders: number;
  totalOrders: number;
  unpaidCount: number;
  unpaidAmount: number;
  lowStock: { id: string; name: string; stock: number; threshold: number; image: string | null }[];
  recentInvoices: {
    id: string;
    invoiceNumber: string;
    total: string;
    status: "unpaid" | "partial" | "paid" | "void";
    publicToken: string;
    createdAt: string;
    customerName: string;
  }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayAgg, totalOrdersAgg, unpaidAgg, lowStock, recent] = await Promise.all([
    db
      .select({ c: count(), total: sum(invoices.total) })
      .from(invoices)
      .where(and(gte(invoices.createdAt, startOfDay), sql`${invoices.status} <> 'void'`)),
    db.select({ c: count() }).from(orders),
    db
      .select({ c: count(), total: sum(sql`${invoices.total} - ${invoices.amountPaid}`) })
      .from(invoices)
      .where(and(sql`${invoices.status} IN ('unpaid','partial')`, sql`${invoices.status} <> 'void'`)),
    db
      .select({
        id: products.id,
        name: products.name,
        stock: products.stock,
        threshold: products.lowStockThreshold,
        image: products.image,
      })
      .from(products)
      .where(
        and(
          eq(products.status, "active"),
          sql`${products.stock} <= ${products.lowStockThreshold}`,
        ),
      )
      .orderBy(asc(products.stock))
      .limit(8),
    db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        total: invoices.total,
        status: invoices.status,
        publicToken: invoices.publicToken,
        createdAt: invoices.createdAt,
        customerName: customers.name,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .orderBy(desc(invoices.createdAt))
      .limit(6),
  ]);

  return {
    todaySales: Number(todayAgg[0]?.total ?? 0),
    todayOrders: Number(todayAgg[0]?.c ?? 0),
    totalOrders: Number(totalOrdersAgg[0]?.c ?? 0),
    unpaidCount: Number(unpaidAgg[0]?.c ?? 0),
    unpaidAmount: Number(unpaidAgg[0]?.total ?? 0),
    lowStock,
    recentInvoices: recent.map((r) => ({
      id: r.id,
      invoiceNumber: r.invoiceNumber,
      total: r.total,
      status: r.status,
      publicToken: r.publicToken,
      createdAt: r.createdAt.toISOString(),
      customerName: r.customerName,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string | null;
  price: string;
  stock: number;
  lowStockThreshold: number;
  image: string | null;
  status: "active" | "archived";
  featured: boolean;
  categoryId: string;
  categoryName: string;
};

export async function listAdminProducts({
  page = 1,
  q = "",
  category = "",
  brand = "",
}: {
  page?: number;
  q?: string;
  category?: string;
  brand?: string;
}) {
  const where = and(
    ...(q
      ? [
          or(
            ilike(products.name, `%${q}%`),
            ilike(products.sku, `%${q}%`),
            ilike(products.brand, `%${q}%`),
          )!,
        ]
      : []),
    ...(category ? [eq(categories.slug, category)] : []),
    ...(brand ? [eq(products.brand, brand)] : []),
  );

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        brand: products.brand,
        price: products.price,
        stock: products.stock,
        lowStockThreshold: products.lowStockThreshold,
        image: products.image,
        status: products.status,
        featured: products.featured,
        categoryId: products.categoryId,
        categoryName: categories.name,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(asc(products.name))
      .limit(ADMIN_PAGE_SIZE)
      .offset((Math.max(1, page) - 1) * ADMIN_PAGE_SIZE),
    db
      .select({ total: count() })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(where),
  ]);

  const total = totalRow?.total ?? 0;
  return {
    items: rows as AdminProduct[],
    total,
    page: Math.max(1, page),
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export async function getAdminProduct(id: string) {
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return row ?? null;
}

export async function listCategoriesWithCounts() {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      image: categories.image,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));
}

/* ------------------------------------------------------------------ */
/* Orders                                                             */
/* ------------------------------------------------------------------ */

export async function listAdminOrders({
  page = 1,
  status = "",
  q = "",
  from = "",
  to = "",
}: {
  page?: number;
  status?: string;
  q?: string;
  from?: string;
  to?: string;
}) {
  const where = and(
    ...(status ? [eq(orders.status, status as "pending" | "confirmed" | "cancelled")] : []),
    ...(q
      ? [or(ilike(customers.name, `%${q}%`), ilike(customers.email, `%${q}%`), ilike(invoices.invoiceNumber, `%${q}%`))!]
      : []),
    ...(from ? [gte(orders.createdAt, new Date(from))] : []),
    ...(to ? [lte(orders.createdAt, new Date(`${to}T23:59:59`))] : []),
  );

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: orders.id,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
        customerName: customers.name,
        customerEmail: customers.email,
        invoiceNumber: invoices.invoiceNumber,
        invoiceToken: invoices.publicToken,
        invoiceStatus: invoices.status,
        itemCount: sql<number>`(SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = ${orders.id})`,
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(invoices, eq(invoices.orderId, orders.id))
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset((Math.max(1, page) - 1) * ADMIN_PAGE_SIZE),
    db
      .select({ total: count() })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(invoices, eq(invoices.orderId, orders.id))
      .where(where),
  ]);

  const total = totalRow?.total ?? 0;
  return {
    items: rows,
    total,
    page: Math.max(1, page),
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export async function getAdminOrder(id: string) {
  const [order] = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, id))
    .limit(1);
  if (!order) return null;

  const [items, [invoice]] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(orderItems.id),
    db.select().from(invoices).where(eq(invoices.orderId, id)).limit(1),
  ]);

  return { ...order, items, invoice: invoice ?? null };
}

/* ------------------------------------------------------------------ */
/* Invoices                                                            */
/* ------------------------------------------------------------------ */

export async function listAdminInvoices({
  page = 1,
  status = "",
  q = "",
  from = "",
  to = "",
}: {
  page?: number;
  status?: string;
  q?: string;
  from?: string;
  to?: string;
}) {
  const where = and(
    ...(status ? [eq(invoices.status, status as "unpaid" | "partial" | "paid" | "void")] : []),
    ...(q
      ? [or(ilike(invoices.invoiceNumber, `%${q}%`), ilike(customers.name, `%${q}%`), ilike(customers.email, `%${q}%`))!]
      : []),
    ...(from ? [gte(invoices.issueDate, from)] : []),
    ...(to ? [lte(invoices.issueDate, to)] : []),
  );

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        total: invoices.total,
        amountPaid: invoices.amountPaid,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        publicToken: invoices.publicToken,
        customerName: customers.name,
        customerEmail: customers.email,
        orderId: invoices.orderId,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(where)
      .orderBy(desc(invoices.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset((Math.max(1, page) - 1) * ADMIN_PAGE_SIZE),
    db
      .select({ total: count() })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(where),
  ]);

  const total = totalRow?.total ?? 0;
  return {
    items: rows,
    total,
    page: Math.max(1, page),
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export async function getAdminInvoice(id: string) {
  const [row] = await db
    .select({ invoice: invoices, customer: customers, department: departments })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .leftJoin(departments, eq(invoices.departmentId, departments.id))
    .where(eq(invoices.id, id))
    .limit(1);
  if (!row) return null;

  const [items, pays] = await Promise.all([
    db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).orderBy(invoiceItems.id),
    db.select().from(payments).where(eq(payments.invoiceId, id)).orderBy(desc(payments.createdAt)),
  ]);

  return { invoice: row.invoice, customer: row.customer, department: row.department, items, payments: pays };
}

/* ------------------------------------------------------------------ */
/* Customers                                                          */
/* ------------------------------------------------------------------ */

export async function listAdminCustomers({ page = 1, q = "" }: { page?: number; q?: string }) {
  const where = q
    ? or(ilike(customers.name, `%${q}%`), ilike(customers.email, `%${q}%`), ilike(customers.phone, `%${q}%`))
    : undefined;

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        createdAt: customers.createdAt,
        orderCount: sql<number>`(SELECT COUNT(*) FROM orders o WHERE o.customer_id = ${customers.id})`,
        spent: sql<string>`(SELECT COALESCE(SUM(i.amount_paid),0) FROM invoices i WHERE i.customer_id = ${customers.id})`,
        outstanding: sql<string>`(SELECT COALESCE(SUM(i.total - i.amount_paid),0) FROM invoices i WHERE i.customer_id = ${customers.id} AND i.status IN ('unpaid','partial'))`,
      })
      .from(customers)
      .where(where)
      .orderBy(desc(customers.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset((Math.max(1, page) - 1) * ADMIN_PAGE_SIZE),
    db.select({ total: count() }).from(customers).where(where),
  ]);

  const total = totalRow?.total ?? 0;
  return {
    items: rows,
    total,
    page: Math.max(1, page),
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export async function getAdminCustomer(id: string) {
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!customer) return null;

  const [customerOrders, customerInvoices] = await Promise.all([
    db
      .select({
        id: orders.id,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.customerId, id))
      .orderBy(desc(orders.createdAt)),
    db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        total: invoices.total,
        amountPaid: invoices.amountPaid,
        issueDate: invoices.issueDate,
        publicToken: invoices.publicToken,
      })
      .from(invoices)
      .where(eq(invoices.customerId, id))
      .orderBy(desc(invoices.createdAt)),
  ]);

  return { customer, orders: customerOrders, invoices: customerInvoices };
}

/* ------------------------------------------------------------------ */
/* Departments                                                         */
/* ------------------------------------------------------------------ */

export async function listDepartmentsWithCounts() {
  return db
    .select({
      id: departments.id,
      name: departments.name,
      code: departments.code,
      faculty: departments.faculty,
      budgetCode: departments.budgetCode,
      contactName: departments.contactName,
      contactEmail: departments.contactEmail,
      active: departments.active,
      orderCount: sql<number>`(SELECT COUNT(*) FROM orders o WHERE o.department_id = ${departments.id})`,
    })
    .from(departments)
    .orderBy(asc(departments.name));
}

export async function getAdminDepartment(id: string) {
  const [row] = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
  return row ?? null;
}

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

export type SalesReport = {
  from: string;
  to: string;
  totals: { revenue: number; invoiceCount: number; avgInvoice: number };
  days: { date: string; invoiceCount: number; revenue: number }[];
  byType: { customerType: "guest" | "student" | "faculty_staff" | "department"; invoiceCount: number; revenue: number }[];
  byPayment: { method: string; amount: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
};

export function defaultReportRange(days = 30): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: isoDay(from), to: isoDay(to) };
}

export async function getSalesReport({ from, to }: { from: string; to: string }): Promise<SalesReport> {
  const rangeFilter = and(
    sql`${invoices.status} <> 'void'`,
    gte(invoices.issueDate, from),
    lte(invoices.issueDate, to),
  );

  const [totalsRow, dayRows, typeRows, paymentRows, productRows] = await Promise.all([
    db
      .select({ c: count(), total: sum(invoices.total) })
      .from(invoices)
      .where(rangeFilter),
    db
      .select({
        date: invoices.issueDate,
        invoiceCount: count(),
        revenue: sum(invoices.total),
      })
      .from(invoices)
      .where(rangeFilter)
      .groupBy(invoices.issueDate)
      .orderBy(asc(invoices.issueDate)),
    db
      .select({
        customerType: invoices.customerType,
        invoiceCount: count(),
        revenue: sum(invoices.total),
      })
      .from(invoices)
      .where(rangeFilter)
      .groupBy(invoices.customerType),
    db
      .select({ method: payments.method, amount: sum(payments.amount) })
      .from(payments)
      .where(and(gte(payments.createdAt, new Date(`${from}T00:00:00`)), lte(payments.createdAt, new Date(`${to}T23:59:59.999`))))
      .groupBy(payments.method),
    db
      .select({
        name: invoiceItems.productName,
        quantity: sum(invoiceItems.quantity),
        revenue: sum(invoiceItems.lineTotal),
      })
      .from(invoiceItems)
      .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
      .where(rangeFilter)
      .groupBy(invoiceItems.productName)
      .orderBy(desc(sum(invoiceItems.lineTotal)))
      .limit(8),
  ]);

  const invoiceCount = Number(totalsRow[0]?.c ?? 0);
  const revenue = Number(totalsRow[0]?.total ?? 0);

  // Fill every calendar day in the range so the chart has a continuous axis.
  const days = fillDays(from, to, dayRows);

  return {
    from,
    to,
    totals: {
      revenue,
      invoiceCount,
      avgInvoice: invoiceCount > 0 ? revenue / invoiceCount : 0,
    },
    days,
    byType: typeRows.map((r) => ({
      customerType: r.customerType,
      invoiceCount: Number(r.invoiceCount),
      revenue: Number(r.revenue ?? 0),
    })),
    byPayment: paymentRows.map((r) => ({ method: r.method, amount: Number(r.amount ?? 0) })),
    topProducts: productRows.map((r) => ({
      name: r.name,
      quantity: Number(r.quantity ?? 0),
      revenue: Number(r.revenue ?? 0),
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Stock movements                                                     */
/* ------------------------------------------------------------------ */

export async function listProductMovements(productId: string, limit = 20) {
  return db
    .select({
      id: stockMovements.id,
      delta: stockMovements.delta,
      reason: stockMovements.reason,
      balanceAfter: stockMovements.balanceAfter,
      referenceType: stockMovements.referenceType,
      referenceId: stockMovements.referenceId,
      note: stockMovements.note,
      createdAt: stockMovements.createdAt,
    })
    .from(stockMovements)
    .where(eq(stockMovements.productId, productId))
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);
}

/* ------------------------------------------------------------------ */
/* Report helpers                                                      */
/* ------------------------------------------------------------------ */

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fillDays(
  from: string,
  to: string,
  rows: { date: string; invoiceCount: number; revenue: string | number | null }[],
): { date: string; invoiceCount: number; revenue: number }[] {
  const byDay = new Map<string, { invoiceCount: number; revenue: number }>();
  for (const r of rows) {
    byDay.set(r.date, { invoiceCount: Number(r.invoiceCount), revenue: Number(r.revenue ?? 0) });
  }

  const out: { date: string; invoiceCount: number; revenue: number }[] = [];
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  let guard = 0;
  while (cursor <= end && guard < 1000) {
    const key = isoDay(cursor);
    const hit = byDay.get(key) ?? { invoiceCount: 0, revenue: 0 };
    out.push({ date: key, ...hit });
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return out;
}
