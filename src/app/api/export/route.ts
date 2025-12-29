import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface HarvestData {
  year: number
  startDate: Date | null
  endDate: Date | null
  totalYield: number | null
  pricePerKg: number | null
  totalValue: number | null
  yieldPerStremma: number | null
  notes: string | null
}

interface ActivityData {
  type: string
  title: string
  date: Date
  duration: number | null
  cost: number | null
  completed: boolean
  notes: string | null
}

interface FarmWithRelations {
  name: string
  location: string | null
  totalArea: number | null
  treeCount: number | null
  oliveVariety: string | null
  coordinates: string | null
  activities: ActivityData[]
  harvests: HarvestData[]
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const farmId = searchParams.get('farmId')

    // Get user with farms
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        farms: {
          include: {
            activities: {
              orderBy: { date: 'desc' }
            },
            harvests: {
              orderBy: { year: 'desc' }
            }
          },
          ...(farmId ? { where: { id: farmId } } : {})
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const farms = user.farms as FarmWithRelations[]

    switch (type) {
      case 'farms':
        return NextResponse.json({
          data: farms.map(farm => ({
            name: farm.name,
            location: farm.location,
            totalArea: farm.totalArea,
            treeCount: farm.treeCount,
            oliveVariety: farm.oliveVariety,
            coordinates: farm.coordinates,
            activitiesCount: farm.activities.length,
            harvestsCount: farm.harvests.length
          }))
        })

      case 'harvests':
        const harvests = farms.flatMap(farm =>
          farm.harvests.map((harvest: HarvestData) => ({
            farmName: farm.name,
            year: harvest.year,
            startDate: harvest.startDate,
            endDate: harvest.endDate,
            totalYield: harvest.totalYield,
            pricePerKg: harvest.pricePerKg,
            totalValue: harvest.totalValue,
            yieldPerStremma: harvest.yieldPerStremma,
            notes: harvest.notes
          }))
        )
        return NextResponse.json({ data: harvests })

      case 'activities':
        const activities = farms.flatMap(farm =>
          farm.activities.map((activity: ActivityData) => ({
            farmName: farm.name,
            type: activity.type,
            title: activity.title,
            date: activity.date,
            duration: activity.duration,
            cost: activity.cost,
            completed: activity.completed,
            notes: activity.notes
          }))
        )
        return NextResponse.json({ data: activities })

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
