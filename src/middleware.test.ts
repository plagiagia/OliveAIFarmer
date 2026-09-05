/**
 * Guards the Clerk middleware matcher.
 *
 * The matcher is a plain string that Next.js compiles with path-to-regexp at
 * build time, so a mistake in it is invisible in review and only shows up as a
 * 500 in production ("auth() was called but Clerk can't detect usage of
 * clerkMiddleware()"). These tests compile the exported matcher exactly the way
 * Next.js does and assert which paths it covers.
 */
import { pathToRegexp } from 'next/dist/compiled/path-to-regexp'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: (handler: unknown) => handler,
  createRouteMatcher: (routes: string[]) => {
    const regexps = routes.map((route) => pathToRegexp(route))
    return (req: { nextUrl: { pathname: string } }) =>
      regexps.some((regexp) => regexp.test(req.nextUrl.pathname))
  },
}))

const { config } = await import('./middleware')

function middlewareRunsFor(pathname: string): boolean {
  return config.matcher.some((matcher) => pathToRegexp(matcher).test(pathname))
}

describe('clerk middleware matcher', () => {
  it.each([
    '/',
    '/sign-in',
    '/sign-up',
    '/pricing',
    '/legal/terms',
    '/dashboard',
    '/dashboard/settings',
    '/dashboard/analytics',
    '/dashboard/farms/new',
  ])('covers the rendered route %s', (pathname) => {
    expect(middlewareRunsFor(pathname)).toBe(true)
  })

  it.each([
    // Real id from a production 500: the old matcher read the "js" in "…ajs3"
    // as a file extension and skipped the middleware for this farm only.
    '/dashboard/farms/cmtie911e000110g8y9e8ajs3',
    '/dashboard/farms/cmpngx000110g8y9e8abcd1',
    '/dashboard/farms/cmcssx000110g8y9e8abcd1',
    '/dashboard/farms/cmicox000110g8y9e8abcd1',
  ])('covers farm ids that contain extension-like substrings: %s', (pathname) => {
    expect(middlewareRunsFor(pathname)).toBe(true)
  })

  it.each([
    // Unmatched URLs render /_not-found, which renders the root layout and
    // therefore needs Clerk context just as much as a real page does.
    '/definitely-not-a-route',
    '/meta.json',
    '/apple-touch-icon-precomposed.png',
    '/sw.js.map',
    '/worker-6d0086a2fed79fc0.js.map',
    '/speed-insights/script.js',
    '/.env',
  ])('covers the 404 path %s so /_not-found can render', (pathname) => {
    expect(middlewareRunsFor(pathname)).toBe(true)
  })

  it.each(['/api/weather', '/api/insights/generate', '/api/stripe/webhook'])(
    'covers the API route %s',
    (pathname) => {
      expect(middlewareRunsFor(pathname)).toBe(true)
    }
  )

  it.each([
    '/_next/static/chunks/main-f419e8c3035c5b50.js',
    '/_next/image',
    '/_next/static/css/b2b9c812d239f51d.css',
  ])('skips the Next.js build output %s', (pathname) => {
    expect(middlewareRunsFor(pathname)).toBe(false)
  })
})
