import { z } from 'zod'
import { INACTIVE_FARM_MESSAGE } from '@/lib/farm-activation'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// PATCH - Update insight status (read/actioned)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ insightId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { insightId } = await params
    const parsed = z.object({ isRead: z.boolean().optional(), isActioned: z.boolean().optional() }).strict().refine(value => value.isRead !== undefined || value.isActioned !== undefined).safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: 'Μη έγκυρη ενημέρωση πρότασης' }, { status: 400 })
    const { isRead, isActioned } = parsed.data

    // Get the insight and verify ownership through farm
    const insight = await prisma.smartRecommendation.findFirst({
      where: { id: insightId, farm: { user: { clerkId: userId } } },
      include: {
        farm: {
          include: {
            user: true
          }
        }
      }
    })

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      )
    }

    // Verify the user owns the farm
    if (insight.farm?.user?.clerkId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    if (!insight.farm?.isActive) return NextResponse.json({ error: INACTIVE_FARM_MESSAGE }, { status: 403 })

    // Build update data
    const updateData: {
      isRead?: boolean
      readAt?: Date | null
      isActioned?: boolean
      actionedAt?: Date | null
    } = {}

    if (isRead !== undefined) {
      updateData.isRead = isRead
      updateData.readAt = isRead ? new Date() : null
    }

    if (isActioned !== undefined) {
      updateData.isActioned = isActioned
      updateData.actionedAt = isActioned ? new Date() : null
      // If actioned, also mark as read
      if (isActioned && !insight.isRead) {
        updateData.isRead = true
        updateData.readAt = new Date()
      }
    }

    // Update the insight
    const updatedInsight = await prisma.smartRecommendation.update({
      where: { id: insightId, farm: { user: { clerkId: userId } } },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      insight: updatedInsight
    })
  } catch (error) {
    console.error('Error updating insight:', error)
    return NextResponse.json(
      { error: 'Αποτυχία ενημέρωσης πρότασης' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a single insight
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ insightId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { insightId } = await params

    // Get the insight and verify ownership through farm
    const insight = await prisma.smartRecommendation.findFirst({
      where: { id: insightId, farm: { user: { clerkId: userId } } },
      include: {
        farm: {
          include: {
            user: true
          }
        }
      }
    })

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      )
    }

    // Verify the user owns the farm
    if (insight.farm?.user?.clerkId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    if (!insight.farm?.isActive) return NextResponse.json({ error: INACTIVE_FARM_MESSAGE }, { status: 403 })

    // Delete the insight
    await prisma.smartRecommendation.delete({
      where: { id: insightId }
    })

    return NextResponse.json({
      success: true,
      message: 'Η πρόταση διαγράφηκε'
    })
  } catch (error) {
    console.error('Error deleting insight:', error)
    return NextResponse.json(
      { error: 'Αποτυχία διαγραφής πρότασης' },
      { status: 500 }
    )
  }
}
