import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedCronRequest } from '@/lib/cron-auth'
import { maybeSendDakosAlert } from '@/lib/agronomy/dakos-alerts'
import {
  getAllFarmsWithCoordinates,
  refreshDailyWeatherRecord,
  saveWeatherObservation
} from '@/lib/db'
import { parseCoordinates } from '@/lib/mapbox-utils'
import { getEntitledPlan, hasFeature } from '@/lib/plans'

export const dynamic = 'force-dynamic'

// OpenWeatherMap API
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5'

// Vercel cron job security
// This endpoint should only be called by Vercel's cron system
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron.
    // Require CRON_SECRET in all environments. To run a cron locally without a secret,
    // explicitly set ALLOW_INSECURE_CRON=1 (never set this in production).
    const cronSecret = process.env.CRON_SECRET
    const allowInsecure =
      process.env.NODE_ENV !== 'production' && process.env.ALLOW_INSECURE_CRON === '1'

    if (!allowInsecure) {
      if (!cronSecret) {
        console.error('CRON_SECRET is not configured')
        return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
      }
      if (!isAuthorizedCronRequest(request, cronSecret)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    if (!OPENWEATHER_API_KEY) {
      return NextResponse.json(
        { error: 'Weather API not configured' },
        { status: 503 }
      )
    }

    // Get all farms with coordinates
    const farms = await getAllFarmsWithCoordinates()

    if (farms.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No farms with coordinates found',
        processed: 0
      })
    }

    const results = {
      successCount: 0,
      failedCount: 0,
      dakosAlerts: 0,
      errors: [] as string[]
    }
    const invocationTime = new Date()
    const sampleSlot = new Date(invocationTime)
    sampleSlot.setUTCMinutes(0, 0, 0)

    // Process each farm (with rate limiting consideration)
    for (const farm of farms) {
      try {
        const coords = (farm.latitude != null && farm.longitude != null)
          ? { lat: farm.latitude, lng: farm.longitude }
          : (farm.coordinates ? parseCoordinates(farm.coordinates) : null)
        if (!coords) {
          results.errors.push(`${farm.name}: Invalid coordinates`)
          results.failedCount++
          continue
        }

        // Fetch the measured current weather for this scheduled sample.
        const weatherRes = await fetch(
          `${OPENWEATHER_BASE_URL}/weather?lat=${coords.lat}&lon=${coords.lng}&units=metric&lang=el&appid=${OPENWEATHER_API_KEY}`
        )

        if (!weatherRes.ok) {
          results.errors.push(`${farm.name}: Weather API error ${weatherRes.status}`)
          results.failedCount++
          continue
        }

        const weatherData = await weatherRes.json()
        const observedAt = weatherData.dt
          ? new Date(weatherData.dt * 1000)
          : invocationTime

        // The current endpoint reports precipitation for a recent period.
        // It is stored per sample and summed only in the daily aggregate.
        await saveWeatherObservation({
          farmId: farm.id,
          observedAt,
          sampleSlot: sampleSlot.toISOString(),
          temperature: weatherData.main.temp,
          humidity: weatherData.main.humidity,
          rainfall: weatherData.rain?.['3h'] ?? weatherData.rain?.['1h'] ?? 0,
          windSpeed: weatherData.wind?.speed || 0,
          windGust: weatherData.wind?.gust,
          windDirection: weatherData.wind?.deg,
          pressure: weatherData.main?.pressure,
          clouds: weatherData.clouds?.all,
          condition: weatherData.weather?.[0]?.description || 'Unknown',
          icon: weatherData.weather?.[0]?.icon,
          source: 'CRON_INTRADAY'
        })
        await refreshDailyWeatherRecord(farm.id, observedAt)

        results.successCount++

        // Δάκος risk alert (paid plans only) based on the stored history.
        const plan = getEntitledPlan(
          farm.user?.subscription?.plan,
          farm.user?.subscription?.status
        )
        if (hasFeature(plan, 'oliveFlyAlerts')) {
          try {
            const alert = await maybeSendDakosAlert(farm)
            if (alert.alerted) results.dakosAlerts++
          } catch (alertErr) {
            console.error(`[cron/weather] dakos alert failed for ${farm.name}:`, alertErr)
          }
        }

        // Small delay to avoid rate limiting (OpenWeatherMap free tier: 60 calls/min)
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        results.errors.push(`${farm.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        results.failedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.successCount} farms, ${results.failedCount} failed`,
      ...results,
      totalFarms: farms.length
    })
  } catch (error) {
    console.error('Cron weather job error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
