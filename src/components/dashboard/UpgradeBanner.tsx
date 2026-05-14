'use client'

import { usePlan } from '@/hooks/usePlan'
import type { Plan } from '@/lib/plans'
import { PLANS } from '@/lib/plans'
import { ArrowUpRight, X } from 'lucide-react'
import { useState } from 'react'

const UPGRADE_MESSAGES: Partial<Record<Plan, { title: string; desc: string; target: Plan }>> = {
  FREE: {
    title: 'Αναβαθμίστε σε Grower',
    desc: 'Ξεκλειδώστε AI Γεωπόνο, ειδοποιήσεις Δάκου και παρακολούθηση συγκομιδής για €19/μήνα.',
    target: 'GROWER',
  },
  GROWER: {
    title: 'Αναβαθμίστε σε Producer',
    desc: 'Αποκτήστε δορυφορικό NDVI, κόστος ανά λίτρο και θέσεις απόδημων για €49/μήνα.',
    target: 'PRODUCER',
  },
}

export default function UpgradeBanner() {
  const { plan, isLoading, upgrade } = usePlan()
  const [dismissed, setDismissed] = useState(false)

  if (isLoading || dismissed || !UPGRADE_MESSAGES[plan]) return null

  const msg = UPGRADE_MESSAGES[plan]!
  const targetPrice = PLANS[msg.target].priceMonthly

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-olive-700 to-olive-600 px-5 py-4 text-white shadow-md">
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{msg.title}</p>
        <p className="mt-0.5 text-sm text-olive-100">{msg.desc}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => upgrade(msg.target)}
          className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-olive-800 hover:bg-olive-50 transition-colors"
        >
          €{targetPrice}/μήνα <ArrowUpRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1.5 hover:bg-olive-800/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
