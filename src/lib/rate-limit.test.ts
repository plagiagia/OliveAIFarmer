import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  checkRateLimit,
  checkRateLimitAsync,
  clearRateLimitStore,
} from './rate-limit'

describe('checkRateLimit', () => {
  afterEach(() => {
    clearRateLimitStore()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
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

  it('fails closed in production when Upstash is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const result = await checkRateLimitAsync('ai:user-1', 10, 60_000, 1_000_000)

    expect(result.allowed).toBe(false)
    expect(result.backend).toBe('unavailable')
  })

  it('fails closed in production when Upstash is unavailable', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))

    const result = await checkRateLimitAsync('ai:user-2', 10, 60_000, 1_000_000)

    expect(result.allowed).toBe(false)
    expect(result.backend).toBe('unavailable')
  })

  it('keeps the in-memory fallback for local development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')

    const result = await checkRateLimitAsync('local:user-1', 10, 60_000, 1_000_000)

    expect(result.allowed).toBe(true)
    expect(result.backend).toBe('memory')
  })
})
