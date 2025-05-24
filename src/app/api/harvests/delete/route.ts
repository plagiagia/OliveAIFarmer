import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const harvestId = searchParams.get('harvestId')

    if (!harvestId) {
      return NextResponse.json({ 
        error: 'Harvest ID είναι απαραίτητο' 
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
        error: 'Η συγκομιδή δεν βρέθηκε ή δεν έχετε πρόσβαση σε αυτήν' 
      }, { status: 404 })
    }

    // Delete the harvest
    await prisma.harvest.delete({
      where: { id: harvestId }
    })

    console.log('✅ Harvest deleted:', existingHarvest.year, 'for harvest ID:', harvestId)

    return NextResponse.json({
      success: true,
      message: 'Η συγκομιδή διαγράφηκε επιτυχώς'
    })
  } catch (error) {
    console.error('❌ Harvest deletion error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Αποτυχία διαγραφής συγκομιδής'
    }, { status: 500 })
  }
} 