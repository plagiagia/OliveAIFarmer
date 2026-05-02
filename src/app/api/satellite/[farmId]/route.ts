import { prisma } from '@/lib/db'
import {
  calculateHealthMetrics,
  fetchAllSatelliteData,
  isSatelliteConfigured,
  parseCoordinates,
  SatelliteIndices
} from '@/lib/satellite'
import { auth } from '@clerk/nextjs/server'
import { SatelliteSource } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ farmId: string }>
}

function getFarmCoordinates(farm: { latitude: number | null; longitude: number | null; coordinates: string | null }) {
  if (farm.latitude != null && farm.longitude != null) {
    return { lat: farm.latitude, lon: farm.longitude }
  }

  return parseCoordinates(farm.coordinates || '')
}

/**
 * GET /api/satellite/[farmId]
 *
 * Fetch satellite data for a farm. Returns cached data if available,
 * or fetches fresh data from Copernicus if not.
 *
 * Query params:
 * - refresh=true: Force refresh from Copernicus API
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { farmId } = await context.params
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    // Verify farm ownership
    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        user: { clerkId: userId }
      },
      include: {
        satelliteData: {
          orderBy: { date: 'desc' },
          take: 2 // Only need current and previous for trend calculation
        }
      }
    })

    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    // Check if farm has coordinates
    const coords = getFarmCoordinates(farm)
    if (!coords) {
      return NextResponse.json({
        error: 'Farm coordinates not set',
        message: 'Παρακαλώ ορίστε τις συντεταγμένες του αγροκτήματος για να λάβετε δορυφορικά δεδομένα.'
      }, { status: 400 })
    }

    // Check if satellite integration is configured
    if (!isSatelliteConfigured()) {
      return NextResponse.json({
        configured: false,
        message: 'Η ενσωμάτωση δορυφορικών δεδομένων δεν έχει ρυθμιστεί.',
        current: null,
        health: null
      })
    }

    // Check if we have recent cached data (less than 3 days old)
    const latestCached = farm.satelliteData[0]
    const cacheAge = latestCached
      ? (Date.now() - new Date(latestCached.recordedAt).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity

    let currentIndices: SatelliteIndices | null = null

    // Fetch fresh data if needed
    if (forceRefresh || cacheAge > 3) {
      try {
        // Fetch current indices (Sentinel-2 + Sentinel-1 soil moisture)
        currentIndices = await fetchAllSatelliteData(
          coords.lat,
          coords.lon,
          farm.totalArea || undefined
        )

        // Store the new data
        if (currentIndices.ndvi !== null) {
          const healthMetrics = calculateHealthMetrics(currentIndices)

          await prisma.satelliteData.upsert({
            where: {
              farmId_date_source: {
                farmId: farm.id,
                date: currentIndices.date,
                source: SatelliteSource.SENTINEL_2
              }
            },
            create: {
              farmId: farm.id,
              date: currentIndices.date,
              ndvi: currentIndices.ndvi,
              ndmi: currentIndices.ndmi,
              evi: currentIndices.evi,
              soilMoisture: currentIndices.soilMoisture,
              cloudCoverage: currentIndices.cloudCoverage,
              healthScore: healthMetrics.healthScore,
              stressLevel: healthMetrics.stressLevel,
              source: SatelliteSource.SENTINEL_2,
              resolution: 10
            },
            update: {
              ndvi: currentIndices.ndvi,
              ndmi: currentIndices.ndmi,
              evi: currentIndices.evi,
              soilMoisture: currentIndices.soilMoisture,
              cloudCoverage: currentIndices.cloudCoverage,
              healthScore: healthMetrics.healthScore,
              stressLevel: healthMetrics.stressLevel,
              recordedAt: new Date()
            }
          })
        }
      } catch (error) {
        console.error('Failed to fetch satellite data:', error)
        // Continue with cached data if available
      }
    }

    // Use cached data if no fresh data was fetched
    if (!currentIndices && latestCached) {
      currentIndices = {
        ndvi: latestCached.ndvi,
        ndmi: latestCached.ndmi,
        evi: latestCached.evi,
        soilMoisture: latestCached.soilMoisture,
        cloudCoverage: latestCached.cloudCoverage || 0,
        date: latestCached.date,
        // For cached data, use same date (Sentinel-1 date not stored separately)
        soilMoistureDate: latestCached.soilMoisture != null ? latestCached.date : undefined
      }
    }

    // Calculate health metrics
    const previousData = farm.satelliteData[1]
    const previousIndices = previousData ? {
      ndvi: previousData.ndvi,
      ndmi: previousData.ndmi,
      evi: previousData.evi,
      soilMoisture: previousData.soilMoisture,
      cloudCoverage: previousData.cloudCoverage || 0,
      date: previousData.date
    } : undefined

    const healthMetrics = currentIndices
      ? calculateHealthMetrics(currentIndices, previousIndices)
      : null

    return NextResponse.json({
      configured: true,
      current: currentIndices,
      health: healthMetrics,
      lastUpdated: latestCached?.recordedAt || null,
      coordinates: coords
    })

  } catch (error) {
    console.error('Satellite API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch satellite data' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/satellite/[farmId]
 *
 * Manually trigger a refresh of satellite data for a farm
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { farmId } = await context.params

    // Verify farm ownership
    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        user: { clerkId: userId }
      }
    })

    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    const coords = getFarmCoordinates(farm)
    if (!coords) {
      return NextResponse.json({
        error: 'Farm coordinates not set'
      }, { status: 400 })
    }

    if (!isSatelliteConfigured()) {
      return NextResponse.json({
        error: 'Satellite integration not configured'
      }, { status: 503 })
    }

    // Fetch fresh data (Sentinel-2 + Sentinel-1 soil moisture)
    const indices = await fetchAllSatelliteData(
      coords.lat,
      coords.lon,
      farm.totalArea || undefined
    )

    if (indices.ndvi === null) {
      return NextResponse.json({
        message: 'No clear satellite imagery available for this period',
        cloudCoverage: indices.cloudCoverage
      }, { status: 200 })
    }

    const healthMetrics = calculateHealthMetrics(indices)

    // Store the data — upsert to avoid unique constraint errors on retry
    const satelliteRecord = {
      farmId: farm.id,
      date: indices.date,
      ndvi: indices.ndvi,
      ndmi: indices.ndmi,
      evi: indices.evi,
      soilMoisture: indices.soilMoisture,
      cloudCoverage: indices.cloudCoverage,
      healthScore: healthMetrics.healthScore,
      stressLevel: healthMetrics.stressLevel,
      source: SatelliteSource.SENTINEL_2,
      resolution: 10
    }
    const savedData = await prisma.satelliteData.upsert({
      where: {
        farmId_date_source: {
          farmId: farm.id,
          date: indices.date,
          source: SatelliteSource.SENTINEL_2
        }
      },
      update: satelliteRecord,
      create: satelliteRecord
    })

    return NextResponse.json({
      success: true,
      data: savedData,
      health: healthMetrics
    })

  } catch (error) {
    console.error('Satellite refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh satellite data' },
      { status: 500 }
    )
  }
}
