import { env } from '@/env'
import Stripe from 'stripe'

/** True when STRIPE_SECRET_KEY is missing or still a template placeholder. */
export function isStripeSecretKeyConfigured(key: string | undefined = env.STRIPE_SECRET_KEY): boolean {
  if (!key || key.length < 24) return false
  if (key.includes('...')) return false
  if (!key.startsWith('sk_test_') && !key.startsWith('sk_live_')) return false
  return true
}

// Singleton Stripe instance (server-side only)
export const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
})

/** Stripe Price IDs for the paid (GROWER/Pro) tier, per billing interval. */
export const STRIPE_PRICE_IDS = {
  GROWER_MONTHLY: env.STRIPE_PRICE_GROWER ?? '',
  GROWER_ANNUAL: env.STRIPE_PRICE_GROWER_ANNUAL ?? '',
} as const

/** Resolve the price ID for a billing interval (annual is the default). */
export function getGrowerPriceId(interval: 'year' | 'month'): string {
  return interval === 'month' ? STRIPE_PRICE_IDS.GROWER_MONTHLY : STRIPE_PRICE_IDS.GROWER_ANNUAL
}
