/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Good enough for a single Vercel instance protecting one form. If the site
 * ever scales to many instances, swap this module for Upstash Redis — the
 * interface stays identical.
 */
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_SUBMISSIONS = 5;

const hits = new Map<string, number[]>();

export function rateLimit(key: string): { ok: boolean; retryAfterMin?: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const list = (hits.get(key) ?? []).filter((t) => t > windowStart);
  if (list.length >= MAX_SUBMISSIONS) {
    const retryAfterMin = Math.ceil((list[0] + WINDOW_MS - now) / 60000);
    return { ok: false, retryAfterMin };
  }

  list.push(now);
  hits.set(key, list);

  // Occasional sweep so the map cannot grow unboundedly.
  if (hits.size > 1000) {
    for (const [k, times] of hits) {
      if (times.every((t) => t <= windowStart)) hits.delete(k);
    }
  }
  return { ok: true };
}
