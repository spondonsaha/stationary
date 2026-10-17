/**
 * In-memory sliding-window rate limiter.
 * Fine for a single Node instance; swap for Redis in multi-node deploys
 * (same interface, same call sites).
 */

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

// Periodic cleanup so the map cannot grow unbounded.
const CLEANUP_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();
function maybeCleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  /** Seconds until the next attempt is allowed (when !ok). */
  retryAfter: number;
};

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  maybeCleanup(windowMs);
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    buckets.set(key, bucket);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, retryAfter: 0 };
}

/** Extract a stable client IP from proxy-aware headers. */
export function clientIp(headersList: Headers): string {
  const fwd = headersList.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headersList.get("x-real-ip") ?? "unknown";
}
