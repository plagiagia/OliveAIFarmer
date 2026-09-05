/**
 * Next.js vendors path-to-regexp and compiles `middleware.config.matcher`
 * with it. `src/middleware.test.ts` uses the same vendored copy so the test
 * exercises the exact matcher semantics that ship, rather than an
 * independently versioned one.
 */
declare module 'next/dist/compiled/path-to-regexp' {
  export function pathToRegexp(path: string): RegExp
}
