'use client'

import { usePlan } from '@/hooks/usePlan'
import type { Plan } from '@/lib/plans'
import { formatAnnualPrice, PLANS } from '@/lib/plans'
import { ArrowUpRight, X } from 'lucide-react'
import { useState } from 'react'
import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

const UPGRADE_HINTS: Partial<Record<Plan, { desc: string; target: Plan }>> = {
  FREE: {
    desc: 'Ξεκλειδώστε ειδοποιήσεις Δάκου, AI Γεωπόνο και εξαγωγή PDF.',
    target: 'GROWER',
  },
}

export default function UpgradeBanner() {
  const { plan, isLoading } = usePlan()
  const { user } = useUser()
  const [dismissed, setDismissed] = useState(true)
  const key = user ? `oliveiq:pro-banner:${user.id}` : null
  useEffect(() => {
    if (!key) return
    try { setDismissed(Date.now() - Number(localStorage.getItem(key) || 0) < 7 * 86400_000) }
    catch { setDismissed(false) }
  }, [key])

  if (isLoading || dismissed || !UPGRADE_HINTS[plan]) return null

  const hint = UPGRADE_HINTS[plan]!
  const target = PLANS[hint.target]

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-olive-700 px-5 py-4 text-white">
      <div className="flex-1 min-w-0">
        <p className="font-semibold">Το ημερολόγιό σας είναι η αρχή.</p>
        <p className="mt-0.5 text-sm text-olive-100">{hint.desc}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/pricing"
          className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-olive-800 hover:bg-olive-50 transition-colors"
        >
          Δείτε το Pro · {formatAnnualPrice(target.priceAnnual)} <ArrowUpRight className="h-4 w-4" />
        </Link>
        <button
          onClick={() => { setDismissed(true); try { if (key) localStorage.setItem(key, String(Date.now())) } catch { /* Session dismissal still works. */ } }}
          className="rounded-lg p-1.5 hover:bg-olive-800/50 transition-colors"
          aria-label="Απόκρυψη πρότασης για μία εβδομάδα"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
