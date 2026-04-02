type RateLimitEntry = {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
  resetAt: number
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  const windowStart = now - windowMs
  const existing = store.get(key)
  const timestamps = (existing?.timestamps || []).filter(ts => ts > windowStart)

  if (timestamps.length >= maxRequests) {
    const oldestInWindow = timestamps[0]
    const resetAt = oldestInWindow + windowMs
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000))

    store.set(key, { timestamps })

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      resetAt
    }
  }

  timestamps.push(now)
  store.set(key, { timestamps })

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - timestamps.length),
    retryAfterSeconds: 0,
    resetAt: now + windowMs
  }
}

export function clearRateLimitStore() {
  store.clear()
}
