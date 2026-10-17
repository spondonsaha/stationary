import { redirect } from "next/navigation";
import { getSessionAdmin } from "@/lib/auth/session";
import { LoginForm } from "@/components/admin/LoginForm";
import { shopConfig } from "@/lib/config";

/**
 * /admin/login — shown directly when unauthenticated; redirects authenticated
 * admins back to the dashboard. The admin layout renders the same form when a
 * visitor hits a protected page without a session.
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const admin = await getSessionAdmin();
  if (admin) redirect("/admin");

  const { next } = await searchParams;
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  return <LoginForm shopName={shopConfig.name} next={target} />;
}
