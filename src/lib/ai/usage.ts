/**
 * Token usage tracking + monthly budget enforcement per Clerk user.
 *
 * Persisted to the `AIUsage` table so cost is auditable and we can
 * enforce a soft cap before calling OpenAI again.
 */
import { prisma } from '@/lib/db'

const MONTHLY_BUDGET = Number(process.env.OPENAI_MONTHLY_TOKEN_BUDGET ?? 500_000)

export interface UsageInput {
  userId: string
  endpoint: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export async function recordAIUsage(input: UsageInput): Promise<void> {
  try {
    await prisma.aIUsage.create({ data: input })
  } catch (err) {
    // Never fail the request because of usage logging.
    console.error('[ai/usage] failed to record usage', err)
  }
}

export interface BudgetStatus {
  withinBudget: boolean
  used: number
  limit: number
  remaining: number
}

export async function checkMonthlyBudget(userId: string): Promise<BudgetStatus> {
  if (!Number.isFinite(MONTHLY_BUDGET) || MONTHLY_BUDGET <= 0) {
    return { withinBudget: true, used: 0, limit: 0, remaining: Number.POSITIVE_INFINITY }
  }
  const start = new Date()
  start.setUTCDate(1)
  start.setUTCHours(0, 0, 0, 0)
  const agg = await prisma.aIUsage.aggregate({
    where: { userId, createdAt: { gte: start } },
    _sum: { totalTokens: true },
  })
  const used = agg._sum.totalTokens ?? 0
  return {
    withinBudget: used < MONTHLY_BUDGET,
    used,
    limit: MONTHLY_BUDGET,
    remaining: Math.max(0, MONTHLY_BUDGET - used),
  }
}
