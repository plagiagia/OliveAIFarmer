/**
 * Centralized, type-safe environment variable validation.
 *
 * Import `env` instead of reading `process.env.*` directly so missing or
 * malformed configuration fails fast at boot (or at first import in dev),
 * rather than producing confusing runtime errors deep in API routes.
 */
import { z } from 'zod'

const isProd = process.env.NODE_ENV === 'production'

// In production every secret must be present. In dev/test we allow them to be
// optional so contributors can run partial slices of the app without all
// third-party keys configured.
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
  OPENWEATHER_API_KEY: requiredInProd(z.string().min(1)),

  // Vercel Cron auth
  CRON_SECRET: requiredInProd(z.string().min(16)),

  // OpenAI (AI Geoponos)
  OPENAI_API_KEY: requiredInProd(z.string().min(1)),
  OPENAI_MODEL: z.string().optional(),
  OPENAI_MONTHLY_TOKEN_BUDGET: z.coerce.number().int().positive().optional(),

  // Upstash REST (optional distributed rate limiter; falls back to in-memory).
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Copernicus (satellite)
  COPERNICUS_CLIENT_ID: requiredInProd(z.string().min(1)),
  COPERNICUS_CLIENT_SECRET: requiredInProd(z.string().min(1)),

  // Dev-only escape hatch for cron auth
  ALLOW_INSECURE_CRON: z.string().optional(),
})

const clientSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: requiredInProd(z.string().min(1)),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: requiredInProd(z.string().min(1)),
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
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  COPERNICUS_CLIENT_ID: process.env.COPERNICUS_CLIENT_ID,
  COPERNICUS_CLIENT_SECRET: process.env.COPERNICUS_CLIENT_SECRET,
  ALLOW_INSECURE_CRON: process.env.ALLOW_INSECURE_CRON,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
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

export const env = parsed.data
export type Env = typeof env
