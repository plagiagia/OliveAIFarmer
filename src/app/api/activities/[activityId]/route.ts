import { prisma } from '@/lib/db'
import { INACTIVE_FARM_MESSAGE } from '@/lib/farm-activation'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{
    activityId: string
  }>
}

// GET /api/activities/[activityId]
export async function GET(request: Request, props: RouteParams) {
  const params = await props.params
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activity = await prisma.activity.findFirst({
      where: {
        id: params.activityId,
        farm: {
          user: { clerkId: userId }
        }
      }
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/activities/[activityId]
export async function PUT(request: Request, props: RouteParams) {
  const params = await props.params
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns the activity
    const existingActivity = await prisma.activity.findFirst({
      where: {
        id: params.activityId,
        farm: {
          user: { clerkId: userId }
        }
      },
      include: { farm: { select: { isActive: true } } }
    })

    if (!existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    if (!existingActivity.farm.isActive) {
      return NextResponse.json({ error: INACTIVE_FARM_MESSAGE }, { status: 403 })
    }

    const body = await request.json()
    const {
      type,
      title,
      description,
      date,
      duration,
      cost,
      weather,
      notes,
      completed
    } = body

    // Validate required fields
    if (!type || !title || !date) {
      return NextResponse.json({ 
        error: 'Type, title, and date are required' 
      }, { status: 400 })
    }

    // Update the activity
    const activity = await prisma.activity.update({
      where: { id: params.activityId },
      data: {
        type,
        title,
        description,
        date: new Date(date),
        duration: duration ? parseInt(duration) : null,
        cost: cost ? parseFloat(cost) : null,
        weather,
        notes,
        completed: completed || false
      }
    })

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/activities/[activityId]
export async function DELETE(request: Request, props: RouteParams) {
  const params = await props.params
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns the activity
    const activity = await prisma.activity.findFirst({
      where: {
        id: params.activityId,
        farm: {
          user: { clerkId: userId }
        }
      },
      include: { farm: { select: { isActive: true } } }
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    if (!activity.farm.isActive) {
      return NextResponse.json({ error: INACTIVE_FARM_MESSAGE }, { status: 403 })
    }

    // Delete the activity (tree activities will be deleted automatically due to cascade)
    await prisma.activity.delete({
      where: { id: params.activityId }
    })

    return NextResponse.json({ message: 'Activity deleted successfully' })
  } catch (error) {
    console.error('Error deleting activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
