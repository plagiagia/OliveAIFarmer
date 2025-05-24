import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { harvestId, endDate } = body

    if (!harvestId) {
      return NextResponse.json({ 
        error: 'harvestId is required' 
      }, { status: 400 })
    }

    // Verify user owns the harvest through farm ownership
    const existingHarvest = await prisma.harvest.findFirst({
      where: {
        id: harvestId,
        farm: {
          user: {
            clerkId: userId
          }
        }
      }
    })

    if (!existingHarvest) {
      return NextResponse.json({ 
        error: 'Harvest not found or access denied' 
      }, { status: 404 })
    }

    // Update harvest to mark as completed
    const updatedHarvest = await prisma.harvest.update({
      where: { id: harvestId },
      data: {
        completed: true,
        endDate: endDate ? new Date(endDate) : existingHarvest.endDate || new Date()
      }
    })

    console.log('✅ Harvest completed:', updatedHarvest.year, 'for harvest ID:', harvestId)

    return NextResponse.json({
      success: true,
      harvest: updatedHarvest
    })
  } catch (error) {
    console.error('❌ Harvest completion error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to complete harvest'
    }, { status: 500 })
  }
} 