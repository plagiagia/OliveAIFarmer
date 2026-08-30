import { NextRequest, NextResponse } from 'next/server'
import { getWeatherIntelligence } from '@/lib/weather'
import { prisma, refreshDailyWeatherRecord, saveWeatherObservation } from '@/lib/db'
import { hasFeature } from '@/lib/plans'
import { checkRateLimitAsync } from '@/lib/rate-limit'
import { getUserPlanByClerkId } from '@/lib/subscription'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

// Weather endpoint requires authentication and is rate-limited to prevent
// abuse of the upstream paid OpenWeatherMap quota.
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 60 requests per minute per user.
    const rateLimit = await checkRateLimitAsync(`weather:${userId}`, 60, 60_000)
    if (rateLimit.backend === 'unavailable') {
      return NextResponse.json(
        { error: 'Η υπηρεσία περιορισμού αιτημάτων δεν είναι προσωρινά διαθέσιμη.' },
        {
          status: 503,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) }
        }
      )
    }
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Πάρα πολλά αιτήματα. Δοκιμάστε ξανά σύντομα.',
          retryAfterSeconds: rateLimit.retryAfterSeconds
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) }
        }
      )
    }

    // Get coordinates and optional farmId from query params
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const farmId = searchParams.get('farmId')

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Missing latitude or longitude parameters' },
        { status: 400 }
      )
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lon)

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude' },
        { status: 400 }
      )
    }

    // Validate coordinates are in valid range
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Coordinates out of valid range' },
        { status: 400 }
      )
    }

    // Get weather intelligence
    const weatherIntelligence = await getWeatherIntelligence(
      latitude,
      longitude
    )

    const userPlan = await getUserPlanByClerkId(userId)
    if (!hasFeature(userPlan.plan, 'oliveFlyAlerts')) {
      weatherIntelligence.diseaseRisks = weatherIntelligence.diseaseRisks.filter(
        (risk) => risk.disease !== 'Olive Fruit Fly'
      )
    }

    // Opportunistically save weather data if farmId is provided
    if (farmId && weatherIntelligence.weather.current) {
      try {
        // Verify the user owns the farm before saving.
        const farm = await prisma.farm.findFirst({
          where: {
            id: farmId,
            user: { clerkId: userId }
          },
          select: { id: true, isActive: true }
        })

        if (!farm || !farm.isActive) {
          // Don't leak farm existence; just skip saving.
          return NextResponse.json(weatherIntelligence)
        }

        const current = weatherIntelligence.weather.current
        await saveWeatherObservation({
          farmId: farm.id,
          observedAt: current.updatedAt,
          temperature: current.temperature,
          humidity: current.humidity,
          windSpeed: current.windSpeed,
          windDirection: current.windDirection,
          pressure: current.pressure,
          clouds: current.clouds,
          condition: current.description,
          icon: current.icon,
          source: 'API_CURRENT'
        })
        await refreshDailyWeatherRecord(farm.id, current.updatedAt)
      } catch (saveError) {
        // Don't fail the request if saving fails, just log it
        console.error('Failed to save weather record:', saveError)
      }
    }

    return NextResponse.json(weatherIntelligence)
  } catch (error) {
    console.error('Weather API error:', error)

    // Check if it's an API key error
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'Weather service not configured' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}
