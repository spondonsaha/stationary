import { headers } from "next/headers";

/**
 * Defense-in-depth CSRF check for server actions.
 * Next.js server actions already verify the Origin header; this adds an
 * explicit same-origin assertion (Origin, falling back to Referer).
 */
export async function assertSameOrigin(): Promise<void> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const origin = h.get("origin");
  const referer = h.get("referer");

  const source = origin ?? (referer ? new URL(referer).origin : null);
  if (!source || !host) return; // non-browser clients: rely on Next's own action checks

  const expected = host.startsWith("http") ? new URL(host).host : host;
  if (new URL(source).host !== expected) {
    throw new Error("Cross-origin request rejected");
  }
}
