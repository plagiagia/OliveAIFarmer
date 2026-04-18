import { getWeatherHistory, prisma } from '@/lib/db'
import { computePestRisk, type DailyWeather } from '@/lib/agronomy/pest-risk'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/farms/[farmId]/pest-risk
 *
 * Returns δάκος + κυκλοκόνιο risk scores derived from the farm's
 * stored weather history (last 30 days). Pure derived data — no
 * OpenAI call, safe to fetch frequently.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { farmId } = await params

    const farm = await prisma.farm.findFirst({
      where: { id: farmId, user: { clerkId: userId } },
      select: { id: true, name: true },
    })
    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    const records = await getWeatherHistory(farmId, {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      limit: 30,
    })

    const daily: DailyWeather[] = (records as DailyWeather[]).map((r) => ({
      date: r.date,
      tempHigh: r.tempHigh,
      tempLow: r.tempLow,
      tempAvg: r.tempAvg,
      humidity: r.humidity,
      rainfall: r.rainfall,
    }))

    const report = computePestRisk(daily)

    return NextResponse.json({
      success: true,
      farmId: farm.id,
      farmName: farm.name,
      report,
    })
  } catch (err) {
    console.error('[pest-risk] error', err)
    return NextResponse.json(
      { error: 'Αποτυχία υπολογισμού κινδύνου παρασίτων' },
      { status: 500 }
    )
  }
}
