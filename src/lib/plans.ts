/**
 * OliveIQ SaaS plan definitions.
 * Single source of truth for plan limits and feature flags.
 * Used by both server-side enforcement (API routes) and client-side gating (UI).
 *
 * Two tiers only:
 *   FREE   — the digital field logbook (1 grove, activities, harvests, weather)
 *   GROWER — "Pro": δάκος alerts, AI Γεωπόνος, unlimited groves, PDF logbook export
 *
 * Pricing is annual-first: olive income is seasonal and lumpy, so the paid
 * tier is framed as a per-season price with a monthly option.
 */

export type Plan = 'FREE' | 'GROWER'

const ENTITLED_SUBSCRIPTION_STATUSES = new Set(['ACTIVE', 'TRIALING'])

export interface PlanConfig {
  name: string
  nameEl: string // Greek name
  priceMonthly: number // EUR, 0 = free
  priceAnnual: number // EUR per year, 0 = free
  maxFarms: number // -1 = unlimited
  maxTreesTotal: number // -1 = unlimited
  features: {
    aiGeoponos: boolean // AI agronomist insights
    oliveFlyAlerts: boolean // Δάκος / peacock-spot risk alerts
    costPerLiter: boolean // Oil cost & yield reporting
    multiGrove: boolean // More than 1 farm
    exportPdf: boolean // PDF logbook export (OPEKEPE-ready)
  }
}

export const PLANS: Record<Plan, PlanConfig> = {
  FREE: {
    name: 'Free',
    nameEl: 'Δωρεάν',
    priceMonthly: 0,
    priceAnnual: 0,
    maxFarms: 1,
    maxTreesTotal: -1,
    features: {
      aiGeoponos: false,
      oliveFlyAlerts: false,
      costPerLiter: false,
      multiGrove: false,
      exportPdf: false,
    },
  },

  GROWER: {
    name: 'Pro',
    nameEl: 'Pro',
    priceMonthly: 6,
    priceAnnual: 49,
    maxFarms: -1,
    maxTreesTotal: -1,
    features: {
      aiGeoponos: true,
      oliveFlyAlerts: true,
      costPerLiter: true,
      multiGrove: true,
      exportPdf: true,
    },
  },
}

/** Billing interval for the paid tier. Annual is the promoted default. */
export type BillingInterval = 'year' | 'month'

/**
 * Normalize any stored/legacy plan value to the current two-tier ladder.
 * Legacy PRODUCER/MILL subscribers keep paid features as GROWER.
 */
export function normalizePlan(value: string | null | undefined): Plan {
  if (value === 'GROWER' || value === 'PRODUCER' || value === 'MILL') return 'GROWER'
  return 'FREE'
}

/** Paid access is granted only while Stripe considers the subscription usable. */
export function hasPaidEntitlements(status: string | null | undefined): boolean {
  return status != null && ENTITLED_SUBSCRIPTION_STATUSES.has(status)
}

/** Convert a stored billing plan into the plan that may actually be used. */
export function getEntitledPlan(
  value: string | null | undefined,
  status: string | null | undefined
): Plan {
  const plan = normalizePlan(value)
  return plan === 'GROWER' && !hasPaidEntitlements(status) ? 'FREE' : plan
}

/** Returns the config for a given plan (defaults to FREE). */
export function getPlanConfig(plan: Plan | null | undefined): PlanConfig {
  return PLANS[plan ?? 'FREE']
}

/** Check if a farm count is within plan limits. */
export function canAddFarm(plan: Plan | null | undefined, currentFarmCount: number): boolean {
  const config = getPlanConfig(plan)
  if (config.maxFarms === -1) return true
  return currentFarmCount < config.maxFarms
}

/** Check if adding N trees stays within plan limits. */
export function canAddTrees(
  plan: Plan | null | undefined,
  currentTreeTotal: number,
  treesToAdd: number = 0
): boolean {
  const config = getPlanConfig(plan)
  if (config.maxTreesTotal === -1) return true
  return currentTreeTotal + treesToAdd <= config.maxTreesTotal
}

/** Check if a feature is enabled for a plan. */
export function hasFeature(
  plan: Plan | null | undefined,
  feature: keyof PlanConfig['features']
): boolean {
  return getPlanConfig(plan).features[feature]
}

/** Human-readable plan label (Greek). */
export function planLabel(plan: Plan | null | undefined): string {
  return getPlanConfig(plan).nameEl
}

/** Formatted monthly price for UI (Greek). */
export function formatMonthlyPrice(priceMonthly: number): string {
  return priceMonthly === 0 ? 'Δωρεάν' : `€${priceMonthly}/μήνα`
}

/** Formatted annual price for UI (Greek). */
export function formatAnnualPrice(priceAnnual: number): string {
  return priceAnnual === 0 ? 'Δωρεάν' : `€${priceAnnual}/έτος`
}

/** User-facing message when a feature requires a minimum plan tier. */
export function requiresPlanMessage(
  minPlan: Plan,
  options: { subject: string; verb?: 'απαιτεί' | 'απαιτούν' }
): string {
  const verb = options.verb ?? 'απαιτεί'
  return `${options.subject} ${verb} πλάνο ${planLabel(minPlan)}.`
}
