import { timingSafeEqual } from 'crypto'

/**
 * Constant-time comparison of the cron request's Authorization header
 * against `Bearer <CRON_SECRET>`, so the secret can't be probed byte by
 * byte via response timing.
 */
export function isAuthorizedCronRequest(request: Request, cronSecret: string): boolean {
  const actual = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${cronSecret}`)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
