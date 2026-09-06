import { INACTIVE_FARM_MESSAGE } from '@/lib/farm-activation'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

    // Get all active (non-archived) insights for this farm
    const insights = await prisma.smartRecommendation.findMany({
      where: {
        farmId,
        isArchived: false,
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

    // A dakos alert is periodically refreshed, but older active rows may
    // exist from before alert creation became idempotent. Show only the newest
    // one while preserving all other insight types.
    const latestWeatherAlertId = insights
      .filter((insight) => insight.source === 'WEATHER_ALERT' && insight.contextHash === 'dakos-alert')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.id
    const visibleInsights = insights.filter((insight) =>
      insight.source !== 'WEATHER_ALERT' || insight.contextHash !== 'dakos-alert' || insight.id === latestWeatherAlertId
    )

    // Count unread insights
    const unreadCount = visibleInsights.filter((i: { isRead: boolean }) => !i.isRead).length

    // Get the most recent generation time
    const aiInsights = visibleInsights.filter((i: { source: string }) => i.source === 'AI_GENERATED')
    const lastGeneratedAt = aiInsights.length > 0
      ? aiInsights.sort((a: { createdAt: Date }, b: { createdAt: Date }) =>
          b.createdAt.getTime() - a.createdAt.getTime()
        )[0]?.createdAt
      : null

    return NextResponse.json({
      success: true,
      insights: visibleInsights,
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

    if (!farm.isActive) return NextResponse.json({ error: INACTIVE_FARM_MESSAGE }, { status: 403 })

    // Delete all AI-generated insights for this farm
    const result = await prisma.smartRecommendation.deleteMany({
      where: {
        farmId,
        OR: [{ source: 'AI_GENERATED' }, { source: 'RULE_BASED', contextHash: { startsWith: 'farm:' } }]
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
