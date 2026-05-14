'use client'

import { usePlan } from '@/hooks/usePlan'
import type { Plan, PlanConfig } from '@/lib/plans'
import { Lock } from 'lucide-react'

interface PlanGateProps {
  /** Feature key from PlanConfig.features */
  feature: keyof PlanConfig['features']
  /** Minimum plan required (shown in the upgrade prompt) */
  requiredPlan?: Plan
  /** What to render when access is allowed */
  children: React.ReactNode
  /** Optional custom locked UI. Defaults to an inline lock banner. */
  fallback?: React.ReactNode
}

/**
 * Conditionally renders children if the current user's plan includes
 * the requested feature. Otherwise shows a lock/upgrade prompt.
 *
 * Usage:
 *   <PlanGate feature="satellite" requiredPlan="PRODUCER">
 *     <SatelliteView />
 *   </PlanGate>
 */
export default function PlanGate({ feature, requiredPlan = 'GROWER', children, fallback }: PlanGateProps) {
  const { can, isLoading, upgrade } = usePlan()

  if (isLoading) return null

  if (can(feature)) return <>{children}</>

  if (fallback) return <>{fallback}</>

  const planNames: Record<Plan, string> = {
    FREE: 'Δωρεάν',
    GROWER: 'Grower (€19/μήνα)',
    PRODUCER: 'Producer (€49/μήνα)',
    MILL: 'Mill (€149/μήνα)',
  }

  return (
    <div className="relative rounded-2xl border-2 border-dashed border-olive-200 bg-olive-50/50 p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[120px]">
      <div className="flex items-center gap-2 text-olive-700">
        <Lock className="w-5 h-5" />
        <span className="font-semibold">Απαιτείται πλάνο {planNames[requiredPlan]}</span>
      </div>
      <p className="text-sm text-gray-500">Αναβαθμίστε για να ξεκλειδώσετε αυτή τη λειτουργία.</p>
      <button
        onClick={() => upgrade(requiredPlan)}
        className="mt-1 px-5 py-2 bg-olive-700 hover:bg-olive-800 text-white text-sm font-medium rounded-xl transition-colors"
      >
        Αναβάθμιση τώρα
      </button>
    </div>
  )
}
