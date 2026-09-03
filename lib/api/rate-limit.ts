import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

/**
 * Durable rate limiting backed by Upstash Redis.
 *
 * When Upstash env vars are present we use a distributed sliding-window limiter
 * that behaves correctly across serverless instances. When they are absent
 * (demo/preview/local) we fall back to a per-instance in-memory limiter so the
 * app still functions — this is best-effort only and not safe for production
 * scale, but Upstash is connected in this project.
 */

const hasUpstash = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

type Limiter = { limit: (key: string) => Promise<{ success: boolean; reset: number; remaining: number }> }

// Cache limiter instances by name so we don't recreate them per request.
const limiterCache = new Map<string, Limiter>()

function createUpstashLimiter(tokens: number, window: `${number} s` | `${number} m` | `${number} h`, prefix: string): Limiter {
  const redis = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  })
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: `monytar:rl:${prefix}`,
    analytics: false,
  })
}

// --- In-memory fallback (per-instance, best-effort) ---
const memoryStore = new Map<string, { count: number; resetAt: number }>()

function createMemoryLimiter(tokens: number, windowMs: number, prefix: string): Limiter {
  return {
    async limit(key: string) {
      const now = Date.now()
      const storeKey = `${prefix}:${key}`
      const entry = memoryStore.get(storeKey)
      if (!entry || entry.resetAt <= now) {
        const resetAt = now + windowMs
        memoryStore.set(storeKey, { count: 1, resetAt })
        return { success: true, reset: resetAt, remaining: tokens - 1 }
      }
      entry.count += 1
      const success = entry.count <= tokens
      return { success, reset: entry.resetAt, remaining: Math.max(0, tokens - entry.count) }
    },
  }
}

type WindowSpec = { tokens: number; window: `${number} s` | `${number} m` | `${number} h`; windowMs: number }

/** Named rate-limit policies used across auth-sensitive endpoints. */
const POLICIES: Record<string, WindowSpec> = {
  // Sign-up / org creation: 5 attempts per 10 minutes per IP.
  signup: { tokens: 5, window: "10 m", windowMs: 10 * 60_000 },
  // Login: 10 attempts per 5 minutes per IP.
  login: { tokens: 10, window: "5 m", windowMs: 5 * 60_000 },
  // Password reset requests: 4 per 15 minutes per IP.
  passwordReset: { tokens: 4, window: "15 m", windowMs: 15 * 60_000 },
  // Invitations: 20 per hour per user/IP.
  invitation: { tokens: 20, window: "1 h", windowMs: 60 * 60_000 },
  // Invitation acceptance: 10 per 10 minutes per IP.
  acceptInvitation: { tokens: 10, window: "10 m", windowMs: 10 * 60_000 },
  // Public demo-lead capture: 8 per 10 minutes per IP.
  demoLead: { tokens: 8, window: "10 m", windowMs: 10 * 60_000 },
}

export type RateLimitPolicy = keyof typeof POLICIES

function getLimiter(policy: RateLimitPolicy): Limiter {
  if (limiterCache.has(policy)) return limiterCache.get(policy)!
  const spec = POLICIES[policy]
  const limiter = hasUpstash
    ? createUpstashLimiter(spec.tokens, spec.window, policy)
    : createMemoryLimiter(spec.tokens, spec.windowMs, policy)
  limiterCache.set(policy, limiter)
  return limiter
}

/** Best-effort client IP extraction from standard proxy headers. */
export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]!.trim()
  return request.headers.get("x-real-ip") || "unknown"
}

/**
 * Enforce a rate-limit policy. Returns a 429 NextResponse when the limit is
 * exceeded, or `null` when the request may proceed.
 */
export async function enforceRateLimit(
  policy: RateLimitPolicy,
  identifier: string,
): Promise<NextResponse | null> {
  try {
    const { success, reset, remaining } = await getLimiter(policy).limit(identifier)
    if (success) return null

    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": String(Math.max(0, remaining)),
        },
      },
    )
  } catch {
    // Never let a limiter outage block legitimate traffic.
    return null
  }
}
