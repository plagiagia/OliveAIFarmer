'use client'

export default function GlobalError({
  reset,
}: Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>) {
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
