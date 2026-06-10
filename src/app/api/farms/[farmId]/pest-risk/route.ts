import { getTrapReadings, getWeatherHistory, prisma } from '@/lib/db'
import { computePestRisk, type DailyWeather } from '@/lib/agronomy/pest-risk'
import { computeTrapPressure, maxLevel } from '@/lib/agronomy/trap-pressure'
import { computeSprayWindow, type SprayWindowPlan } from '@/lib/agronomy/spray-window'
import { fetchWeatherData } from '@/lib/weather'
import { parseCoordinates } from '@/lib/mapbox-utils'
import { hasFeature, requiresPlanMessage } from '@/lib/plans'
import { getUserPlanByClerkId } from '@/lib/subscription'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/farms/[farmId]/pest-risk
 *
 * Returns a blended δάκος decision report from three inputs:
 *   - weather history (last 30 days) — the prior,
 *   - trap readings (last 30 days) — field evidence (flies/trap/day),
 *   - the 5-day forecast — to recommend a spray window.
 *
 * No AI call, so it stays cheap. The forecast fetch is best-effort: if it
 * fails the rest of the report is still returned.
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

    const userPlan = await getUserPlanByClerkId(userId)
    if (!hasFeature(userPlan.plan, 'oliveFlyAlerts')) {
      return NextResponse.json(
        { error: requiresPlanMessage('GROWER', { subject: 'Οι ειδοποιήσεις δάκου', verb: 'απαιτούν' }) },
        { status: 403 }
      )
    }

    const { farmId } = await params

    const farm = await prisma.farm.findFirst({
      where: { id: farmId, user: { clerkId: userId } },
      select: { id: true, name: true, latitude: true, longitude: true, coordinates: true },
    })
    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [records, trapReadings] = await Promise.all([
      getWeatherHistory(farmId, { startDate: since, limit: 30 }),
      getTrapReadings(farmId, { startDate: since, limit: 30 }),
    ])

    const daily: DailyWeather[] = (records as DailyWeather[]).map((r) => ({
      date: r.date,
      tempHigh: r.tempHigh,
      tempLow: r.tempLow,
      tempAvg: r.tempAvg,
      humidity: r.humidity,
      rainfall: r.rainfall,
    }))

    const report = computePestRisk(daily)
    const trapPressure = computeTrapPressure(
      trapReadings.map((t) => ({
        date: t.date,
        trapCount: t.trapCount,
        totalCatch: t.totalCatch,
        femaleCatch: t.femaleCatch,
        daysSincePrev: t.daysSincePrev,
      }))
    )

    // Blend: the action level is the more severe of weather and trap evidence.
    const combinedLevel = maxLevel(report.dakos.level, trapPressure.level)

    // Best-effort forecast-driven spray window.
    let sprayWindow: SprayWindowPlan | null = null
    const coords =
      farm.latitude != null && farm.longitude != null
        ? { lat: farm.latitude, lng: farm.longitude }
        : farm.coordinates
          ? parseCoordinates(farm.coordinates)
          : null
    if (coords) {
      try {
        const weather = await fetchWeatherData(coords.lat, coords.lng)
        sprayWindow = computeSprayWindow(
          weather.forecast.map((d) => ({
            date: d.date,
            tempMax: d.tempMax,
            precipitation: d.precipitation,
            precipitationProbability: d.precipitationProbability,
            windSpeed: d.windSpeed,
          }))
        )
      } catch (fcErr) {
        console.error('[pest-risk] forecast fetch failed', fcErr)
      }
    }

    return NextResponse.json({
      success: true,
      farmId: farm.id,
      farmName: farm.name,
      report,
      trapPressure,
      combinedLevel,
      sprayWindow,
    })
  } catch (err) {
    console.error('[pest-risk] error', err)
    return NextResponse.json(
      { error: 'Αποτυχία υπολογισμού κινδύνου παρασίτων' },
      { status: 500 }
    )
  }
}
