'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  getMarketingConsent,
  setMarketingConsent,
  type MarketingConsent,
} from '@/lib/tracking-consent'

interface MarketingConsentBannerProps {
  enabled: boolean
  hasMarketing: boolean
}

export default function MarketingConsentBanner({
  enabled,
  hasMarketing,
}: MarketingConsentBannerProps) {
  const [marketingConsent, setMarketingChoice] = useState<MarketingConsent | null>(null)
  const [marketingEnabled, setMarketingEnabled] = useState(false)

  useEffect(() => {
    const currentMarketingConsent = getMarketingConsent()
    setMarketingChoice(currentMarketingConsent)
    setMarketingEnabled(currentMarketingConsent === 'granted')
  }, [])

  const hasPendingConsent = hasMarketing && marketingConsent === null

  if (!enabled || !hasPendingConsent) return null

  const saveChoices = () => {
    if (hasMarketing) {
      const consent = marketingEnabled ? 'granted' : 'denied'
      setMarketingConsent(consent)
      setMarketingChoice(consent)
    }
  }

  const rejectOptional = () => {
    setMarketingEnabled(false)
    if (hasMarketing) {
      setMarketingConsent('denied')
      setMarketingChoice('denied')
    }
  }

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-40 border-t border-olive-200 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(46,125,50,0.12)] backdrop-blur sm:p-5"
      role="dialog"
      aria-label="Ρυθμίσεις cookies"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-3xl text-sm leading-relaxed text-gray-700">
          Χρησιμοποιούμε προαιρετικές τεχνολογίες για τη μέτρηση διαφημίσεων. Επιλέξτε αν τις επιτρέπετε.{' '}
          <Link href="/legal/privacy" className="font-medium text-olive-700 underline">
            Πολιτική απορρήτου
          </Link>
        </p>
        <div className="flex shrink-0 flex-col gap-3 sm:min-w-72">
          <div className="space-y-2 text-sm text-gray-700">
            {hasMarketing && (
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={marketingEnabled}
                  onChange={(event) => setMarketingEnabled(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-olive-700"
                />
                <span>Meta Pixel για μέτρηση διαφημίσεων</span>
              </label>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={rejectOptional}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-olive-600 hover:text-olive-700 active:scale-[0.98]"
          >
            Μόνο απαραίτητα
          </button>
          <button
            type="button"
            onClick={saveChoices}
            className="rounded-xl bg-olive-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-olive-800 active:scale-[0.98]"
          >
            Αποθήκευση επιλογών
          </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
