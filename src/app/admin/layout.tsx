import Link from "next/link";
import type { Metadata } from "next";
import { getSessionAdmin } from "@/lib/auth/session";
import { shopConfig } from "@/lib/config";
import { AdminNav, AdminMobileNav } from "@/components/admin/AdminNav";
import { LoginForm } from "@/components/admin/LoginForm";
import { logoutAction } from "./actions";
import { BrandMark } from "@/components/BrandMark";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  cashier: "Cashier",
  store_manager: "Store manager",
};

/**
 * Admin shell.
 * Unauthenticated visitors get the login form instead of any admin content —
 * the guard runs before children render, and every mutation re-checks auth.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getSessionAdmin();

  if (!admin) {
    return <LoginForm shopName={shopConfig.name} next="/admin" />;
  }

  return (
    <div className="min-h-dvh bg-paper-200/50 lg:grid lg:grid-cols-[240px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden border-r border-ink-100 bg-white lg:flex lg:flex-col lg:gap-2 lg:p-4">
        <Link href="/admin" className="mb-2 flex items-center gap-2.5 rounded-md px-2 py-1.5">
          <BrandMark className="h-8 w-8" />
          <span className="font-display text-base font-semibold text-ink">{shopConfig.name}</span>
        </Link>
        <AdminNav />
        <div className="mt-auto space-y-2 border-t border-ink-100 pt-3">
          <Link
            href="/"
            className="block rounded-md px-3 py-2 text-sm font-medium text-ink-500 hover:bg-ink-50"
          >
            View storefront
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-ink-500 hover:bg-ink-50"
            >
              Sign out
            </button>
          </form>
          <p className="px-3 text-xs text-ink-400">
            Signed in as {admin.name} · {ROLE_LABEL[admin.role]}
            <br />
            {admin.email}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Top bar (mobile + desktop title area) */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink-100 bg-paper/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="relative lg:hidden">
            <AdminMobileNav />
          </div>
          <Link href="/admin" className="flex items-center gap-2 lg:hidden">
            <BrandMark className="h-7 w-7" />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-500 hover:bg-ink-50 sm:inline-flex"
            >
              Storefront
            </Link>
            <form action={logoutAction} className="lg:hidden">
              <button
                type="submit"
                className="rounded-md px-3 py-2 text-sm font-medium text-ink-500 hover:bg-ink-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
