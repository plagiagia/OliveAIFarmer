'use client'

import { usePlan } from '@/hooks/usePlan'
import type { BillingInterval, Plan } from '@/lib/plans'
import { PLANS } from '@/lib/plans'
import { useAuth } from '@clerk/nextjs'
import { Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const FREE_HIGHLIGHTS = [
  '1 ελαιώνας',
  'Ψηφιακό ημερολόγιο αγρού',
  'Καταγραφή συγκομιδών & εσόδων',
  'Καιρός για τον ελαιώνα σας',
]

const PRO_HIGHLIGHTS = [
  'Ειδοποιήσεις Δάκου & κυκλοκονίου',
  'Απεριόριστοι ελαιώνες',
  'AI Γεωπόνος — προτάσεις για τον ελαιώνα σας',
  'Εξαγωγή PDF ημερολογίου (έτοιμο για ΟΣΔΕ/λογιστή)',
  'Κόστος ανά κιλό & ανά λίτρο',
]

interface PricingComparisonProps {
  showHeader?: boolean
  className?: string
}

export default function PricingComparison({ showHeader = true, className = '' }: PricingComparisonProps) {
  const { isSignedIn } = useAuth()
  const { plan: currentPlan, isLoading, upgrade } = usePlan()
  const [interval, setInterval] = useState<BillingInterval>('year')
  const [busy, setBusy] = useState(false)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)

  const pro = PLANS.GROWER
  const isFreeCurrent = Boolean(isSignedIn && !isLoading && currentPlan === 'FREE')
  const isProCurrent = Boolean(isSignedIn && !isLoading && currentPlan === 'GROWER')

  const handleUpgrade = async () => {
    setUpgradeError(null)
    setBusy(true)
    try {
      const result = await upgrade('GROWER', interval)
      if (!result.ok) setUpgradeError(result.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="pricing" className={`scroll-mt-20 ${className}`}>
      <div className="mx-auto max-w-3xl px-4">
        {showHeader && (
          <div className="mb-10 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Τιμολόγηση</h2>
            <p className="text-gray-600">
              Ξεκινήστε δωρεάν · Ένα απλό πλάνο Pro για όλη τη σεζόν
            </p>
          </div>
        )}

        {upgradeError && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {upgradeError}
          </div>
        )}

        {/* Billing interval toggle */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setInterval('year')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                interval === 'year' ? 'bg-white text-olive-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Ετήσια <span className="ml-1 text-xs font-bold text-olive-700">-32%</span>
            </button>
            <button
              type="button"
              onClick={() => setInterval('month')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                interval === 'month' ? 'bg-white text-olive-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Μηνιαία
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* FREE */}
          <div
            className={`relative flex flex-col rounded-2xl border-2 p-6 ${
              isFreeCurrent ? 'border-olive-500 bg-olive-50/40 shadow-md' : 'border-gray-200'
            }`}
          >
            {isFreeCurrent && <CurrentBadge />}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Δωρεάν</h3>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-gray-900">€0</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">Το ψηφιακό σας ημερολόγιο, για πάντα δωρεάν.</p>
            </div>
            <ul className="mb-8 flex-1 space-y-2">
              {FREE_HIGHLIGHTS.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-olive-600" />
                  {h}
                </li>
              ))}
            </ul>
            {isFreeCurrent ? (
              <div className="mt-auto cursor-default rounded-xl border-2 border-olive-200 py-3 text-center text-sm font-semibold text-olive-700 opacity-70">
                Τρέχον πλάνο
              </div>
            ) : (
              <Link
                href={isSignedIn ? '/dashboard' : '/sign-up'}
                className="mt-auto block rounded-xl border-2 border-olive-200 py-3 text-center text-sm font-semibold text-olive-700 transition-colors hover:bg-olive-50"
              >
                {isSignedIn ? 'Επιστροφή στο Dashboard' : 'Ξεκινήστε Δωρεάν'}
              </Link>
            )}
          </div>

          {/* PRO */}
          <div
            className={`relative flex flex-col rounded-2xl border-2 p-6 ${
              isProCurrent ? 'border-olive-500 bg-olive-50/40 shadow-md' : 'border-olive-600 shadow-xl'
            }`}
          >
            {isProCurrent ? (
              <CurrentBadge />
            ) : (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-olive-700 px-3 py-0.5 text-xs font-bold text-white">
                Προτεινόμενο
              </div>
            )}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">{pro.nameEl}</h3>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-gray-900">
                  €{interval === 'year' ? pro.priceAnnual : pro.priceMonthly}
                </span>
                <span className="mb-1 text-gray-500">{interval === 'year' ? '/έτος' : '/μήνα'}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {interval === 'year'
                  ? 'Μία πληρωμή για όλη τη σεζόν — λιγότερο από μια λίπανση.'
                  : `Ή €${pro.priceAnnual}/έτος με την ετήσια χρέωση.`}
              </p>
            </div>
            <ul className="mb-8 flex-1 space-y-2">
              {PRO_HIGHLIGHTS.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-olive-600" />
                  {h}
                </li>
              ))}
            </ul>
            {isProCurrent ? (
              <div className="mt-auto cursor-default rounded-xl bg-olive-700 py-3 text-center text-sm font-semibold text-white opacity-70">
                Τρέχον πλάνο
              </div>
            ) : isSignedIn ? (
              <button
                onClick={handleUpgrade}
                disabled={isLoading || busy}
                className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-olive-700 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-olive-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Αναβάθμιση σε Pro
              </button>
            ) : (
              <Link
                href="/sign-up"
                className="mt-auto block rounded-xl bg-olive-700 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-olive-800"
              >
                Ξεκινήστε με το Pro
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function CurrentBadge() {
  return (
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-olive-600 px-3 py-0.5 text-xs font-bold text-white">
      Τρέχον πλάνο
    </div>
  )
}
