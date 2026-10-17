import Link from "next/link";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Shared admin presentation building blocks                           */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panels({ children }: { children: ReactNode }) {
  return <div className="space-y-5">{children}</div>;
}

export function Card({
  title,
  description,
  actions,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-card border border-ink-100 bg-white shadow-soft ${className}`}>
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3 sm:px-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
            {description ? <p className="text-xs text-ink-400">{description}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "ink",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "ink" | "leaf" | "pencil" | "eraser";
}) {
  const tones = {
    ink: "text-ink",
    leaf: "text-leaf",
    pencil: "text-[#8a6a0a]",
    eraser: "text-[#b3372c]",
  } as const;
  return (
    <div className="rounded-card border border-ink-100 bg-white p-4 shadow-soft sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className={`mt-1.5 font-display text-2xl font-semibold ${tones[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
    </div>
  );
}

export type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Hide this column inside mobile cards (kept in the desktop table). */
  hideOnMobileCard?: boolean;
  className?: string;
};

/**
 * Responsive data table: a real <table> on md+, stacked label/value cards on
 * phones. One data source, correct semantics in both layouts.
 */
export function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  empty,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  empty: ReactNode;
  caption?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
        <p className="text-sm text-ink-500">{empty}</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-card border border-ink-100 bg-white shadow-soft md:block">
        <table className="w-full border-collapse text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-ink-100 bg-paper-100 text-left text-xs uppercase tracking-wide text-ink-400">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`px-4 py-3 font-semibold ${c.align === "right" ? "text-right" : ""} ${c.className ?? ""}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-ink-100/70 last:border-0 hover:bg-paper-50">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 align-middle ${c.align === "right" ? "text-right" : ""} ${c.className ?? ""}`}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-card border border-ink-100 bg-white p-4 shadow-soft">
            <dl className="space-y-2">
              {columns
                .filter((c) => !c.hideOnMobileCard)
                .map((c) => (
                  <div key={c.key} className="flex items-start justify-between gap-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">
                      {c.label}
                    </dt>
                    <dd className="text-right text-sm text-ink-700">{c.render(row)}</dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export function Pagination({
  page,
  pageCount,
  makeHref,
}: {
  page: number;
  pageCount: number;
  makeHref: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3">
      <span className="text-sm text-ink-400">
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={makeHref(page - 1)}
            className="inline-flex h-10 items-center rounded-md border border-ink-200 bg-white px-4 text-sm font-medium text-ink hover:border-ink-400"
          >
            ← Prev
          </Link>
        ) : (
          <span className="inline-flex h-10 items-center rounded-md border border-ink-100 px-4 text-sm text-ink-300">
            ← Prev
          </span>
        )}
        {page < pageCount ? (
          <Link
            href={makeHref(page + 1)}
            className="inline-flex h-10 items-center rounded-md border border-ink-200 bg-white px-4 text-sm font-medium text-ink hover:border-ink-400"
          >
            Next →
          </Link>
        ) : (
          <span className="inline-flex h-10 items-center rounded-md border border-ink-100 px-4 text-sm text-ink-300">
            Next →
          </span>
        )}
      </div>
    </nav>
  );
}

/** Filter bar used by list pages: plain GET form, no client JS. */
export function FilterForm({
  action,
  children,
}: {
  action: string;
  children: ReactNode;
}) {
  return (
    <form
      method="get"
      action={action}
      className="mb-4 grid gap-2 rounded-card border border-ink-100 bg-white p-3 shadow-soft sm:grid-cols-[1fr_repeat(3,auto)] sm:items-end"
    >
      {children}
    </form>
  );
}
