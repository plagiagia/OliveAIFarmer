import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get specific farm details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { farmId } = await params

    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        user: {
          clerkId: userId
        }
      },
      include: {
        activities: {
          orderBy: { date: 'desc' },
          take: 5
        },
        harvests: {
          orderBy: { year: 'desc' },
          take: 5
        }
      }
    })

    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, farm })
  } catch (error) {
    console.error('Error fetching farm:', error)
    return NextResponse.json(
      { error: 'Failed to fetch farm' },
      { status: 500 }
    )
  }
}

// PUT - Update farm
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { farmId } = await params
    const body = await request.json()
    const { name, location, coordinates, totalArea, treeCount, treeAge, oliveVariety, description } = body

    // Validate required fields
    if (!name?.trim() || !location?.trim()) {
      return NextResponse.json(
        { error: 'Το όνομα και η τοποθεσία είναι υποχρεωτικά' },
        { status: 400 }
      )
    }

    // Validate treeCount is required and positive
    if (!treeCount || parseInt(treeCount) < 1) {
      return NextResponse.json(
        { error: 'Ο αριθμός δέντρων είναι υποχρεωτικός και πρέπει να είναι τουλάχιστον 1' },
        { status: 400 }
      )
    }

    // Check if farm exists and belongs to user
    const existingFarm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        user: {
          clerkId: userId
        }
      }
    })

    if (!existingFarm) {
      return NextResponse.json(
        { error: 'Farm not found or access denied' },
        { status: 404 }
      )
    }

    // Update farm with treeCount and oliveVariety stored directly
    const updatedFarm = await prisma.farm.update({
      where: { id: farmId },
      data: {
        name: name.trim(),
        location: location.trim(),
        coordinates: coordinates || null,
        totalArea: totalArea ? parseFloat(totalArea) : null,
        treeCount: treeCount !== null && treeCount !== undefined ? parseInt(treeCount) : null,
        oliveVariety: oliveVariety?.trim() || null,
        treeAge: treeAge !== null && treeAge !== undefined ? parseInt(treeAge) : null,
        description: description?.trim() || null,
        updatedAt: new Date()
      }
    })

    console.log(`✅ Farm updated: ${updatedFarm.name} for user: ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Ο ελαιώνας ενημερώθηκε επιτυχώς',
      farm: updatedFarm
    })

  } catch (error) {
    console.error('Error updating farm:', error)
    return NextResponse.json(
      { error: 'Αποτυχία ενημέρωσης ελαιώνα' },
      { status: 500 }
    )
  }
}

// DELETE - Delete farm
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { farmId } = await params

    // Check if farm exists and belongs to user
    const existingFarm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        user: {
          clerkId: userId
        }
      },
      include: {
        activities: true,
        harvests: true
      }
    })

    if (!existingFarm) {
      return NextResponse.json(
        { error: 'Farm not found or access denied' },
        { status: 404 }
      )
    }

    // Delete farm (cascade will handle related data)
    await prisma.farm.delete({
      where: { id: farmId }
    })

    console.log(`🗑️ Farm deleted: ${existingFarm.name} for user: ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Ο ελαιώνας διαγράφηκε επιτυχώς'
    })

  } catch (error) {
    console.error('Error deleting farm:', error)
    return NextResponse.json(
      { error: 'Αποτυχία διαγραφής ελαιώνα' },
      { status: 500 }
    )
  }
}
