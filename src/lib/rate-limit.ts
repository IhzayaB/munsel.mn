// Rate limiter with Upstash Redis for production (serverless-safe)
// Falls back to in-memory for local development

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Upstash (production) ───────────────────────────
let upstashLimiters: Map<string, Ratelimit> | null = null;

function getUpstashLimiter(windowMs: number, limit: number): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (!upstashLimiters) upstashLimiters = new Map();
  const key = `${windowMs}:${limit}`;

  if (!upstashLimiters.has(key)) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    upstashLimiters.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
        analytics: true,
      })
    );
  }

  return upstashLimiters.get(key)!;
}

// ── In-memory fallback (dev only) ──────────────────
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

if (typeof globalThis !== "undefined" && !("__rlCleanup" in globalThis)) {
  (globalThis as Record<string, unknown>).__rlCleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 60_000);
}

function inMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}

// ── Public API ─────────────────────────────────────
export async function rateLimitAsync(
  key: string,
  { limit = 10, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): Promise<{ success: boolean; remaining: number }> {
  const upstash = getUpstashLimiter(windowMs, limit);
  if (upstash) {
    const result = await upstash.limit(key);
    return { success: result.success, remaining: result.remaining };
  }
  return inMemoryRateLimit(key, limit, windowMs);
}

// Synchronous wrapper (uses in-memory only — for backward compat)
export function rateLimit(
  key: string,
  { limit = 10, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { success: boolean; remaining: number } {
  return inMemoryRateLimit(key, limit, windowMs);
}

export function getRateLimitKey(request: Request, prefix: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${prefix}:${ip}`;
}
