import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface Harvest {
  year: number
  totalYield: number | null
  totalValue: number | null
  pricePerKg: number | null
}

interface Activity {
  type: string
  title: string
  date: Date
  duration: number | null
  cost: number | null
  completed: boolean
}

interface OliveTree {
  treeNumber: string
  variety: string
  health: string | null
  status: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { userId } = await auth()
    const { farmId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user and verify ownership
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get farm with all related data
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        trees: {
          orderBy: { treeNumber: 'asc' }
        },
        activities: {
          orderBy: { date: 'desc' }
        },
        harvests: {
          orderBy: { year: 'desc' }
        }
      }
    })

    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    // Verify ownership
    if (farm.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Calculate summary
    const harvests = farm.harvests as Harvest[]
    const activities = farm.activities as Activity[]
    const trees = farm.trees as OliveTree[]

    const totalYield = harvests.reduce((sum: number, h: Harvest) => sum + (h.totalYield || 0), 0)
    const totalValue = harvests.reduce((sum: number, h: Harvest) => sum + (h.totalValue || 0), 0)
    const totalCost = activities.reduce((sum: number, a: Activity) => sum + (a.cost || 0), 0)

    // Format response for PDF report
    const reportData = {
      farm: {
        name: farm.name,
        location: farm.location,
        totalArea: farm.totalArea,
        coordinates: farm.coordinates
      },
      trees: trees.map((tree: OliveTree) => ({
        treeNumber: tree.treeNumber,
        variety: tree.variety,
        health: tree.health,
        status: tree.status
      })),
      activities: activities.map((activity: Activity) => ({
        type: activity.type,
        title: activity.title,
        date: activity.date.toISOString(),
        duration: activity.duration,
        cost: activity.cost,
        completed: activity.completed
      })),
      harvests: harvests.map((harvest: Harvest) => ({
        year: harvest.year,
        totalYield: harvest.totalYield,
        totalValue: harvest.totalValue,
        pricePerKg: harvest.pricePerKg
      })),
      summary: {
        totalTrees: trees.length,
        totalActivities: activities.length,
        totalHarvests: harvests.length,
        totalYield,
        totalValue,
        totalCost
      }
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
