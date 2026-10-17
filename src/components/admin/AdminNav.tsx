"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Overview", icon: "M4 12l8-7 8 7v8a2 2 0 01-2 2h-4v-6h-4v6H6a2 2 0 01-2-2v-8z" },
  { href: "/admin/products", label: "Products", icon: "M4 8l8-4 8 4v8l-8 4-8-4V8z" },
  { href: "/admin/categories", label: "Categories", icon: "M4 6h16M4 12h10M4 18h13" },
  { href: "/admin/orders", label: "Orders", icon: "M6 4h12v16l-6-3-6 3V4z" },
  { href: "/admin/invoices", label: "Invoices", icon: "M6 3h9l4 4v14H6V3z" },
  { href: "/admin/customers", label: "Customers", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3 3.6-5 8-5s8 2 8 5" },
  { href: "/admin/departments", label: "Departments", icon: "M4 21V7l8-4 8 4v14M9 21v-6h6v6M9 11h2M15 11h2" },
  { href: "/admin/reports", label: "Reports", icon: "M4 20h16M7 16v-5M12 16V8M17 16v-9" },
];

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="space-y-1">
      {NAV.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-ink text-paper-50" : "text-ink-600 hover:bg-ink-50 hover:text-ink"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d={item.icon} />
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobile: collapsible admin nav. */
export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="admin-mobile-nav"
        className="inline-flex h-11 items-center gap-2 rounded-md border border-ink-200 bg-white px-4 text-sm font-medium text-ink"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Menu
      </button>
      {open ? (
        <div
          id="admin-mobile-nav"
          className="absolute inset-x-0 top-full z-40 border-b border-ink-100 bg-white p-3 shadow-lift"
        >
          <AdminNav onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
