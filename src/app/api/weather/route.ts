import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getWeatherIntelligence } from '@/lib/weather'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get coordinates from query params
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

    // Optionally get last watering date from farm activities
    let lastWateringDate: Date | undefined

    if (farmId) {
      // Verify user owns this farm
      const farm = await prisma.farm.findFirst({
        where: {
          id: farmId,
          user: { clerkId: userId }
        },
        include: {
          activities: {
            where: { type: 'WATERING' },
            orderBy: { date: 'desc' },
            take: 1
          }
        }
      })

      if (farm?.activities[0]) {
        lastWateringDate = farm.activities[0].date
      }
    }

    // Get weather intelligence
    const weatherIntelligence = await getWeatherIntelligence(
      latitude,
      longitude,
      lastWateringDate
    )

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
