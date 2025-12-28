import { NextRequest, NextResponse } from 'next/server'
import { getWeatherHistory, getWeatherStats, getWeatherForDate } from '@/lib/db'
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
    const specificDate = searchParams.get('date') // YYYY-MM-DD format

    if (!farmId) {
      return NextResponse.json(
        { error: 'farmId is required' },
        { status: 400 }
      )
    }

    // If specific date is requested, return single record
    if (specificDate) {
      const date = new Date(specificDate)
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        )
      }

      const record = await getWeatherForDate(farmId, date)
      return NextResponse.json({
        record,
        date: specificDate
      })
    }

    // Calculate date range for history
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
