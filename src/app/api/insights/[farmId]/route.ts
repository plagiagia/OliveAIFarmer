import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get all insights for a farm
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

    // Verify farm ownership
    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        user: { clerkId: userId }
      }
    })

    if (!farm) {
      return NextResponse.json(
        { error: 'Farm not found or access denied' },
        { status: 404 }
      )
    }

    // Get all insights for this farm
    const insights = await prisma.smartRecommendation.findMany({
      where: {
        farmId,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ]
      },
      orderBy: [
        { isRead: 'asc' },           // Unread first
        { urgency: 'desc' },         // Critical > High > Medium > Low
        { createdAt: 'desc' }        // Newest first
      ]
    })

    // Count unread insights
    const unreadCount = insights.filter((i: { isRead: boolean }) => !i.isRead).length

    // Get the most recent generation time
    const aiInsights = insights.filter((i: { source: string }) => i.source === 'AI_GENERATED')
    const lastGeneratedAt = aiInsights.length > 0
      ? aiInsights.sort((a: { createdAt: Date }, b: { createdAt: Date }) =>
          b.createdAt.getTime() - a.createdAt.getTime()
        )[0]?.createdAt
      : null

    return NextResponse.json({
      success: true,
      insights,
      unreadCount,
      lastGeneratedAt: lastGeneratedAt || null
    })
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { error: 'Αποτυχία ανάκτησης προτάσεων' },
      { status: 500 }
    )
  }
}

// DELETE - Clear all AI insights for a farm
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

    // Verify farm ownership
    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        user: { clerkId: userId }
      }
    })

    if (!farm) {
      return NextResponse.json(
        { error: 'Farm not found or access denied' },
        { status: 404 }
      )
    }

    // Delete all AI-generated insights for this farm
    const result = await prisma.smartRecommendation.deleteMany({
      where: {
        farmId,
        source: 'AI_GENERATED'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Διαγράφηκαν ${result.count} προτάσεις`,
      deletedCount: result.count
    })
  } catch (error) {
    console.error('Error deleting insights:', error)
    return NextResponse.json(
      { error: 'Αποτυχία διαγραφής προτάσεων' },
      { status: 500 }
    )
  }
}
