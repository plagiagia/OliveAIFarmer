import { prisma } from '@/lib/db'
import { env } from '@/env'
import type { AIResponseMeta } from '@/lib/openai'

export class AIBudgetError extends Error {}
export class AIBusyError extends Error {}

/** A short DB transaction reserves budget before external work. No network call holds a DB lock. */
export async function reserveAIUsage(userId: string, model: string, ceiling: number) {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`ai-budget:${userId}`}))`
    const busy = await tx.aIUsage.findFirst({ where: { userId, endpoint: 'insights/reserved', createdAt: { gte: new Date(now.getTime() - 90_000) } } })
    if (busy) throw new AIBusyError('Δημιουργείται ήδη μια ανάλυση. Περιμένετε λίγο και δοκιμάστε ξανά.')
    const agg = await tx.aIUsage.aggregate({ where: { userId, createdAt: { gte: start } }, _sum: { totalTokens: true } })
    if ((agg._sum.totalTokens ?? 0) + ceiling > (env.OPENAI_MONTHLY_TOKEN_BUDGET ?? 500_000)) throw new AIBudgetError('Δεν υπάρχει αρκετό διαθέσιμο όριο AI για νέα ανάλυση αυτόν τον μήνα. Οι αποθηκευμένες προτάσεις παραμένουν διαθέσιμες.')
    return tx.aIUsage.create({ data: { userId, model, endpoint: 'insights/reserved', totalTokens: ceiling } })
  })
}

export async function settleAIUsage(id: string, meta: AIResponseMeta) {
  if (!meta.usage) return // Keep the conservative reservation when the provider doesn't report usage.
  await prisma.aIUsage.update({ where: { id }, data: { model: meta.model, ...meta.usage } })
}

export async function finishAIUsage(id: string, accounted: boolean) {
  await prisma.aIUsage.update({ where: { id }, data: { endpoint: accounted ? 'insights/generate' : 'insights/uncertain' } })
}
