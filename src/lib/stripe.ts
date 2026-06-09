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

/** Map our Plan enum to Stripe Price IDs from env. */
export const STRIPE_PRICE_IDS = {
  GROWER: env.STRIPE_PRICE_GROWER ?? '',
  PRODUCER: env.STRIPE_PRICE_PRODUCER ?? '',
  MILL: env.STRIPE_PRICE_MILL ?? '',
  VIEWER_SEAT: env.STRIPE_PRICE_VIEWER_SEAT ?? '',
} as const

export type StripePlan = keyof typeof STRIPE_PRICE_IDS
