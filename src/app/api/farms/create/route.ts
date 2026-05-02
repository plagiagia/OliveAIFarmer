import { prisma } from '@/lib/db'
import { formatCoordinates, parseCoordinates } from '@/lib/mapbox-utils'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      location,
      coordinates,
      latitude,
      longitude,
      totalArea,
      treeCount,
      treeAge,
      oliveVariety,
      description
    } = body

    const parsedLatitude = typeof latitude === 'number'
      ? latitude
      : typeof latitude === 'string' && latitude.trim() !== ''
        ? parseFloat(latitude)
        : null
    const parsedLongitude = typeof longitude === 'number'
      ? longitude
      : typeof longitude === 'string' && longitude.trim() !== ''
        ? parseFloat(longitude)
        : null
    const legacyCoordinates = typeof coordinates === 'string' && coordinates.trim() !== ''
      ? coordinates.trim()
      : null

    let latitudeValue: number | null = null
    let longitudeValue: number | null = null

    if (Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude)) {
      latitudeValue = parsedLatitude
      longitudeValue = parsedLongitude
    } else if (legacyCoordinates) {
      const parsed = parseCoordinates(legacyCoordinates)
      if (parsed) {
        latitudeValue = parsed.lat
        longitudeValue = parsed.lng
      }
    }

    const coordinatesValue = legacyCoordinates || (
      latitudeValue != null && longitudeValue != null
        ? formatCoordinates(longitudeValue, latitudeValue)
        : null
    )

    // Validate required fields
    if (!name || !location) {
      return NextResponse.json({
        error: 'Το όνομα και η τοποθεσία είναι υποχρεωτικά'
      }, { status: 400 })
    }

    // Validate treeCount is required and positive
    if (!treeCount || parseInt(treeCount) < 1) {
      return NextResponse.json({
        error: 'Ο αριθμός δέντρων είναι υποχρεωτικός και πρέπει να είναι τουλάχιστον 1'
      }, { status: 400 })
    }

    // Get user from database to ensure they exist
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    // Create the farm with treeCount and oliveVariety stored directly
    const farm = await prisma.farm.create({
      data: {
        name: name.trim(),
        location: location.trim(),
        coordinates: coordinatesValue,
        latitude: latitudeValue,
        longitude: longitudeValue,
        totalArea: totalArea ? parseFloat(totalArea) : null,
        treeCount: treeCount ? parseInt(treeCount) : null,
        oliveVariety: oliveVariety?.trim() || null,
        treeAge: treeAge ? parseInt(treeAge) : null,
        description: description?.trim() || null,
        userId: user.id,
      },
      include: {
        activities: true,
        harvests: true,
      }
    })

    console.log('✅ New farm created:', farm.name, 'for user:', user.email)

    return NextResponse.json({
      success: true,
      farm: {
        id: farm.id,
        name: farm.name,
        location: farm.location,
        totalArea: farm.totalArea,
        treeCount: farm.treeCount,
        oliveVariety: farm.oliveVariety,
        description: farm.description,
      }
    })
  } catch (error) {
    console.error('❌ Farm creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Αποτυχία δημιουργίας ελαιώνα'
    }, { status: 500 })
  }
}
