import { prisma } from '@/lib/db'
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
    const { name, location, coordinates, totalArea, treeCount, treeAge, oliveVariety, description } = body

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
        coordinates: coordinates?.trim() || null,
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
