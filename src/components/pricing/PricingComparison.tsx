'use client'

import { usePlan } from '@/hooks/usePlan'
import type { Plan, PlanConfig } from '@/lib/plans'
import { PLANS, VIEWER_SEAT_PRICE_MONTHLY } from '@/lib/plans'
import { useAuth } from '@clerk/nextjs'
import { Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const PLAN_ORDER = ['FREE', 'GROWER', 'PRODUCER'] as const satisfies readonly Plan[]
type LandingPlan = (typeof PLAN_ORDER)[number]

const FEATURE_LABELS: Record<string, string> = {
  aiGeoponos: 'AI Γεωπόνος (GPT-4)',
  satellite: 'Δορυφορικό NDVI (Sentinel-2)',
  oliveFlyAlerts: 'Ειδοποιήσεις Δάκου',
  costPerLiter: 'Ανάλυση Κόστους/Λίτρο',
  multiGrove: 'Απεριόριστοι ελαιώνες',
  agronomistSharing: 'Κοινή Πρόσβαση Γεωπόνου',
  exportPdf: 'Εξαγωγή PDF',
  viewerSeats: `Θέσεις Απόδημου Θεατή (+€${VIEWER_SEAT_PRICE_MONTHLY}/θέση)`,
}

const LANDING_FEATURE_KEYS: Array<keyof PlanConfig['features']> = [
  'aiGeoponos',
  'satellite',
  'oliveFlyAlerts',
  'costPerLiter',
  'multiGrove',
  'agronomistSharing',
  'exportPdf',
  'viewerSeats',
]

const PLAN_HIGHLIGHTS: Record<LandingPlan, string[]> = {
  FREE: ['1 ελαιώνας', 'Ψηφιακό ημερολόγιο', 'Καταγραφή δραστηριοτήτων'],
  GROWER: ['έως 3 ελαιώνες', 'Ειδοποιήσεις Δάκου', 'AI Γεωπόνος', 'Εξαγωγή PDF'],
  PRODUCER: ['Απεριόριστοι ελαιώνες', 'NDVI Sentinel-2', 'Κόστος ανά λίτρο', 'Θέσεις Απόδημου', 'Κοινή πρόσβαση γεωπόνου'],
}

interface PricingComparisonProps {
  showHeader?: boolean
  className?: string
}

export default function PricingComparison({ showHeader = true, className = '' }: PricingComparisonProps) {
  const { isSignedIn } = useAuth()
  const { plan: currentPlan, isLoading, upgrade } = usePlan()
  const [busyPlan, setBusyPlan] = useState<Plan | null>(null)

  const handleUpgrade = async (target: Plan) => {
    setBusyPlan(target)
    await upgrade(target)
    setBusyPlan(null)
  }

  return (
    <section id="pricing" className={`scroll-mt-20 ${className}`}>
      <div className="mx-auto max-w-6xl px-4">
        {showHeader && (
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Τιμολόγηση</h2>
            <p className="text-gray-600">Ξεκινήστε δωρεάν · Αναβαθμίστε όταν μεγαλώσετε</p>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLAN_ORDER.map((plan) => {
            const cfg = PLANS[plan]
            const isPopular = plan === 'PRODUCER'
            const isCurrent = isSignedIn && !isLoading && currentPlan === plan

            return (
              <div
                key={plan}
                className={`relative flex flex-col rounded-2xl border-2 p-6 ${
                  isCurrent
                    ? 'border-olive-500 bg-olive-50/40 shadow-md'
                    : isPopular
                      ? 'border-olive-600 shadow-xl'
                      : 'border-gray-200'
                }`}
              >
                {isPopular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-olive-700 px-3 py-0.5 text-xs font-bold text-white">
                    Πιο Δημοφιλές
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-olive-600 px-3 py-0.5 text-xs font-bold text-white">
                    Τρέχον πλάνο
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{cfg.nameEl}</h3>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">
                      {cfg.priceMonthly === 0 ? 'Δωρεάν' : `€${cfg.priceMonthly}`}
                    </span>
                    {cfg.priceMonthly > 0 && (
                      <span className="mb-1 text-gray-500">/μήνα</span>
                    )}
                  </div>
                </div>

                <ul className={`space-y-2 ${plan === 'FREE' ? 'mb-8 flex-1' : 'mb-6'}`}>
                  {PLAN_HIGHLIGHTS[plan].map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-olive-600" />
                      {h}
                    </li>
                  ))}
                </ul>

                {plan !== 'FREE' && (
                  <ul className="mb-8 space-y-2 border-t pt-4">
                    {LANDING_FEATURE_KEYS.map((f) => (
                      <li
                        key={f}
                        className={`flex items-start gap-2 text-xs ${cfg.features[f] ? 'text-gray-700' : 'text-gray-400 line-through'}`}
                      >
                        {cfg.features[f]
                          ? <Check className="mt-0.5 h-3 w-3 shrink-0 text-olive-600" />
                          : <span className="mt-0.5 h-3 w-3 shrink-0">–</span>
                        }
                        {FEATURE_LABELS[f] ?? f}
                      </li>
                    ))}
                  </ul>
                )}

                <PlanCta
                  plan={plan}
                  cfg={cfg}
                  isPopular={isPopular}
                  isCurrent={isCurrent}
                  isSignedIn={!!isSignedIn}
                  isLoading={isLoading}
                  busyPlan={busyPlan}
                  onUpgrade={handleUpgrade}
                />
              </div>
            )
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-dashed border-olive-300 bg-olive-50 p-6 text-center">
          <p className="font-semibold text-olive-800">
            🌍 Θέση Απόδημου Θεατή — +€{VIEWER_SEAT_PRICE_MONTHLY}/μήνα ανά πρόσκληση
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Δώστε read-only πρόσβαση σε συγγενή ή γεωπόνο στο εξωτερικό. Διαθέσιμο στο πλάνο Παραγωγός.
          </p>
        </div>
      </div>
    </section>
  )
}

function PlanCta({
  plan,
  cfg,
  isPopular,
  isCurrent,
  isSignedIn,
  isLoading,
  busyPlan,
  onUpgrade,
}: {
  plan: Plan
  cfg: PlanConfig
  isPopular: boolean
  isCurrent: boolean
  isSignedIn: boolean
  isLoading: boolean
  busyPlan: Plan | null
  onUpgrade: (plan: Plan) => void
}) {
  const baseClass = `mt-auto rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
    isPopular
      ? 'bg-olive-700 text-white hover:bg-olive-800'
      : 'border-2 border-olive-200 text-olive-700 hover:bg-olive-50'
  }`

  if (isCurrent) {
    return (
      <div className={`${baseClass} cursor-default opacity-70`}>
        Τρέχον πλάνο
      </div>
    )
  }

  if (isSignedIn) {
    if (cfg.priceMonthly === 0) {
      return (
        <Link href="/dashboard" className={`block ${baseClass}`}>
          Επιστροφή στο Dashboard
        </Link>
      )
    }

    return (
      <button
        onClick={() => onUpgrade(plan)}
        disabled={isLoading || busyPlan !== null}
        className={`inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 ${baseClass}`}
      >
        {busyPlan === plan && <Loader2 className="h-4 w-4 animate-spin" />}
        Επιλογή Πλάνου
      </button>
    )
  }

  return (
    <Link href="/sign-up" className={`block ${baseClass}`}>
      {cfg.priceMonthly === 0 ? 'Ξεκινήστε Δωρεάν' : 'Επιλογή Πλάνου'}
    </Link>
  )
}
