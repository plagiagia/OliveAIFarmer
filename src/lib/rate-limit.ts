/**
 * Sliding-window rate limiter.
 *
 * Backed by Upstash Redis (REST) when `UPSTASH_REDIS_REST_URL` /
 * `UPSTASH_REDIS_REST_TOKEN` are configured. Local development falls
 * back to an in-process Map. Production fails closed when the distributed
 * backend is missing or unavailable so serverless instances cannot bypass
 * cost-sensitive limits.
 */
type RateLimitEntry = {
  timestamps: number[]
}

const memoryStore = new Map<string, RateLimitEntry>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
  resetAt: number
  backend: 'memory' | 'upstash' | 'unavailable'
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
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      resetAt,
      backend: 'memory',
    }
  }

  timestamps.push(now)
  memoryStore.set(key, { timestamps })
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - timestamps.length),
    retryAfterSeconds: 0,
    resetAt: now + windowMs,
    backend: 'memory',
  }
}

function unavailableResult(now: number): RateLimitResult {
  return {
    allowed: false,
    remaining: 0,
    retryAfterSeconds: 60,
    resetAt: now + 60_000,
    backend: 'unavailable',
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
  now: number,
  url: string,
  token: string
): Promise<RateLimitResult> {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000))
  const bucket = Math.floor(now / windowMs)
  const redisKey = `rl:${key}:${bucket}`

  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', redisKey],
      ['EXPIRE', redisKey, String(windowSec)],
    ]),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Upstash returned HTTP ${res.status}`)
  }

  type UpstashEntry = { result?: number | string; error?: string }
  const body = (await res.json()) as UpstashEntry[]
  if (!Array.isArray(body) || body[0]?.error || body[1]?.error) {
    throw new Error(
      `Upstash pipeline failed: ${body[0]?.error ?? body[1]?.error ?? 'invalid response'}`
    )
  }
  const incrResult = body[0]?.result
  if (incrResult === undefined) {
    throw new Error('Upstash response did not include the counter value')
  }
  const count = typeof incrResult === 'number' ? incrResult : Number(incrResult ?? 0)
  if (!Number.isFinite(count)) {
    throw new Error('Upstash returned an invalid counter value')
  }

  const resetAt = (bucket + 1) * windowMs
  if (count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
      resetAt,
      backend: 'upstash',
    }
  }
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - count),
    retryAfterSeconds: 0,
    resetAt,
    backend: 'upstash',
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
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  const isProduction = process.env.NODE_ENV === 'production'

  if (!url || !token) {
    if (isProduction) {
      console.error('[rate-limit] Upstash is not configured; rejecting request')
      return unavailableResult(now)
    }
    return checkInMemory(key, maxRequests, windowMs, now)
  }

  try {
    return await checkUpstash(key, maxRequests, windowMs, now, url, token)
  } catch (err) {
    console.error('[rate-limit] Upstash request failed', err)
    if (isProduction) {
      return unavailableResult(now)
    }
    return checkInMemory(key, maxRequests, windowMs, now)
  }
}

export function clearRateLimitStore() {
  memoryStore.clear()
}

export function isDistributedRateLimitEnabled(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
  )
}
