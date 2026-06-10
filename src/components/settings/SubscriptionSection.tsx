'use client'

import { usePlan } from '@/hooks/usePlan'
import type { Plan } from '@/lib/plans'
import { formatAnnualPrice, PLANS } from '@/lib/plans'
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const UPGRADE_TARGETS: Partial<Record<Plan, Plan[]>> = {
  FREE: ['GROWER'],
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ενεργή',
  CANCELED: 'Ακυρωμένη',
  PAST_DUE: 'Εκκρεμής πληρωμή',
  TRIALING: 'Δοκιμαστική',
}

function formatGroveLimit(maxFarms: number): string {
  if (maxFarms === -1) return 'Απεριόριστοι ελαιώνες'
  if (maxFarms === 1) return '1 ελαιώνας'
  return `Έως ${maxFarms} ελαιώνες`
}

export default function SubscriptionSection() {
  const {
    plan,
    config,
    status,
    cancelAtPeriodEnd,
    currentPeriodEnd,
    hasStripe,
    isLoading,
    upgrade,
    manageSubscription,
  } = usePlan()
  const [busy, setBusy] = useState<'portal' | Plan | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePortal = async () => {
    setBusy('portal')
    setError(null)
    const ok = await manageSubscription()
    if (!ok) {
      setError('Δεν βρέθηκε ενεργή συνδρομή Stripe. Επικοινωνήστε μαζί μας αν χρειάζεστε βοήθεια.')
      setBusy(null)
    }
  }

  const handleUpgrade = async (target: Plan) => {
    setBusy(target)
    setError(null)
    try {
      const result = await upgrade(target)
      if (!result.ok) setError(result.error)
    } finally {
      setBusy(null)
    }
  }

  const upgradeOptions = UPGRADE_TARGETS[plan] ?? []

  return (
    <section id="subscription" className="mb-10 scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <CreditCard className="mt-0.5 h-6 w-6 shrink-0 text-olive-700" />
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900">Συνδρομή &amp; Πλάνο</h2>
          <p className="mt-1 text-sm text-gray-600">
            Δείτε το τρέχον πλάνο σας, αναβαθμίστε ή διαχειριστείτε τη χρέωση μέσω Stripe.
          </p>

          {isLoading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Φόρτωση πλάνου…
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-olive-100 bg-olive-50/60 px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-base font-semibold text-olive-900">{config.nameEl}</span>
                  <span className="text-sm text-olive-700">
                    {config.priceAnnual === 0 ? 'Δωρεάν' : formatAnnualPrice(config.priceAnnual)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{formatGroveLimit(config.maxFarms)}</p>
                {hasStripe && (
                  <p className="mt-1 text-sm text-gray-500">
                    Κατάσταση: {STATUS_LABELS[status] ?? status}
                  </p>
                )}
                {cancelAtPeriodEnd && currentPeriodEnd && (
                  <p className="mt-2 text-sm font-medium text-amber-800">
                    Η συνδρομή λήγει στις{' '}
                    {currentPeriodEnd.toLocaleDateString('el-GR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    .
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {hasStripe && (
                  <button
                    onClick={handlePortal}
                    disabled={busy !== null}
                    className="inline-flex items-center gap-2 rounded-xl bg-olive-700 px-4 py-2 text-sm font-semibold text-white hover:bg-olive-800 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                  >
                    {busy === 'portal' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    Διαχείριση συνδρομής
                  </button>
                )}

                {upgradeOptions.map((target) => {
                  const targetCfg = PLANS[target]
                  return (
                    <button
                      key={target}
                      onClick={() => handleUpgrade(target)}
                      disabled={busy !== null}
                      className="inline-flex items-center gap-2 rounded-xl border border-olive-300 bg-white px-4 py-2 text-sm font-semibold text-olive-800 hover:bg-olive-50 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                    >
                      {busy === target && <Loader2 className="h-4 w-4 animate-spin" />}
                      Αναβάθμιση σε {targetCfg.nameEl} ({formatAnnualPrice(targetCfg.priceAnnual)})
                    </button>
                  )
                })}

                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Σύγκριση πλάνων
                </Link>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
