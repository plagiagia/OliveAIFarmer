/**
 * Centralized, type-safe environment variable validation.
 *
 * Import `env` instead of reading `process.env.*` directly so missing or
 * malformed configuration fails fast at boot (or at first import in dev),
 * rather than producing confusing runtime errors deep in API routes.
 */
import { z } from 'zod'
import { validateClerkConfig } from '@/lib/clerk-config'

const isProd = process.env.NODE_ENV === 'production'

// Core production secrets must be present. Optional integrations are modeled
// separately so an unavailable AI or weather provider cannot prevent unrelated
// routes (for example Stripe billing) from starting.
const requiredInProd = (schema: z.ZodString) =>
  isProd ? schema : schema.optional()

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database (Neon). MUST be the pooled host on Vercel.
  DATABASE_URL: z
    .string()
    .url()
    .refine(
      (url) => !isProd || url.includes('-pooler') || url.includes('pgbouncer=true'),
      {
        message:
          'In production DATABASE_URL must use the Neon pooled host (-pooler) with pgbouncer=true&connection_limit=1',
      }
    ),

  // Clerk
  CLERK_SECRET_KEY: requiredInProd(z.string().min(1)),

  // OpenWeatherMap
  OPENWEATHER_API_KEY: z.string().min(1).optional(),

  // Vercel Cron auth
  CRON_SECRET: requiredInProd(z.string().min(16)),

  // OpenAI (AI Geoponos)
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().optional(),
  OPENAI_MONTHLY_TOKEN_BUDGET: z.coerce.number().int().positive().optional(),

  // Stripe billing
  STRIPE_SECRET_KEY: requiredInProd(z.string().min(1)),
  STRIPE_WEBHOOK_SECRET: requiredInProd(z.string().min(1)),
  STRIPE_PRICE_GROWER: z.string().optional(),
  STRIPE_PRICE_GROWER_ANNUAL: z.string().optional(),

  // Web Push (optional; alerts are a no-op until VAPID keys are set)
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  // Upstash REST (optional for local development; protected production routes
  // fail closed when the distributed limiter is not configured or unavailable).
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Dev-only escape hatch for cron auth
  ALLOW_INSECURE_CRON: z.string().optional(),
})

const clientSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: requiredInProd(z.string().min(1)),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  // Satellite mode is off for oliveiq.gr — the apex already 308s to www, so
  // there is no second domain that needs its own Clerk instance. Declared here
  // so that setting it is validated instead of silently breaking middleware.
  NEXT_PUBLIC_CLERK_IS_SATELLITE: z.string().optional(),
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: requiredInProd(z.string().min(1)),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_META_PIXEL_ID: z
    .string()
    .regex(/^\d+$/, 'Meta Pixel ID must contain only digits')
    .optional(),
})

const merged = serverSchema.merge(clientSchema)

const parsed = merged.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  OPENAI_MONTHLY_TOKEN_BUDGET: process.env.OPENAI_MONTHLY_TOKEN_BUDGET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_GROWER: process.env.STRIPE_PRICE_GROWER,
  STRIPE_PRICE_GROWER_ANNUAL: process.env.STRIPE_PRICE_GROWER_ANNUAL,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  ALLOW_INSECURE_CRON: process.env.ALLOW_INSECURE_CRON,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  NEXT_PUBLIC_CLERK_IS_SATELLITE: process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE,
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
})

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  // Throwing here intentionally crashes the serverless function on cold start
  // when configuration is wrong, surfacing the misconfiguration in Vercel logs
  // instead of producing 500s for end users.
  throw new Error(`Invalid environment configuration:\n${issues}`)
}

const clerkConfig = validateClerkConfig({
  publishableKey: parsed.data.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  isSatellite: parsed.data.NEXT_PUBLIC_CLERK_IS_SATELLITE,
  signInUrl: parsed.data.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  isProduction: isProd,
})

if (clerkConfig.errors.length > 0) {
  // Same reasoning as above: crash on cold start with a readable message
  // rather than letting Clerk throw from inside the middleware.
  throw new Error(
    `Invalid Clerk configuration:\n${clerkConfig.errors.map((e) => `  - ${e}`).join('\n')}`
  )
}

for (const warning of clerkConfig.warnings) {
  console.error(`[env] ${warning}`)
}

export const env = parsed.data
export type Env = typeof env
