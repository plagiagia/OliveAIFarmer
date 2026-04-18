/**
 * Lightweight exponential-backoff retry for OpenAI calls.
 *
 * Retries only on transient errors (429, 5xx, network), not on 4xx
 * (which usually mean a bad request and won't get better by retrying).
 */
export interface RetryOptions {
  attempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  onRetry?: (attempt: number, error: unknown) => void
}

function isTransientError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return true
  const status = (err as { status?: number; statusCode?: number }).status
    ?? (err as { statusCode?: number }).statusCode
  if (typeof status === 'number') {
    if (status === 408 || status === 425 || status === 429) return true
    if (status >= 500 && status < 600) return true
    return false
  }
  // Network-ish errors without a status code are treated as transient.
  return true
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const attempts = opts.attempts ?? 3
  const baseDelay = opts.baseDelayMs ?? 500
  const maxDelay = opts.maxDelayMs ?? 4000

  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt >= attempts || !isTransientError(err)) break
      opts.onRetry?.(attempt, err)
      const jitter = Math.random() * 250
      const delay = Math.min(maxDelay, baseDelay * 2 ** (attempt - 1)) + jitter
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastError
}
