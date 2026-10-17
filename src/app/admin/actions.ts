"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, setSessionCookie } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/security/csrf";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export type LoginState = { error?: string } | null;

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

/** Only allow same-site relative redirects after login. */
function safeNext(next: string | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/admin";
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await assertSameOrigin();
  } catch {
    return { error: "Request rejected. Please reload and try again." };
  }

  const ip = clientIp(await headers());
  const limited = rateLimit(`login:${ip}`, { limit: 8, windowMs: 15 * 60 * 1000 });
  if (!limited.ok) {
    return { error: `Too many attempts. Try again in ${limited.retryAfter}s.` };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const { email, password, next } = parsed.data;

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(sql`lower(${adminUsers.email})`, email.toLowerCase()))
    .limit(1);

  // Constant-ish response time: always run a verify against something.
  const ok = user
    ? verifyPassword(password, user.passwordHash)
    : verifyPassword(password, "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA");

  if (!user || !ok) {
    // Generic message: do not reveal whether the email exists.
    return { error: "Incorrect email or password." };
  }

  const token = await createSession(user.id);
  await setSessionCookie(token);
  redirect(safeNext(next));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
