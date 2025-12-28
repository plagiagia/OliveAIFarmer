import { prisma } from '@/lib/db'
import { getWeatherHistory } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  generateInsights,
  getCurrentSeason,
  FarmContext,
  AIInsight
} from '@/lib/openai'

// Activity type translation for context
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

// Type for weather record
interface WeatherRecord {
  tempHigh: number
  tempLow: number
  rainfall: number
  humidity: number
}

// POST - Generate new AI insights for a farm
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { farmId } = body

    if (!farmId) {
      return NextResponse.json(
        { error: 'Farm ID is required' },
        { status: 400 }
      )
    }

    // Get farm with all related data
    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        user: { clerkId: userId }
      },
      include: {
        trees: {
          select: {
            id: true,
            variety: true,
            age: true,
            health: true
          }
        },
        activities: {
          where: {
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          orderBy: { date: 'desc' },
          select: {
            type: true,
            title: true,
            date: true,
            notes: true,
            completed: true
          }
        },
        harvests: {
          orderBy: { year: 'desc' },
          take: 3, // Last 3 years
          select: {
            year: true,
            totalYield: true,
            yieldPerTree: true,
            pricePerKg: true
          }
        }
      }
    })

    if (!farm) {
      return NextResponse.json(
        { error: 'Farm not found or access denied' },
        { status: 404 }
      )
    }

    // Get weather history for the last 30 days
    const weatherRecords = await getWeatherHistory(farmId, {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      limit: 30
    })

    // Calculate weather summary
    const records = weatherRecords as WeatherRecord[]
    const weatherSummary = records.length > 0
      ? {
          avgTempHigh: records.reduce((sum: number, r: WeatherRecord) => sum + r.tempHigh, 0) / records.length,
          avgTempLow: records.reduce((sum: number, r: WeatherRecord) => sum + r.tempLow, 0) / records.length,
          totalRainfall: records.reduce((sum: number, r: WeatherRecord) => sum + r.rainfall, 0),
          avgHumidity: records.reduce((sum: number, r: WeatherRecord) => sum + r.humidity, 0) / records.length,
          rainyDays: records.filter((r: WeatherRecord) => r.rainfall > 0).length
        }
      : {
          avgTempHigh: 0,
          avgTempLow: 0,
          totalRainfall: 0,
          avgHumidity: 0,
          rainyDays: 0
        }

    // Get the most common variety
    const varieties = farm.trees.map((t: { variety: string }) => t.variety)
    const varietyCounts = varieties.reduce((acc: Record<string, number>, v: string) => {
      acc[v] = (acc[v] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const sortedVarieties = Object.entries(varietyCounts).sort(
      (a, b) => (b[1] as number) - (a[1] as number)
    )
    const mainVariety = sortedVarieties[0]?.[0] || 'Άγνωστη'

    // Build farm context for AI
    const farmContext: FarmContext = {
      farmId: farm.id,
      name: farm.name,
      location: farm.location,
      coordinates: farm.coordinates || undefined,
      totalArea: farm.totalArea || undefined,
      treeAge: farm.treeAge || undefined,
      variety: mainVariety,
      treeCount: farm.trees.length,
      recentActivities: farm.activities.map((a: {
        type: string
        title: string
        date: Date
        notes: string | null
        completed: boolean
      }) => ({
        type: ACTIVITY_TYPE_GREEK[a.type] || a.type,
        date: a.date.toLocaleDateString('el-GR'),
        title: a.title,
        notes: a.notes || undefined,
        completed: a.completed
      })),
      harvests: farm.harvests.map((h: {
        year: number
        totalYield: number | null
        yieldPerTree: number | null
        pricePerKg: number | null
      }) => ({
        year: h.year,
        totalYield: h.totalYield || undefined,
        yieldPerTree: h.yieldPerTree || undefined,
        pricePerKg: h.pricePerKg || undefined
      })),
      weatherSummary,
      currentMonth: new Date().getMonth() + 1,
      currentSeason: getCurrentSeason()
    }

    // Generate insights using OpenAI
    const aiResponse = await generateInsights(farmContext)

    // Delete old AI insights for this farm (keep only manual/rule-based ones)
    await prisma.smartRecommendation.deleteMany({
      where: {
        farmId: farm.id,
        source: 'AI_GENERATED'
      }
    })

    // Save new insights to database
    const savedInsights = await Promise.all(
      aiResponse.insights.map((insight: AIInsight) =>
        prisma.smartRecommendation.create({
          data: {
            type: insight.type as 'TASK_REMINDER' | 'WEATHER_ALERT' | 'CARE_SUGGESTION' | 'OPTIMIZATION' | 'RISK_WARNING' | 'SEASONAL_TIP',
            title: insight.title,
            message: insight.message,
            urgency: insight.urgency as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
            actionRequired: insight.actionRequired,
            reasoning: insight.reasoning,
            source: 'AI_GENERATED',
            farmId: farm.id,
            weatherBased: insight.type === 'WEATHER_ALERT',
            seasonBased: insight.type === 'SEASONAL_TIP',
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Valid for 7 days
          }
        })
      )
    )

    console.log(`✅ Generated ${savedInsights.length} AI insights for farm: ${farm.name}`)

    return NextResponse.json({
      success: true,
      message: `Δημιουργήθηκαν ${savedInsights.length} προτάσεις`,
      insights: savedInsights
    })
  } catch (error) {
    console.error('Error generating insights:', error)

    // Check if it's an OpenAI API error
    if (error instanceof Error && error.message.includes('OpenAI')) {
      return NextResponse.json(
        { error: 'Η υπηρεσία AI δεν είναι διαθέσιμη αυτή τη στιγμή' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Αποτυχία δημιουργίας προτάσεων' },
      { status: 500 }
    )
  }
}
