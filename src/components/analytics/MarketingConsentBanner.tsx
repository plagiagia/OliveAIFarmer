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
}

export default function MarketingConsentBanner({ enabled }: MarketingConsentBannerProps) {
  const [consent, setConsent] = useState<MarketingConsent | null>(null)

  useEffect(() => {
    setConsent(getMarketingConsent())
  }, [])

  if (!enabled || consent !== null) return null

  const chooseConsent = (value: MarketingConsent) => {
    setMarketingConsent(value)
    setConsent(value)
  }

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-40 border-t border-olive-200 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(46,125,50,0.12)] backdrop-blur sm:p-5"
      role="dialog"
      aria-label="Ρυθμίσεις cookies"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-3xl text-sm leading-relaxed text-gray-700">
          Χρησιμοποιούμε προαιρετικά cookies μέτρησης διαφημίσεων για να κατανοούμε
          ποιες καμπάνιες οδηγούν σε δημιουργία ελαιώνα. Τα ενεργοποιούμε μόνο με τη
          συγκατάθεσή σας.{' '}
          <Link href="/legal/privacy" className="font-medium text-olive-700 underline">
            Πολιτική απορρήτου
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => chooseConsent('denied')}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-olive-600 hover:text-olive-700 active:scale-[0.98]"
          >
            Μόνο απαραίτητα
          </button>
          <button
            type="button"
            onClick={() => chooseConsent('granted')}
            className="rounded-xl bg-olive-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-olive-800 active:scale-[0.98]"
          >
            Αποδοχή
          </button>
        </div>
      </div>
    </aside>
  )
}
