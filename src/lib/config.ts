/**
 * Institutional branding and money settings — all configurable via environment.
 * NEXT_PUBLIC_* values are inlined at build time so client UI (cart, checkout)
 * matches the server; secrets must never be placed in NEXT_PUBLIC_*.
 */

function env(...names: string[]): string | undefined {
  for (const name of names) {
    const v = process.env[name];
    if (v !== undefined && v !== "") return v;
  }
  return undefined;
}

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const shopConfig = {
  /** Store display name (e.g. "University Bookstore"). */
  name:
    env("NEXT_PUBLIC_STORE_NAME", "STORE_NAME", "NEXT_PUBLIC_SHOP_NAME", "SHOP_NAME") ??
    "University Bookstore",
  /** Owning institution (e.g. "Northgate University"). */
  university:
    env("NEXT_PUBLIC_UNIVERSITY_NAME", "UNIVERSITY_NAME") ?? "Northgate University",
  tagline: env("STORE_TAGLINE", "SHOP_TAGLINE") ?? "Textbooks, supplies & campus essentials",
  email: env("STORE_EMAIL", "SHOP_EMAIL") ?? "bookstore@example.edu",
  phone: env("STORE_PHONE", "SHOP_PHONE") ?? "",
  /** Campus location / mailing address printed on invoices. */
  address: env("STORE_ADDRESS", "SHOP_ADDRESS") ?? "",
  /** Store opening hours shown in the footer and on invoices. */
  hours: env("STORE_HOURS") ?? "Mon–Fri 8:00–18:00 · Sat 10:00–16:00",
  currency: (
    env("NEXT_PUBLIC_CURRENCY", "CURRENCY") ?? "USD"
  ).toUpperCase(),
  /** Tax rate as percent, e.g. 8.5 => 8.5% */
  taxRatePercent: Number(env("NEXT_PUBLIC_TAX_RATE", "TAX_RATE") ?? "8.5"),
  baseUrl: env("NEXT_PUBLIC_URL") ?? "http://localhost:3000",
  // Lazy getter: this module is imported by client components (formatMoney,
  // branding), and production client bundles only inline NEXT_PUBLIC_* vars —
  // a module-scope required("AUTH_SECRET") would throw in the browser and
  // blank every page. No fallback on read: a missing secret still fails loudly.
  get authSecret(): string {
    return required("AUTH_SECRET");
  },
};

export type ShopInfo = typeof shopConfig;

const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(amount: number | string, currency = shopConfig.currency): string {
  let fmt = currencyFormatters.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyFormatters.set(currency, fmt);
  }
  const n = typeof amount === "string" ? Number(amount) : amount;
  return fmt.format(Number.isFinite(n) ? n : 0);
}

/** Parse a numeric(x,2) string from Postgres into a float for display math. */
export function toMoney(n: string | number): number {
  const v = typeof n === "string" ? Number(n) : n;
  return Number.isFinite(v) ? v : 0;
}

/** Round to 2 decimals using banker-free half-up, matching numeric(12,2). */
export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
