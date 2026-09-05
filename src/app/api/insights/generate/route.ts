import { getWeatherHistory, prisma } from '@/lib/db'
import { env } from '@/env'
import { INACTIVE_FARM_MESSAGE } from '@/lib/farm-activation'
import { checkRateLimitAsync } from '@/lib/rate-limit'
import { generateInsights, getCurrentSeason, AI_MODEL, FARM_INSIGHTS_PROMPT_VERSION, reservationTokens, type AIResponseMeta, type AIInsight } from '@/lib/openai'
import { evidenceFor, missingContext, summarizeWeather, type FarmContext } from '@/lib/ai/context'
import { contextHash } from '@/lib/ai/hash'
import { reserveAIUsage, settleAIUsage, finishAIUsage, AIBudgetError, AIBusyError } from '@/lib/ai/usage'
import { ruleBasedInsights } from '@/lib/ai/fallback'
import { farmIdBodySchema } from '@/lib/ai/schemas'
import { getUserPlanByClerkId } from '@/lib/subscription'
import { hasFeature, requiresPlanMessage } from '@/lib/plans'
import { ACTIVITY_TYPE_LABELS } from '@/types/activity'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  let reservationId: string | undefined
  let accounted = false
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Απαιτείται σύνδεση' }, { status: 401 })
    const userPlan = await getUserPlanByClerkId(userId)
    if (!hasFeature(userPlan.plan, 'aiGeoponos')) return NextResponse.json({ error: requiresPlanMessage('GROWER', { subject: 'Ο AI Γεωπόνος' }) }, { status: 403 })
    const parsed = farmIdBodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: 'Επιλέξτε έγκυρο ελαιώνα' }, { status: 400 })
    const now = new Date()
    const start = new Date(now.getTime() - 30 * 86400_000)
    const farm = await prisma.farm.findFirst({
      where: { id: parsed.data.farmId, user: { clerkId: userId } },
      include: { activities: {
        where: { date: { gte: start, lte: new Date(now.getTime() + 14 * 86400_000) } },
        orderBy: { date: 'desc' }, take: 30,
        select: { type: true, title: true, date: true, notes: true, completed: true },
      } },
    })
    if (!farm) return NextResponse.json({ error: 'Ο ελαιώνας δεν βρέθηκε' }, { status: 404 })
    if (!farm.isActive) return NextResponse.json({ error: INACTIVE_FARM_MESSAGE }, { status: 403 })
    const [weather, harvests] = await Promise.all([
      getWeatherHistory(farm.id, { startDate: start, limit: 30 }),
      prisma.harvest.groupBy({ by: ['year'], where: { farmId: farm.id, completed: true, OR: [{ collectionDate: null }, { collectionDate: { lte: now } }], year: { gte: now.getUTCFullYear() - 2, lte: now.getUTCFullYear() } }, _sum: { totalYield: true }, orderBy: { year: 'desc' } }),
    ])
    const month = Number(new Intl.DateTimeFormat('en', { timeZone: 'Europe/Athens', month: 'numeric' }).format(now))
    const context: FarmContext = {
      farmId: farm.id, name: farm.name.slice(0, 120), location: farm.location.slice(0, 160),
      variety: farm.oliveVariety?.trim().slice(0, 120) || 'Άγνωστη', treeCount: farm.treeCount,
      totalArea: farm.totalArea ?? undefined, treeAge: farm.treeAge ?? undefined,
      recentActivities: farm.activities.filter(a => !a.completed || a.date <= now).map(a => ({
        type: ACTIVITY_TYPE_LABELS[a.type as keyof typeof ACTIVITY_TYPE_LABELS] || a.type,
        date: a.date.toISOString(), title: a.title.slice(0, 120), notes: a.notes?.slice(0, 900), completed: a.completed,
      })),
      harvests: harvests.map(h => ({ year: h.year, totalYield: h._sum.totalYield ?? undefined })),
      weatherSummary: summarizeWeather(weather, now), currentMonth: month, currentSeason: getCurrentSeason(month),
      asOf: new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Athens', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now),
    }
    const hash = contextHash({ context, model: AI_MODEL, promptVersion: FARM_INSIGHTS_PROMPT_VERSION }, 'farm')
    const cached = () => prisma.smartRecommendation.findMany({
      where: { farmId: farm.id, contextHash: hash, isArchived: false, validUntil: { gt: now } }, orderBy: { createdAt: 'desc' },
    })
    const existing = await cached()
    if (existing.length) return NextResponse.json({ success: true, cached: true, insights: existing, usedFallback: existing[0].source === 'RULE_BASED' })
    const rate = await checkRateLimitAsync(`ai:generate:${userId}`, 10, 3600_000)
    if (!rate.allowed) return NextResponse.json({ error: 'Πολλά αιτήματα AI. Δοκιμάστε ξανά αργότερα.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } })
    if (env.OPENAI_API_KEY) {
      reservationId = (await reserveAIUsage(userId, AI_MODEL, reservationTokens(context))).id
      const completed = await cached()
      if (completed.length) {
        await prisma.aIUsage.delete({ where: { id: reservationId } })
        reservationId = undefined
        return NextResponse.json({ success: true, cached: true, insights: completed, usedFallback: completed[0].source === 'RULE_BASED' })
      }
    }
    let usedFallback = false
    let insights: AIInsight[]
    let meta: AIResponseMeta
    try {
      const result = await generateInsights(context, async usage => {
        if (reservationId) await settleAIUsage(reservationId, usage)
        accounted = Boolean(usage.usage)
      })
      insights = result.insights
      meta = result.meta
    } catch (error) {
      console.warn('[ai] generation unavailable', { name: error instanceof Error ? error.name : 'UnknownError' })
      usedFallback = true
      insights = ruleBasedInsights(context)
      meta = { model: 'rule-based', promptVersion: 'fallback-v2', requestId: null, generatedAt: now.toISOString(), usage: null }
      const previous = await prisma.smartRecommendation.findMany({ where: { farmId: farm.id, source: 'AI_GENERATED', isArchived: false, validUntil: { gt: now } } })
      if (previous.length) return NextResponse.json({ success: true, insights: previous, usedFallback: true, notice: 'Η νέα ανάλυση δεν είναι διαθέσιμη. Διατηρήθηκαν οι προηγούμενες προτάσεις με τα αρχικά στοιχεία τους.' })
    }
    const evidence = evidenceFor(context)
    const saved = await prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`ai-farm:${farm.id}`}))`
      const duplicate = await tx.smartRecommendation.findMany({ where: { farmId: farm.id, contextHash: hash, isArchived: false, validUntil: { gt: now } } })
      if (duplicate.length) return duplicate
      await tx.smartRecommendation.updateMany({
        where: { farmId: farm.id, isArchived: false, OR: [{ source: 'AI_GENERATED' }, { source: 'RULE_BASED', contextHash: { startsWith: 'farm:' } }] },
        data: { isArchived: true },
      })
      const results = []
      for (const insight of insights) results.push(await tx.smartRecommendation.create({ data: {
        type: insight.type, title: insight.title, message: insight.message, urgency: insight.urgency,
        actionRequired: insight.actionRequired, reasoning: insight.reasoning,
        source: usedFallback ? 'RULE_BASED' : 'AI_GENERATED', farmId: farm.id,
        weatherBased: insight.evidenceIds.includes('weather'), seasonBased: insight.evidenceIds.includes('season'), contextHash: hash,
        triggerConditions: { aiMeta: { ...meta, scope: 'farm', usedFallback },
          evidence: insight.evidenceIds.map(id => ({ id, detail: evidence[id] })),
          missingData: insight.missingData, followUpQuestion: insight.followUpQuestion,
          context: { region: context.location, variety: context.variety, observedDays: context.weatherSummary.observedDays, weatherFresh: context.weatherSummary.fresh, asOf: context.asOf, missingData: missingContext(context) },
        },
        validFrom: now, validUntil: new Date(now.getTime() + (usedFallback ? 10 * 60_000 : 24 * 3600_000)),
      } }))
      return results
    })
    return NextResponse.json({ success: true, insights: saved, usedFallback, notice: usedFallback ? 'Το AI δεν είναι διαθέσιμο. Εμφανίζονται βασικές υπενθυμίσεις καταγραφής, όχι ανάλυση AI.' : undefined })
  } catch (error) {
    if (error instanceof AIBudgetError || error instanceof AIBusyError) return NextResponse.json({ error: error.message }, { status: 429, headers: { 'Retry-After': error instanceof AIBusyError ? '30' : '3600' } })
    console.error('[ai] generation failed', { name: error instanceof Error ? error.name : 'UnknownError' })
    return NextResponse.json({ error: 'Αποτυχία δημιουργίας προτάσεων. Δοκιμάστε ξανά.' }, { status: 500 })
  } finally {
    if (reservationId) await finishAIUsage(reservationId, accounted).catch(() => console.error('[ai] usage settlement requires reconciliation', { reservationId }))
  }
}
