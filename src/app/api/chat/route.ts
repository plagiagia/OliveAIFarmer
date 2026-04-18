import { getWeatherHistory, prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { recordAIUsage, checkMonthlyBudget } from '@/lib/ai/usage'
import { chatRequestSchema } from '@/lib/ai/schemas'
import {
  AI_MODEL,
  buildFarmContextMessage,
  CHAT_PROMPT_VERSION,
  getCurrentSeason,
  openai,
  streamChat,
  type FarmContext,
} from '@/lib/openai'
import { ACTIVITY_TYPE_LABELS } from '@/types/activity'
import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/chat
 *
 * Streaming agronomist chat. Body:
 *   { farmId?: string, messages: [{role:'user'|'assistant', content:string}, ...] }
 *
 * Response is text/event-stream. Each event payload is JSON:
 *   { type: 'token', content: '...' }   — incremental delta
 *   { type: 'done',  usage: {...} }     — final, includes token usage
 *   { type: 'error', message: '...' }   — terminal error
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!openai) {
    return new Response(JSON.stringify({ error: 'AI service is not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 30 messages / hour / user is generous for chat use.
  const rl = checkRateLimit(`ai:chat:${userId}`, 30, 60 * 60 * 1000)
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: 'Πάρα πολλά μηνύματα chat. Δοκιμάστε ξανά αργότερα.', retryAfterSeconds: rl.retryAfterSeconds }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfterSeconds) } }
    )
  }

  const budget = await checkMonthlyBudget(userId)
  if (!budget.withinBudget) {
    return new Response(
      JSON.stringify({ error: 'Έχετε φτάσει το μηνιαίο όριο χρήσης AI.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const parsed = chatRequestSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid request', details: parsed.error.issues }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
  const { farmId, messages } = parsed.data

  // Build farm context if a farm is selected.
  let farmContextMessage: string | undefined
  if (farmId) {
    const farm = await prisma.farm.findFirst({
      where: { id: farmId, user: { clerkId: userId } },
      include: {
        activities: {
          where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          orderBy: { date: 'desc' },
          take: 10,
          select: { type: true, title: true, date: true, notes: true, completed: true },
        },
        harvests: { orderBy: { year: 'desc' }, take: 3 },
        satelliteData: { orderBy: { date: 'desc' }, take: 2 },
      },
    })

    if (farm) {
      const records = await getWeatherHistory(farmId, {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        limit: 30,
      })
      type WR = { tempHigh: number; tempLow: number; rainfall: number; humidity: number }
      const wr = records as WR[]
      const weatherSummary = wr.length
        ? {
            avgTempHigh: wr.reduce((s, r) => s + r.tempHigh, 0) / wr.length,
            avgTempLow: wr.reduce((s, r) => s + r.tempLow, 0) / wr.length,
            totalRainfall: wr.reduce((s, r) => s + r.rainfall, 0),
            avgHumidity: wr.reduce((s, r) => s + r.humidity, 0) / wr.length,
            rainyDays: wr.filter((r) => r.rainfall > 0).length,
          }
        : { avgTempHigh: 0, avgTempLow: 0, totalRainfall: 0, avgHumidity: 0, rainyDays: 0 }

      const ctx: FarmContext = {
        farmId: farm.id,
        name: farm.name,
        location: farm.location,
        coordinates: farm.coordinates || undefined,
        totalArea: farm.totalArea || undefined,
        treeAge: farm.treeAge || undefined,
        variety: farm.oliveVariety || 'Άγνωστη',
        treeCount: farm.treeCount || 0,
        recentActivities: farm.activities.map((a) => ({
          type: ACTIVITY_TYPE_LABELS[a.type as keyof typeof ACTIVITY_TYPE_LABELS] || a.type,
          date: a.date.toLocaleDateString('el-GR'),
          title: a.title,
          notes: a.notes || undefined,
          completed: a.completed,
        })),
        harvests: farm.harvests.map((h) => ({
          year: h.year,
          totalYield: h.totalYield || undefined,
          yieldPerTree: h.yieldPerTree || undefined,
          pricePerKg: h.pricePerKg || undefined,
        })),
        weatherSummary,
        currentMonth: new Date().getMonth() + 1,
        currentSeason: getCurrentSeason(),
        satelliteData:
          farm.satelliteData.length > 0
            ? {
                ndvi: farm.satelliteData[0].ndvi,
                ndmi: farm.satelliteData[0].ndmi,
                healthScore: farm.satelliteData[0].healthScore,
                stressLevel: farm.satelliteData[0].stressLevel,
                ndviTrend: null,
                lastUpdated: farm.satelliteData[0].recordedAt?.toISOString() || null,
              }
            : undefined,
      }
      farmContextMessage = buildFarmContextMessage(ctx)
    }
  }

  const stream = await streamChat(messages, farmContextMessage)

  // Convert OpenAI stream into SSE.
  const encoder = new TextEncoder()
  const sse = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }
      try {
        let lastUsage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null = null
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta?.content
          if (delta) send({ type: 'token', content: delta })
          if (chunk.usage) lastUsage = chunk.usage
        }
        if (lastUsage?.total_tokens) {
          void recordAIUsage({
            userId,
            endpoint: 'chat',
            model: AI_MODEL,
            promptTokens: lastUsage.prompt_tokens ?? 0,
            completionTokens: lastUsage.completion_tokens ?? 0,
            totalTokens: lastUsage.total_tokens,
          })
        }
        send({ type: 'done', promptVersion: CHAT_PROMPT_VERSION, usage: lastUsage })
        controller.close()
      } catch (err) {
        console.error('[chat] stream error', err)
        send({ type: 'error', message: 'Σφάλμα κατά τη συνομιλία AI.' })
        controller.close()
      }
    },
  })

  return new Response(sse, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
