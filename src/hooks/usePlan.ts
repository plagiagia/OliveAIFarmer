'use client'

import type { BillingInterval, Plan, PlanConfig } from '@/lib/plans'
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

export type UpgradeResult = { ok: true } | { ok: false; error: string }

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
 *   if (!can('aiGeoponos')) return <UpgradePrompt feature="aiGeoponos" />
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

  /** Redirect to Stripe checkout for a given plan (annual by default). */
  const upgrade = async (plan: Plan, interval: BillingInterval = 'year'): Promise<UpgradeResult> => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (res.ok && data.url) {
        window.location.href = data.url
        return { ok: true }
      }
      return {
        ok: false,
        error: data.error ?? 'Αποτυχία έναρξης πληρωμής. Δοκιμάστε ξανά.',
      }
    } catch {
      return {
        ok: false,
        error: 'Σφάλμα σύνδεσης. Ελέγξτε το δίκτυό σας και δοκιμάστε ξανά.',
      }
    }
  }

  /** Open the Stripe customer portal. Returns false if no portal URL is available. */
  const manageSubscription = async (): Promise<boolean> => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
      return true
    }
    return false
  }

  return { ...state, can, upgrade, manageSubscription }
}
