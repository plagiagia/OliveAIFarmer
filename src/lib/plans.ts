/**
 * OliveIQ SaaS plan definitions.
 * Single source of truth for plan limits and feature flags.
 * Used by both server-side enforcement (API routes) and client-side gating (UI).
 */

export type Plan = 'FREE' | 'GROWER' | 'PRODUCER' | 'MILL'

export interface PlanConfig {
  name: string
  nameEl: string // Greek name
  priceMonthly: number // EUR, 0 = free
  maxFarms: number // -1 = unlimited
  maxTreesTotal: number // -1 = unlimited
  maxViewerSeats: number // 0 = not allowed; -1 = unlimited
  features: {
    aiGeoponos: boolean // AI agronomist chat
    satellite: boolean // Sentinel-2 NDVI
    oliveFlyAlerts: boolean // Βακτήριο/Δάκος outbreak alerts
    costPerLiter: boolean // Oil cost & yield reporting
    multiGrove: boolean // More than 1 farm
    agronomistSharing: boolean // Invite agronomist collaborator
    exportPdf: boolean // PDF export
    millRollup: boolean // Multi-producer mill aggregation
    traceability: boolean // Traceability certificate export
    viewerSeats: boolean // Diaspora viewer add-on
  }
}

export const PLANS: Record<Plan, PlanConfig> = {
  FREE: {
    name: 'Free',
    nameEl: 'Δωρεάν',
    priceMonthly: 0,
    maxFarms: 1,
    maxTreesTotal: -1,
    maxViewerSeats: 0,
    features: {
      aiGeoponos: false,
      satellite: false,
      oliveFlyAlerts: false,
      costPerLiter: false,
      multiGrove: false,
      agronomistSharing: false,
      exportPdf: false,
      millRollup: false,
      traceability: false,
      viewerSeats: false,
    },
  },

  GROWER: {
    name: 'Small Grove',
    nameEl: 'Μικρός Ελαιώνας',
    priceMonthly: 14,
    maxFarms: 3,
    maxTreesTotal: -1,
    maxViewerSeats: 0,
    features: {
      aiGeoponos: true,
      satellite: false,
      oliveFlyAlerts: true,
      costPerLiter: false,
      multiGrove: false,
      agronomistSharing: false,
      exportPdf: true,
      millRollup: false,
      traceability: false,
      viewerSeats: false,
    },
  },

  PRODUCER: {
    name: 'Producer',
    nameEl: 'Παραγωγός',
    priceMonthly: 34,
    maxFarms: -1,
    maxTreesTotal: -1,
    maxViewerSeats: -1,
    features: {
      aiGeoponos: true,
      satellite: true,
      oliveFlyAlerts: true,
      costPerLiter: true,
      multiGrove: true,
      agronomistSharing: true,
      exportPdf: true,
      millRollup: false,
      traceability: false,
      viewerSeats: true,
    },
  },

  MILL: {
    name: 'Mill / Coop',
    nameEl: 'Ελαιουργείο / Συνεταιρισμός',
    priceMonthly: 149,
    maxFarms: -1,
    maxTreesTotal: -1,
    maxViewerSeats: -1,
    features: {
      aiGeoponos: true,
      satellite: true,
      oliveFlyAlerts: true,
      costPerLiter: true,
      multiGrove: true,
      agronomistSharing: true,
      exportPdf: true,
      millRollup: true,
      traceability: true,
      viewerSeats: true,
    },
  },
}

export const VIEWER_SEAT_PRICE_MONTHLY = 9 // EUR per seat per month

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
