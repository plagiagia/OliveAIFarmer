'use client'

import { useEffect, useState } from 'react'
import {
  ANALYTICS_CONSENT_CHANGED_EVENT,
  getAnalyticsConsent,
  getMarketingConsent,
  MARKETING_CONSENT_CHANGED_EVENT,
  setAnalyticsConsent,
  setMarketingConsent,
  type MarketingConsent,
} from '@/lib/tracking-consent'

export default function TrackingConsentSettings() {
  const [analyticsConsent, setAnalyticsChoice] = useState<MarketingConsent | null>(null)
  const [marketingConsent, setMarketingChoice] = useState<MarketingConsent | null>(null)

  useEffect(() => {
    const update = () => {
      setAnalyticsChoice(getAnalyticsConsent())
      setMarketingChoice(getMarketingConsent())
    }

    update()
    window.addEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, update)
    window.addEventListener(MARKETING_CONSENT_CHANGED_EVENT, update)
    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, update)
      window.removeEventListener(MARKETING_CONSENT_CHANGED_EVENT, update)
    }
  }, [])

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
      <h3 className="font-semibold text-gray-900">Ρυθμίσεις προαιρετικής παρακολούθησης</h3>
      <p className="mt-1 text-gray-600">
        Μπορείτε να αλλάξετε τη συγκατάθεσή σας οποτεδήποτε. Η επιλογή σας αποθηκεύεται μόνο στη συσκευή σας.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setAnalyticsConsent('granted')
            setAnalyticsChoice('granted')
          }}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${analyticsConsent === 'granted' ? 'bg-olive-700 text-white' : 'border border-olive-300 bg-white text-olive-800'}`}
        >
          Αποδοχή analytics
        </button>
        <button
          type="button"
          onClick={() => {
            setAnalyticsConsent('denied')
            setAnalyticsChoice('denied')
          }}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${analyticsConsent === 'denied' ? 'bg-gray-700 text-white' : 'border border-gray-300 bg-white text-gray-700'}`}
        >
          Απόρριψη analytics
        </button>
        <button
          type="button"
          onClick={() => {
            setMarketingConsent('granted')
            setMarketingChoice('granted')
          }}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${marketingConsent === 'granted' ? 'bg-olive-700 text-white' : 'border border-olive-300 bg-white text-olive-800'}`}
        >
          Αποδοχή διαφημιστικών cookies
        </button>
        <button
          type="button"
          onClick={() => {
            setMarketingConsent('denied')
            setMarketingChoice('denied')
          }}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${marketingConsent === 'denied' ? 'bg-gray-700 text-white' : 'border border-gray-300 bg-white text-gray-700'}`}
        >
          Απόρριψη διαφημιστικών cookies
        </button>
      </div>
    </div>
  )
}
