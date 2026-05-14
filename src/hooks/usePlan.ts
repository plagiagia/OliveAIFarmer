'use client'

import type { Plan, PlanConfig } from '@/lib/plans'
import { getPlanConfig, hasFeature } from '@/lib/plans'
import { useEffect, useState } from 'react'

interface PlanState {
  plan: Plan
  config: PlanConfig
  status: string
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: Date | null
  hasStripe: boolean
  isLoading: boolean
}

const DEFAULT_STATE: PlanState = {
  plan: 'FREE',
  config: getPlanConfig('FREE'),
  status: 'ACTIVE',
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
  hasStripe: false,
  isLoading: true,
}

/**
 * Client-side hook to read the current user's subscription plan.
 * Fetches from /api/subscription on mount.
 *
 * Usage:
 *   const { plan, config, can } = usePlan()
 *   if (!can('satellite')) return <UpgradePrompt feature="satellite" />
 */
export function usePlan() {
  const [state, setState] = useState<PlanState>(DEFAULT_STATE)

  useEffect(() => {
    fetch('/api/subscription')
      .then((r) => r.json())
      .then((data) => {
        if (data.plan) {
          setState({
            plan: data.plan as Plan,
            config: getPlanConfig(data.plan as Plan),
            status: data.status,
            cancelAtPeriodEnd: data.cancelAtPeriodEnd,
            currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
            hasStripe: data.hasStripe,
            isLoading: false,
          })
        } else {
          setState((prev) => ({ ...prev, isLoading: false }))
        }
      })
      .catch(() => {
        setState((prev) => ({ ...prev, isLoading: false }))
      })
  }, [])

  /** Returns true if the current plan includes the given feature. */
  const can = (feature: Parameters<typeof hasFeature>[1]) =>
    hasFeature(state.plan, feature)

  /** Redirect to Stripe checkout for a given plan. */
  const upgrade = async (plan: Plan) => {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  /** Open the Stripe customer portal. */
  const manageSubscription = async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  return { ...state, can, upgrade, manageSubscription }
}
