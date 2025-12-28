import { NextRequest, NextResponse } from 'next/server'
import { getWeatherHistory, getWeatherStats } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    // This endpoint requires authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const farmId = searchParams.get('farmId')
    const days = parseInt(searchParams.get('days') || '30')
    const includeStats = searchParams.get('stats') === 'true'

    if (!farmId) {
      return NextResponse.json(
        { error: 'farmId is required' },
        { status: 400 }
      )
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get weather history
    const history = await getWeatherHistory(farmId, {
      startDate,
      endDate,
      limit: days
    })

    // Optionally get stats
    let stats = null
    if (includeStats) {
      stats = await getWeatherStats(farmId, days)
    }

    return NextResponse.json({
      history,
      stats,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    })
  } catch (error) {
    console.error('Weather history API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather history' },
      { status: 500 }
    )
  }
}
