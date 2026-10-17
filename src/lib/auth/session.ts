import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminSessions, adminUsers } from "@/lib/db/schema";
import { randomToken } from "./password";

export const SESSION_COOKIE = "ink_session";
const SESSION_DAYS = 7;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(adminUserId: string): Promise<string> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(adminSessions).values({
    tokenHash: hashToken(token),
    adminUserId,
    expiresAt,
  });
  return token;
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export type SessionAdmin = { id: string; email: string; name: string; role: "admin" | "cashier" | "store_manager" };

/** Returns the logged-in admin for the current request, or null. */
export async function getSessionAdmin(): Promise<SessionAdmin | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const rows = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      expiresAt: adminSessions.expiresAt,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.adminUserId, adminUsers.id))
    .where(
      and(
        eq(adminSessions.tokenHash, tokenHash),
        gt(adminSessions.expiresAt, new Date()),
        eq(adminUsers.active, true),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return;
  await db.delete(adminSessions).where(eq(adminSessions.tokenHash, hashToken(token)));
}
