import { prisma } from '@/lib/db'
import {
  DashboardAIInsight,
  generateDashboardInsights,
  getCurrentSeason,
  AI_MODEL,
} from '@/lib/openai'
import { checkRateLimit } from '@/lib/rate-limit'
import { recordAIUsage, checkMonthlyBudget } from '@/lib/ai/usage'
import { ruleBasedDashboardInsights } from '@/lib/ai/fallback'
import { getUserPlanByClerkId } from '@/lib/subscription'
import { hasFeature, requiresPlanMessage } from '@/lib/plans'
import { ACTIVITY_TYPE_LABELS } from '@/types/activity'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

type PortfolioSummary = {
  overallHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  urgentActions: number
  opportunitiesCount: number
}

type DashboardTriggerConditions = {
  aiMeta?: {
    scope?: string
    portfolioSummary?: PortfolioSummary
  }
}

function readPortfolioSummary(
  triggerConditions: Prisma.JsonValue | null
): PortfolioSummary | null {
  if (!triggerConditions || typeof triggerConditions !== 'object' || Array.isArray(triggerConditions)) {
    return null
  }
  const meta = (triggerConditions as DashboardTriggerConditions).aiMeta
  return meta?.portfolioSummary ?? null
}

function reconstructPortfolioSummary(
  insights: Array<{ urgency: string; actionRequired: boolean; type: string }>
): PortfolioSummary | null {
  if (insights.length === 0) return null

  const hasCritical = insights.some(i => i.urgency === 'CRITICAL')
  const hasHigh = insights.some(i => i.urgency === 'HIGH')

  let overallHealth: PortfolioSummary['overallHealth'] = 'GOOD'
  if (hasCritical) overallHealth = 'POOR'
  else if (hasHigh) overallHealth = 'FAIR'
  else overallHealth = 'EXCELLENT'

  return {
    overallHealth,
    urgentActions: insights.filter(
      i => (i.urgency === 'HIGH' || i.urgency === 'CRITICAL') && i.actionRequired
    ).length,
    opportunitiesCount: insights.filter(i =>
      ['OPTIMIZATION', 'SEASONAL_TIP', 'CARE_SUGGESTION'].includes(i.type)
    ).length,
  }
}

// GET - Active dashboard-scope insights for the authenticated user
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        farms: { select: { id: true, name: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const farmIds = user.farms.map(f => f.id)
    const farmNameById = new Map(user.farms.map(f => [f.id, f.name]))

    const insights = await prisma.smartRecommendation.findMany({
      where: {
        isArchived: false,
        OR: [{ farmId: null }, { farmId: { in: farmIds } }],
        triggerConditions: {
          path: ['aiMeta', 'scope'],
          equals: 'dashboard',
        },
        AND: [
          {
            OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
          },
        ],
      },
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
    })

    const enrichedInsights = insights.map(insight => ({
      ...insight,
      farmName: insight.farmId ? farmNameById.get(insight.farmId) ?? null : null,
    }))

    const storedSummary = insights
      .map(i => readPortfolioSummary(i.triggerConditions))
      .find((s): s is PortfolioSummary => s != null)

    const portfolioSummary =
      storedSummary ?? reconstructPortfolioSummary(enrichedInsights)

    const lastGeneratedAt =
      insights.length > 0
        ? insights.reduce(
            (latest, i) => (i.createdAt > latest ? i.createdAt : latest),
            insights[0].createdAt
          )
        : null

    return NextResponse.json({
      success: true,
      insights: enrichedInsights,
      portfolioSummary,
      lastGeneratedAt,
    })
  } catch (error) {
    console.error('Error fetching dashboard insights:', error)
    return NextResponse.json(
      { error: 'Αποτυχία ανάκτησης στρατηγικών συστάσεων' },
      { status: 500 }
    )
  }
}

// POST - Generate dashboard-level AI insights for all farms
export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userPlan = await getUserPlanByClerkId(userId)
    if (!hasFeature(userPlan.plan, 'aiGeoponos')) {
      return NextResponse.json(
        { error: requiresPlanMessage('GROWER', { subject: 'Ο AI Γεωπόνος' }) },
        { status: 403 }
      )
    }

    const rateLimit = checkRateLimit(`ai:dashboard:${userId}`, 6, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Έγιναν πάρα πολλά αιτήματα στρατηγικής AI. Προσπαθήστε ξανά αργότερα.',
          retryAfterSeconds: rateLimit.retryAfterSeconds
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds)
          }
        }
      )
    }

    // Monthly token budget guard.
    const budget = await checkMonthlyBudget(userId)
    if (!budget.withinBudget) {
      return NextResponse.json(
        { error: 'Έχετε φτάσει το μηνιαίο όριο χρήσης AI. Δοκιμάστε ξανά τον επόμενο μήνα.', budget },
        { status: 429 }
      )
    }

    // Get user with all farms and related data
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        farms: {
          include: {
            activities: {
              where: {
                date: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              },
              orderBy: { date: 'desc' },
              take: 20
            },
            harvests: {
              orderBy: { year: 'desc' },
              take: 3
            },
            satelliteData: {
              orderBy: { date: 'desc' },
              take: 2
            }
          }
        }
      }
    })

    if (!user || user.farms.length === 0) {
      return NextResponse.json(
        { error: 'No farms found' },
        { status: 404 }
      )
    }

    // Build portfolio context
    const portfolioContext = {
      // Portfolio overview
      totalFarms: user.farms.length,
      totalTrees: user.farms.reduce((sum, f) => sum + (f.treeCount || 0), 0),
      totalArea: user.farms.reduce((sum, f) => sum + (f.totalArea || 0), 0),

      // Individual farm summaries
      farms: user.farms.map(farm => ({
        id: farm.id,
        name: farm.name,
        location: farm.location,
        variety: farm.oliveVariety || 'Άγνωστη',
        treeAge: farm.treeAge,
        treeCount: farm.treeCount || 0,
        totalArea: farm.totalArea || 0,

        // Recent activity summary
        recentActivities: farm.activities.slice(0, 5).map(a => ({
          type: ACTIVITY_TYPE_LABELS[a.type as keyof typeof ACTIVITY_TYPE_LABELS] || a.type,
          title: a.title,
          date: a.date.toLocaleDateString('el-GR'),
          completed: a.completed
        })),

        // Harvest performance
        harvestTrend: farm.harvests.length >= 2
          ? calculateHarvestTrend(farm.harvests)
          : null,

        lastHarvest: farm.harvests[0]
          ? {
              year: farm.harvests[0].year,
              yieldPerTree: farm.harvests[0].yieldPerTree,
              totalYield: farm.harvests[0].totalYield
            }
          : null,

        // Satellite health
        satelliteHealth: farm.satelliteData[0]
          ? {
              ndvi: farm.satelliteData[0].ndvi,
              stressLevel: farm.satelliteData[0].stressLevel,
              trend: farm.satelliteData.length > 1
                ? calculateNDVITrend(farm.satelliteData[0], farm.satelliteData[1])
                : null,
              lastUpdated: farm.satelliteData[0].date.toISOString()
            }
          : null
      })),

      // Current context
      currentMonth: new Date().getMonth() + 1,
      currentSeason: getCurrentSeason(),
      userName: `${user.firstName} ${user.lastName}`
    }

    // Generate insights using OpenAI; fall back to rule-based engine on failure.
    let aiResponse: Awaited<ReturnType<typeof generateDashboardInsights>>
    let usedFallback = false
    try {
      aiResponse = await generateDashboardInsights(portfolioContext)
    } catch (aiErr) {
      console.error('[ai] generateDashboardInsights failed, falling back to rule-based', aiErr)
      aiResponse = ruleBasedDashboardInsights(portfolioContext)
      usedFallback = true
    }
    const aiMeta = aiResponse.meta

    if (!usedFallback && aiMeta.usage) {
      void recordAIUsage({
        userId,
        endpoint: 'insights/dashboard',
        model: aiMeta.model || AI_MODEL,
        promptTokens: aiMeta.usage.promptTokens,
        completionTokens: aiMeta.usage.completionTokens,
        totalTokens: aiMeta.usage.totalTokens,
      })
    }

    console.info('AI insight generation (dashboard)', {
      userId,
      farmCount: user.farms.length,
      model: aiMeta.model,
      promptVersion: aiMeta.promptVersion,
      requestId: aiMeta.requestId,
      totalTokens: aiMeta.usage?.totalTokens ?? null,
      usedFallback,
    })

    // Soft-archive prior dashboard-scope AI insights (those with no
    // farmId or with a farmId belonging to this user) so the active
    // list reflects the latest run.
    await prisma.smartRecommendation.updateMany({
      where: {
        OR: [
          { farmId: null },
          { farmId: { in: user.farms.map(f => f.id) } },
        ],
        source: 'AI_GENERATED',
        isArchived: false,
      },
      data: { isArchived: true },
    })

    // Get valid farm IDs
    const validFarmIds = new Set(user.farms.map(f => f.id))

    // Save insights to database for each farm mentioned
    // Validate farmId before saving - set to null if invalid
    const savedInsights = await Promise.all(
      aiResponse.insights.map((insight: DashboardAIInsight) => {
        const farmId = insight.farmId && validFarmIds.has(insight.farmId)
          ? insight.farmId
          : null

        return prisma.smartRecommendation.create({
          data: {
            type: insight.type,
            title: insight.title,
            message: insight.message,
            urgency: insight.urgency,
            actionRequired: insight.actionRequired,
            reasoning: insight.reasoning,
            source: usedFallback ? 'RULE_BASED' : 'AI_GENERATED',
            farmId: farmId, // Validated farm ID or null for portfolio-level insights
            weatherBased: false,
            seasonBased: true,
            triggerConditions: {
              aiMeta: {
                ...aiMeta,
                scope: 'dashboard',
                farmId,
                usedFallback,
                portfolioSummary: aiResponse.portfolioSummary ?? null,
              }
            },
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        })
      })
    )

    return NextResponse.json({
      success: true,
      message: `Δημιουργήθηκαν ${savedInsights.length} στρατηγικές συστάσεις`,
      insights: savedInsights,
      portfolioSummary: aiResponse.portfolioSummary
    })
  } catch (error) {
    console.error('Error generating dashboard insights:', error)

    if (error instanceof Error && error.message.includes('OpenAI')) {
      return NextResponse.json(
        { error: 'Η υπηρεσία AI δεν είναι διαθέσιμη αυτή τη στιγμή' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Αποτυχία δημιουργίας στρατηγικών συστάσεων' },
      { status: 500 }
    )
  }
}

// Helper: Calculate harvest trend
function calculateHarvestTrend(harvests: any[]): 'improving' | 'declining' | 'stable' | null {
  if (harvests.length < 2) return null

  const latest = harvests[0].yieldPerTree || 0
  const previous = harvests[1].yieldPerTree || 0

  if (latest === 0 && previous === 0) return 'stable'

  const change = ((latest - previous) / (previous || 1)) * 100

  if (change > 10) return 'improving'
  if (change < -10) return 'declining'
  return 'stable'
}

// Helper: Calculate NDVI trend
function calculateNDVITrend(latest: any, previous: any): 'improving' | 'declining' | 'stable' | null {
  if (!latest.ndvi || !previous.ndvi) return null

  const change = ((latest.ndvi - previous.ndvi) / Math.abs(previous.ndvi || 0.5)) * 100

  if (change > 5) return 'improving'
  if (change < -5) return 'declining'
  return 'stable'
}
