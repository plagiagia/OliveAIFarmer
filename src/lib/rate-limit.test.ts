import { afterEach, describe, expect, it } from 'vitest'
import { checkRateLimit, clearRateLimitStore } from './rate-limit'

describe('checkRateLimit', () => {
  afterEach(() => {
    clearRateLimitStore()
  })

  it('allows requests under the configured limit', () => {
    const base = 1_000_000
    const key = 'user-1'

    const r1 = checkRateLimit(key, 2, 60_000, base)
    const r2 = checkRateLimit(key, 2, 60_000, base + 1_000)

    expect(r1.allowed).toBe(true)
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(0)
  })

  it('blocks requests above the configured limit and returns retryAfterSeconds', () => {
    const base = 1_000_000
    const key = 'user-2'

    checkRateLimit(key, 1, 60_000, base)
    const blocked = checkRateLimit(key, 1, 60_000, base + 100)

    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('allows new requests after the window expires', () => {
    const base = 1_000_000
    const key = 'user-3'
    const windowMs = 10_000

    checkRateLimit(key, 1, windowMs, base)
    const afterWindow = checkRateLimit(key, 1, windowMs, base + windowMs + 1)

    expect(afterWindow.allowed).toBe(true)
  })
})
