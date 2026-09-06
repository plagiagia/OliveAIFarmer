'use client'

import { useEffect } from 'react'
import { capturePostHogException } from '@/lib/posthog-client'

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>) {
  useEffect(() => {
    capturePostHogException(error)
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
