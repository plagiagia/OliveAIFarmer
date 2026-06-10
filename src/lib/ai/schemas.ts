/**
 * Zod schemas for AI Insight payloads.
 *
 * Used to validate raw OpenAI JSON output before persisting, and to
 * validate inbound API request bodies.
 *
 * Keeping schemas here means a prompt regression that produces an
 * unexpected shape *fails loudly* instead of being silently filtered.
 */
import { z } from 'zod'

export const insightTypeSchema = z.enum([
  'TASK_REMINDER',
  'WEATHER_ALERT',
  'CARE_SUGGESTION',
  'OPTIMIZATION',
  'RISK_WARNING',
  'SEASONAL_TIP',
])

export const urgencySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

export const aiInsightSchema = z.object({
  type: insightTypeSchema,
  title: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(1200),
  urgency: urgencySchema,
  actionRequired: z.boolean().default(false),
  reasoning: z.string().trim().min(1).max(500),
  // Optional confidence the model can self-report (0..1).
  confidence: z.number().min(0).max(1).optional(),
})
export type AIInsightParsed = z.infer<typeof aiInsightSchema>

export const aiInsightsResponseSchema = z.object({
  insights: z.array(aiInsightSchema).min(1).max(10),
})

// Common API request bodies
export const farmIdBodySchema = z.object({
  farmId: z.string().trim().min(1),
})
