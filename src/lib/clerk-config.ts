/**
 * Clerk instance configuration checks.
 *
 * Kept as a pure function so it can be unit-tested without importing
 * `src/env.ts`, which validates (and can throw on) the whole environment at
 * import time. `src/env.ts` calls this and decides what to do with the result.
 */

export interface ClerkConfigInput {
  publishableKey?: string
  isSatellite?: string
  signInUrl?: string
  isProduction: boolean
}

export interface ClerkConfigReport {
  /** Configuration that cannot work at all — worth refusing to boot. */
  errors: string[]
  /** Configuration that works but is wrong for the environment. */
  warnings: string[]
}

function isTruthyFlag(value: string | undefined): boolean {
  if (!value) return false
  return ['true', '1', 'yes'].includes(value.trim().toLowerCase())
}

function isAbsoluteUrl(value: string | undefined): boolean {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateClerkConfig(input: ClerkConfigInput): ClerkConfigReport {
  const errors: string[] = []
  const warnings: string[] = []
  const satellite = isTruthyFlag(input.isSatellite)

  // Satellite mode needs an absolute signInUrl. Without one Clerk throws from
  // inside the middleware ("Invalid signInUrl. A satellite application
  // requires a signInUrl for development instances"), which surfaces as a
  // broken /middleware rather than as a configuration error.
  if (satellite && !isAbsoluteUrl(input.signInUrl)) {
    errors.push(
      'NEXT_PUBLIC_CLERK_IS_SATELLITE is enabled but NEXT_PUBLIC_CLERK_SIGN_IN_URL ' +
        `is not an absolute URL (got ${input.signInUrl ?? 'nothing'}). Set an absolute ` +
        'sign-in URL, or unset NEXT_PUBLIC_CLERK_IS_SATELLITE — oliveiq.gr already ' +
        'redirects the apex to www, so satellite mode is not needed for that split.'
    )
  }

  // A development instance in production caps the user count, serves clerk-js
  // from *.clerk.accounts.dev, and drives auth through the dev-browser
  // handshake instead of ordinary production session cookies.
  if (
    input.isProduction &&
    input.publishableKey &&
    !input.publishableKey.startsWith('pk_live_')
  ) {
    warnings.push(
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is a Clerk development instance key ' +
        `(${input.publishableKey.slice(0, 8)}…) but NODE_ENV is production. Development ` +
        'instances limit user counts and rely on the dev-browser handshake, which ' +
        'behaves differently from production sessions on a custom domain. Set the ' +
        'pk_live_ publishable key and the matching sk_live_ CLERK_SECRET_KEY.'
    )
  }

  return { errors, warnings }
}
