'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>) {
  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
      process.env.NEXT_PUBLIC_POSTHOG_HOST
    ) {
      posthog.captureException(error)
    }
  }, [error])

  return (
    <html lang="el">
      <body>
        <main>
          <h1>Κάτι πήγε στραβά</h1>
          <p>Παρακαλώ δοκιμάστε ξανά.</p>
          <button type="button" onClick={reset}>
            Δοκιμή ξανά
          </button>
        </main>
      </body>
    </html>
  )
}
