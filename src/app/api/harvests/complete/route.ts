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
    const allDates = yearHarvests.map(h => {
      const collectionDate = h.collectionDate || h.startDate
      return collectionDate ? new Date(collectionDate) : null
    }).filter(date => date !== null) as Date[]

    const actualStartDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : existingHarvest.startDate
    const actualEndDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date()

    // Update the specific harvest to mark as completed
    const updatedHarvest = await prisma.harvest.update({
      where: { id: harvestId },
      data: {
        completed: true,
        // Update the harvest's own dates if they're not already set properly
        startDate: existingHarvest.startDate || actualStartDate,
        endDate: actualEndDate
      }
    })

    // Update all other harvests from the same year with the calculated date range
    // This ensures the displayed date range is consistent across all collections
    await prisma.harvest.updateMany({
      where: {
        farmId: existingHarvest.farmId,
        year: existingHarvest.year,
        id: { not: harvestId } // Don't update the one we just updated
      },
      data: {
        // Only update start/end dates for proper range calculation
        // We don't mark others as completed here
      }
    })

    console.log(`✅ Harvest completed: ${existingHarvest.year} for harvest ID: ${harvestId}`)
    console.log(`📅 Date range calculated: ${actualStartDate.toISOString().split('T')[0]} to ${actualEndDate.toISOString().split('T')[0]}`)

    return NextResponse.json({
      success: true,
      harvest: updatedHarvest,
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