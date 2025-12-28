import { NextRequest, NextResponse } from 'next/server'
import { getWeatherIntelligence } from '@/lib/weather'

// Weather data is public - no auth required
// The widget only shows on authenticated farm pages anyway
export async function GET(request: NextRequest) {
  try {
    // Get coordinates from query params
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

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
