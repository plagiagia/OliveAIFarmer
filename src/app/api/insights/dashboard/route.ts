import { prisma } from '@/lib/db'
import { generateDashboardInsights, getCurrentSeason } from '@/lib/openai'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Activity type translation
const ACTIVITY_TYPE_GREEK: Record<string, string> = {
  WATERING: 'Πότισμα',
  PRUNING: 'Κλάδεμα',
  FERTILIZING: 'Λίπανση',
  PEST_CONTROL: 'Φυτοπροστασία',
  SOIL_WORK: 'Εργασίες εδάφους',
  HARVESTING: 'Συγκομιδή',
  MAINTENANCE: 'Συντήρηση',
  INSPECTION: 'Επιθεώρηση',
  OTHER: 'Άλλο'
}

// POST - Generate dashboard-level AI insights for all farms
export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    console.log('=== Dashboard Insights Generation ===')
    console.log('User:', user.firstName, user.lastName)
    console.log('Number of farms:', user.farms.length)

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
          type: ACTIVITY_TYPE_GREEK[a.type] || a.type,
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

    console.log('Portfolio context built:')
    console.log('- Total farms:', portfolioContext.totalFarms)
    console.log('- Total trees:', portfolioContext.totalTrees)
    console.log('- Total area:', portfolioContext.totalArea)
    console.log('- Farms:', portfolioContext.farms.map(f => `${f.name} (${f.variety})`).join(', '))
    console.log('- Current season:', portfolioContext.currentSeason)

    // Generate insights using OpenAI
    console.log('Calling OpenAI for dashboard insights...')
    const aiResponse = await generateDashboardInsights(portfolioContext)
    console.log('OpenAI response received:')
    console.log('- Number of insights:', aiResponse.insights?.length || 0)
    console.log('- Portfolio summary:', JSON.stringify(aiResponse.portfolioSummary))

    // Save insights to database for each farm mentioned
    const savedInsights = await Promise.all(
      aiResponse.insights.map((insight: any) =>
        prisma.smartRecommendation.create({
          data: {
            type: insight.type as any,
            title: insight.title,
            message: insight.message,
            urgency: insight.urgency as any,
            actionRequired: insight.actionRequired,
            reasoning: insight.reasoning,
            source: 'AI_GENERATED',
            farmId: insight.farmId || null, // Can be null for portfolio-level insights
            weatherBased: false,
            seasonBased: true,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        })
      )
    )

    console.log(`Generated ${savedInsights.length} dashboard AI insights`)

    return NextResponse.json({
      success: true,
      message: `Δημιουργήθηκαν ${savedInsights.length} στρατηγικές συστάσεις`,
      insights: savedInsights,
      portfolioSummary: aiResponse.portfolioSummary
    })
  } catch (error) {
    console.error('=== Error generating dashboard insights ===')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    if (error instanceof Error) {
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    }

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
