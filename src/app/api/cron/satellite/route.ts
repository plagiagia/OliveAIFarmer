import { NextRequest, NextResponse } from 'next/server'
import { getAllFarmsForSatellite, saveSatelliteRecord } from '@/lib/db'
import { parseCoordinates } from '@/lib/mapbox-utils'

export const dynamic = 'force-dynamic'
import {
  fetchAllSatelliteData,
  calculateHealthMetrics,
  isSatelliteConfigured
} from '@/lib/satellite'

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

    // Check if satellite integration is configured
    if (!isSatelliteConfigured()) {
      return NextResponse.json(
        {
          error: 'Satellite integration not configured',
          message: 'Set COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET environment variables'
        },
        { status: 503 }
      )
    }

    // Get all farms with coordinates
    const farms = await getAllFarmsForSatellite()

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
      skippedCount: 0,
      errors: [] as string[]
    }

    // Process each farm
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

        // Fetch satellite data (Sentinel-2 vegetation indices + Sentinel-1 soil moisture)
        const satelliteData = await fetchAllSatelliteData(
          coords.lat,
          coords.lng,
          farm.totalArea || undefined
        )

        // Skip if no valid NDVI data (e.g., too cloudy)
        if (satelliteData.ndvi === null) {
          results.errors.push(
            `${farm.name}: No clear satellite imagery available (${satelliteData.cloudCoverage}% cloud coverage)`
          )
          results.skippedCount++
          continue
        }

        // Calculate health metrics
        const healthMetrics = calculateHealthMetrics(satelliteData)

        // Save satellite record
        await saveSatelliteRecord({
          farmId: farm.id,
          date: satelliteData.date,
          ndvi: satelliteData.ndvi,
          ndmi: satelliteData.ndmi,
          evi: satelliteData.evi,
          soilMoisture: satelliteData.soilMoisture,
          cloudCoverage: satelliteData.cloudCoverage,
          healthScore: healthMetrics.healthScore,
          stressLevel: healthMetrics.stressLevel,
          resolution: 10 // Sentinel-2 bands we use are 10m resolution
        })

        results.successCount++

        // Small delay to avoid overwhelming the Copernicus API
        // The satellite API has rate limits, so we space out requests
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        results.errors.push(
          `${farm.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
        results.failedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.successCount} farms, ${results.skippedCount} skipped (cloudy), ${results.failedCount} failed`,
      ...results,
      totalFarms: farms.length
    })
  } catch (error) {
    console.error('Cron satellite job error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
