/**
 * Sliding-window rate limiter.
 *
 * Backed by Upstash Redis (REST) when `UPSTASH_REDIS_REST_URL` /
 * `UPSTASH_REDIS_REST_TOKEN` are configured, with an in-process Map as the
 * fallback everywhere else.
 *
 * The fallback degrades rather than rejects: a missing or unreachable limiter
 * must not take down the feature it is protecting. Per-instance limiting is
 * weaker than a distributed counter, but it is still a limit, and the
 * expensive route (`/api/insights/generate`) is independently bounded by the
 * plan entitlement check and the monthly token budget in `src/lib/ai/usage.ts`.
 * Losing Upstash is logged loudly so the gap is visible in Vercel logs.
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
  backend: 'memory' | 'upstash'
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

// Upstash being unconfigured is a deploy-time mistake, not a per-request
// event: log it once per instance instead of once per request so it stays
// visible without drowning the log.
let warnedUpstashUnconfigured = false

function warnUpstashUnconfiguredOnce() {
  if (warnedUpstashUnconfigured) return
  warnedUpstashUnconfigured = true
  console.warn(
    '[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set; ' +
      'falling back to the per-instance in-memory limiter. Rate limits are no longer ' +
      'shared across serverless instances until these are configured.'
  )
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

  if (!url || !token) {
    warnUpstashUnconfiguredOnce()
    return checkInMemory(key, maxRequests, windowMs, now)
  }

  try {
    return await checkUpstash(key, maxRequests, windowMs, now, url, token)
  } catch (err) {
    console.error(
      '[rate-limit] Upstash request failed; falling back to the in-process limiter',
      err
    )
    return checkInMemory(key, maxRequests, windowMs, now)
  }
}

export function clearRateLimitStore() {
  memoryStore.clear()
  warnedUpstashUnconfigured = false
}

export function isDistributedRateLimitEnabled(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
  )
}
