import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

async function completeHarvest(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { harvestId } = body

    if (!harvestId) {
      return NextResponse.json({ 
        error: 'harvestId is required' 
      }, { status: 400 })
    }

    // Get the harvest and all other harvests from the same year/farm to calculate correct dates
    const existingHarvest = await prisma.harvest.findFirst({
      where: {
        id: harvestId,
        farm: {
          user: {
            clerkId: userId
          }
        }
      },
      include: {
        farm: true
      }
    })

    if (!existingHarvest) {
      return NextResponse.json({ 
        error: 'Harvest not found or access denied' 
      }, { status: 404 })
    }

    // Get all harvests from the same year and farm to calculate proper date range
    const yearHarvests = await prisma.harvest.findMany({
      where: {
        farmId: existingHarvest.farmId,
        year: existingHarvest.year
      },
      orderBy: [
        { startDate: 'asc' },
        { collectionDate: 'asc' }
      ]
    })

    // Calculate the actual start and end dates based on all collections
    const allDates = yearHarvests.map((h: { collectionDate: Date | null; startDate: Date }) => {
      const collectionDate = h.collectionDate || h.startDate
      return collectionDate ? new Date(collectionDate) : null
    }).filter((date: Date | null): date is Date => date !== null)

    const actualStartDate = allDates.length > 0 ? new Date(Math.min(...allDates.map((d: Date) => d.getTime()))) : existingHarvest.startDate
    const actualEndDate = allDates.length > 0 ? new Date(Math.max(...allDates.map((d: Date) => d.getTime()))) : new Date()

    // Complete the harvest season by marking all collections in the same farm/year as completed
    // and setting a consistent endDate across them.
    await prisma.harvest.updateMany({
      where: {
        farmId: existingHarvest.farmId,
        year: existingHarvest.year,
      },
      data: {
        completed: true,
        endDate: actualEndDate
      }
    })

    const updatedHarvest = await prisma.harvest.findUnique({
      where: { id: harvestId }
    })

    console.log(`✅ Harvest completed: ${existingHarvest.year} for harvest ID: ${harvestId}`)
    console.log(`📅 Date range calculated: ${actualStartDate.toISOString().split('T')[0]} to ${actualEndDate.toISOString().split('T')[0]}`)

    return NextResponse.json({
      success: true,
      harvest: updatedHarvest || null,
      dateRange: {
        startDate: actualStartDate,
        endDate: actualEndDate
      }
    })
  } catch (error) {
    console.error('❌ Harvest completion error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to complete harvest'
    }, { status: 500 })
  }
}

// Support both PATCH (existing) and POST (new frontend calls)
export async function PATCH(request: NextRequest) {
  return completeHarvest(request)
}

export async function POST(request: NextRequest) {
  return completeHarvest(request)
} 
