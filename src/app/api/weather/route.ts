import { NextRequest, NextResponse } from 'next/server'
import { getWeatherIntelligence } from '@/lib/weather'
import { prisma, saveWeatherRecord } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

// Weather data is public - no auth required
// If `farmId` is provided, we only save to the DB when the caller is authenticated
// and owns the farm. This prevents unauthenticated/cross-tenant writes.
export async function GET(request: NextRequest) {
  try {
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

    // Opportunistically save weather data if farmId is provided
    if (farmId && weatherIntelligence.weather.current) {
      try {
        const { userId } = await auth()
        if (!userId) {
          // Unauthenticated callers can still fetch weather, but may not write farm data.
          return NextResponse.json(weatherIntelligence)
        }

        // Verify the user owns the farm before saving.
        const farm = await prisma.farm.findFirst({
          where: {
            id: farmId,
            user: { clerkId: userId }
          },
          select: { id: true }
        })

        if (!farm) {
          // Don't leak farm existence; just skip saving.
          return NextResponse.json(weatherIntelligence)
        }

        const current = weatherIntelligence.weather.current
        await saveWeatherRecord({
          farmId: farm.id,
          date: new Date(),
          tempHigh: current.temperature, // Current temp as high for now
          tempLow: current.temperature,  // Will be updated by cron with proper min/max
          tempAvg: current.temperature,
          humidity: current.humidity,
          rainfall: 0, // Current API doesn't give rainfall, cron will update
          windSpeed: current.windSpeed,
          windDirection: current.windDirection,
          pressure: current.pressure,
          clouds: current.clouds,
          // UV index requires One Call API (paid) - not available in free tier
          uvIndex: undefined,
          condition: current.description,
          icon: current.icon,
          source: 'API_CURRENT'
        })
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
