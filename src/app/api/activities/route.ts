import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// GET /api/activities?farmId=...
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const farmId = url.searchParams.get('farmId')

    if (!farmId) {
      return NextResponse.json({ error: 'Farm ID is required' }, { status: 400 })
    }

    // Verify user owns the farm
    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        user: { clerkId: userId }
      }
    })

    if (!farm) {
      return NextResponse.json({ error: 'Farm not found or access denied' }, { status: 404 })
    }

    // Get activities for the farm
    const activities = await prisma.activity.findMany({
      where: { farmId },
      include: {
        treeActivities: {
          include: {
            tree: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/activities
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      farmId,
      type,
      title,
      description,
      date,
      duration,
      cost,
      weather,
      notes,
      completed,
      selectedTrees
    } = body

    // Validate required fields
    if (!farmId || !type || !title || !date) {
      return NextResponse.json({ 
        error: 'Farm ID, type, title, and date are required' 
      }, { status: 400 })
    }

    // Verify user owns the farm
    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        user: { clerkId: userId }
      }
    })

    if (!farm) {
      return NextResponse.json({ error: 'Farm not found or access denied' }, { status: 404 })
    }

    // Create the activity
    const activity = await prisma.activity.create({
      data: {
        farmId,
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

    // If specific trees are selected, create tree activities
    if (selectedTrees && selectedTrees.length > 0) {
      await prisma.treeActivity.createMany({
        data: selectedTrees.map((treeId: string) => ({
          activityId: activity.id,
          treeId,
          notes: null
        }))
      })
    }

    // Fetch the created activity with relations
    const createdActivity = await prisma.activity.findUnique({
      where: { id: activity.id },
      include: {
        treeActivities: {
          include: {
            tree: true
          }
        }
      }
    })

    return NextResponse.json(createdActivity, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 