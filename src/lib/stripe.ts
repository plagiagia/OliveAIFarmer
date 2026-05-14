import { env } from '@/env'
import Stripe from 'stripe'

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
