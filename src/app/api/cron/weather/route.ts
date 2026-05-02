import { NextRequest, NextResponse } from 'next/server'
import { getAllFarmsWithCoordinates, saveWeatherRecord } from '@/lib/db'
import { parseCoordinates } from '@/lib/mapbox-utils'

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
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${cronSecret}`) {
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
      errors: [] as string[]
    }

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

        // Fetch current weather
        const weatherRes = await fetch(
          `${OPENWEATHER_BASE_URL}/weather?lat=${coords.lat}&lon=${coords.lng}&units=metric&lang=el&appid=${OPENWEATHER_API_KEY}`
        )

        if (!weatherRes.ok) {
          results.errors.push(`${farm.name}: Weather API error ${weatherRes.status}`)
          results.failedCount++
          continue
        }

        const weatherData = await weatherRes.json()

        // Also fetch forecast to get daily min/max
        const forecastRes = await fetch(
          `${OPENWEATHER_BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lng}&units=metric&lang=el&appid=${OPENWEATHER_API_KEY}`
        )

        let tempHigh = weatherData.main.temp
        let tempLow = weatherData.main.temp
        let totalRain = 0

        if (forecastRes.ok) {
          const forecastData = await forecastRes.json()
          // Get today's forecast entries to calculate min/max
          const today = new Date().toISOString().split('T')[0]
          const todayEntries = forecastData.list.filter((entry: any) =>
            entry.dt_txt.startsWith(today)
          )

          if (todayEntries.length > 0) {
            const temps = todayEntries.map((e: any) => e.main.temp)
            tempHigh = Math.max(...temps)
            tempLow = Math.min(...temps)
            totalRain = todayEntries.reduce((sum: number, e: any) =>
              sum + (e.rain?.['3h'] || 0), 0)
          }
        }

        // Save weather record
        await saveWeatherRecord({
          farmId: farm.id,
          date: new Date(),
          tempHigh,
          tempLow,
          tempAvg: weatherData.main.temp,
          humidity: weatherData.main.humidity,
          rainfall: totalRain,
          windSpeed: weatherData.wind?.speed || 0,
          windGust: weatherData.wind?.gust,
          windDirection: weatherData.wind?.deg,
          pressure: weatherData.main?.pressure,
          clouds: weatherData.clouds?.all,
          // UV index requires One Call API (paid) - will be null from free API
          uvIndex: undefined,
          condition: weatherData.weather?.[0]?.description || 'Unknown',
          icon: weatherData.weather?.[0]?.icon,
          source: 'CRON_DAILY'
        })

        results.successCount++

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
