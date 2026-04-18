import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { recordAIUsage, checkMonthlyBudget } from '@/lib/ai/usage'
import { diagnoseRequestSchema } from '@/lib/ai/schemas'
import { AI_VISION_MODEL, diagnoseLeafImage, openai } from '@/lib/openai'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/diagnose
 *
 * Vision diagnosis of a leaf/branch photo for the user's farm.
 * Body: { farmId: string, imageUrl: string, notes?: string }
 *
 * The image must be a Vercel Blob URL belonging to the same project.
 * We do not re-host the image here; the caller is responsible for
 * uploading first via the existing /api/upload route.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!openai) {
    return NextResponse.json({ error: 'AI vision service is not configured' }, { status: 503 })
  }

  // Conservative limit — vision calls are expensive.
  const rl = checkRateLimit(`ai:diagnose:${userId}`, 8, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Πάρα πολλές διαγνώσεις. Δοκιμάστε ξανά αργότερα.', retryAfterSeconds: rl.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    )
  }

  const budget = await checkMonthlyBudget(userId)
  if (!budget.withinBudget) {
    return NextResponse.json(
      { error: 'Έχετε φτάσει το μηνιαίο όριο χρήσης AI.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = diagnoseRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    )
  }
  const { farmId, imageUrl, notes } = parsed.data

  // Verify the farm belongs to the user.
  const farm = await prisma.farm.findFirst({
    where: { id: farmId, user: { clerkId: userId } },
    select: { id: true },
  })
  if (!farm) {
    return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
  }

  // Allowlist hosts to prevent SSRF / using OpenAI as a proxy fetcher.
  const allowedHosts = [
    'public.blob.vercel-storage.com',
    'blob.vercel-storage.com',
  ]
  let host: string
  try {
    host = new URL(imageUrl).hostname
  } catch {
    return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 })
  }
  if (!allowedHosts.some((h) => host.endsWith(h))) {
    return NextResponse.json(
      { error: 'Επιτρέπονται μόνο εικόνες από το cloud storage της εφαρμογής.' },
      { status: 400 }
    )
  }

  try {
    const result = await diagnoseLeafImage(imageUrl, notes)

    if (result.meta.usage) {
      void recordAIUsage({
        userId,
        endpoint: 'diagnose',
        model: result.meta.model || AI_VISION_MODEL,
        promptTokens: result.meta.usage.promptTokens,
        completionTokens: result.meta.usage.completionTokens,
        totalTokens: result.meta.usage.totalTokens,
      })
    }

    // Persist as a SmartRecommendation so it shows in the insight feed.
    const urgencyMap = {
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH',
      CRITICAL: 'CRITICAL',
    } as const

    await prisma.smartRecommendation.create({
      data: {
        type: 'RISK_WARNING',
        title: `Διάγνωση φωτογραφίας: ${result.diagnosis.diagnosis}`,
        message: [
          result.diagnosis.symptoms.length
            ? `Συμπτώματα: ${result.diagnosis.symptoms.join(', ')}`
            : null,
          result.diagnosis.likelyCauses.length
            ? `Πιθανές αιτίες: ${result.diagnosis.likelyCauses.join(', ')}`
            : null,
          result.diagnosis.recommendedActions.length
            ? `Συστάσεις: ${result.diagnosis.recommendedActions.join(' • ')}`
            : null,
          `⚠️ ${result.diagnosis.disclaimer}`,
        ]
          .filter(Boolean)
          .join('\n\n'),
        urgency: urgencyMap[result.diagnosis.urgency],
        actionRequired: result.diagnosis.urgency === 'HIGH' || result.diagnosis.urgency === 'CRITICAL',
        reasoning: `Vision διάγνωση με confidence ${(result.diagnosis.confidence * 100).toFixed(0)}%.`,
        source: 'AI_GENERATED',
        farmId: farm.id,
        triggerConditions: {
          aiMeta: { ...result.meta, scope: 'diagnose', imageUrl },
          confidence: result.diagnosis.confidence,
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json({
      success: true,
      diagnosis: result.diagnosis,
      meta: result.meta,
    })
  } catch (err) {
    console.error('[diagnose] error', err)
    return NextResponse.json(
      { error: 'Αποτυχία διάγνωσης εικόνας' },
      { status: 500 }
    )
  }
}
