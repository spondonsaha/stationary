import "server-only";
import { redirect } from "next/navigation";
import { getSessionAdmin, type SessionAdmin } from "@/lib/auth/session";

/**
 * Auth guard for admin pages and server actions.
 * Pages redirect to the login screen; server actions should call
 * `requireAdminOrThrow` so mutations fail closed.
 */
export async function requireAdmin(returnTo = "/admin"): Promise<SessionAdmin> {
  const admin = await getSessionAdmin();
  if (!admin) redirect(`/admin/login?next=${encodeURIComponent(returnTo)}`);
  return admin;
}

export async function requireAdminOrThrow(): Promise<SessionAdmin> {
  const admin = await getSessionAdmin();
  if (!admin) throw new Error("Not authenticated");
  return admin;
}
