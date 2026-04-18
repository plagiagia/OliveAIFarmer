/**
 * Stable JSON hashing for AI request context.
 *
 * Used to deduplicate "Generate insights" clicks: if the same farm
 * context produced an answer in the last 24h, return the cached
 * insights instead of spending tokens.
 */
import { createHash } from 'crypto'

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']'
  }
  const keys = Object.keys(value as Record<string, unknown>).sort()
  return (
    '{' +
    keys
      .map((k) => JSON.stringify(k) + ':' + stableStringify((value as Record<string, unknown>)[k]))
      .join(',') +
    '}'
  )
}

export function contextHash(value: unknown, prefix?: string): string {
  const h = createHash('sha256').update(stableStringify(value)).digest('hex').slice(0, 32)
  return prefix ? `${prefix}:${h}` : h
}
