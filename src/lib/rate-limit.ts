/**
 * Sliding-window rate limiter.
 *
 * Backed by Upstash Redis (REST) when `UPSTASH_REDIS_REST_URL` /
 * `UPSTASH_REDIS_REST_TOKEN` are configured, otherwise falls back to
 * an in-process Map. The fallback is fine for local dev but on Vercel
 * serverless it does NOT enforce limits across instances — set the
 * Upstash env vars in production.
 */
type RateLimitEntry = {
  timestamps: number[]
}

const memoryStore = new Map<string, RateLimitEntry>()

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const upstashEnabled = Boolean(UPSTASH_URL && UPSTASH_TOKEN)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
  resetAt: number
}

function checkInMemory(
  key: string,
  maxRequests: number,
  windowMs: number,
  now: number
): RateLimitResult {
  const windowStart = now - windowMs
  const existing = memoryStore.get(key)
  const timestamps = (existing?.timestamps || []).filter((ts) => ts > windowStart)

  if (timestamps.length >= maxRequests) {
    const oldestInWindow = timestamps[0]
    const resetAt = oldestInWindow + windowMs
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000))
    memoryStore.set(key, { timestamps })
    return { allowed: false, remaining: 0, retryAfterSeconds, resetAt }
  }

  timestamps.push(now)
  memoryStore.set(key, { timestamps })
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - timestamps.length),
    retryAfterSeconds: 0,
    resetAt: now + windowMs,
  }
}

/**
 * Use Upstash for an atomic INCR + EXPIRE counter per fixed window.
 * Fixed-window for simplicity and one round-trip; sliding-window math
 * is only used in the in-memory fallback.
 */
async function checkUpstash(
  key: string,
  maxRequests: number,
  windowMs: number,
  now: number
): Promise<RateLimitResult> {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000))
  const bucket = Math.floor(now / windowMs)
  const redisKey = `rl:${key}:${bucket}`

  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', redisKey],
      ['EXPIRE', redisKey, String(windowSec)],
    ]),
    cache: 'no-store',
  })

  if (!res.ok) {
    return checkInMemory(key, maxRequests, windowMs, now)
  }

  type UpstashEntry = { result?: number | string; error?: string }
  const body = (await res.json()) as UpstashEntry[]
  const incrResult = body[0]?.result
  const count = typeof incrResult === 'number' ? incrResult : Number(incrResult ?? 0)

  const resetAt = (bucket + 1) * windowMs
  if (count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
      resetAt,
    }
  }
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - count),
    retryAfterSeconds: 0,
    resetAt,
  }
}

/**
 * Synchronous variant — preserves the pre-existing API.
 * Always uses the in-memory store.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  return checkInMemory(key, maxRequests, windowMs, now)
}

/**
 * Async variant — uses Upstash when configured. Prefer this in new
 * routes; existing routes can be migrated incrementally.
 */
export async function checkRateLimitAsync(
  key: string,
  maxRequests: number,
  windowMs: number,
  now = Date.now()
): Promise<RateLimitResult> {
  if (!upstashEnabled) {
    return checkInMemory(key, maxRequests, windowMs, now)
  }
  try {
    return await checkUpstash(key, maxRequests, windowMs, now)
  } catch (err) {
    console.error('[rate-limit] upstash error, falling back to memory', err)
    return checkInMemory(key, maxRequests, windowMs, now)
  }
}

export function clearRateLimitStore() {
  memoryStore.clear()
}

export function isDistributedRateLimitEnabled(): boolean {
  return upstashEnabled
}
