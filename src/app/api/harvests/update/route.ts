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
    const { 
      harvestId,
      year,
      startDate,
      endDate,
      collectionDate,
      totalYield,
      totalYieldUnit, // 'kg' or 'ton'
      pricePerKg,
      pricePerTon,
      priceUnit,
      totalValue,
      yieldPerTree,
      yieldPerStremma,
      notes,
      completed
    } = body

    // Validate required fields
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

    // Convert totalYield to kg if needed
    let totalYieldKg = totalYield ? parseFloat(totalYield) : existingHarvest.totalYield
    if (totalYield && totalYieldUnit === 'ton') {
      totalYieldKg = totalYieldKg * 1000
    }

    // Check if pricing is being updated
    const isPricingUpdate = pricePerKg || pricePerTon || priceUnit
    
    // Update the specific harvest
    const updatedHarvest = await prisma.harvest.update({
      where: { id: harvestId },
      data: {
        ...(year && { year: parseInt(year) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(collectionDate && { collectionDate: new Date(collectionDate) }),
        ...(totalYield && { 
          totalYield: totalYieldKg,
          totalYieldTons: totalYieldKg / 1000
        }),
        ...(pricePerKg && { pricePerKg: parseFloat(pricePerKg) }),
        ...(pricePerTon && { pricePerTon: parseFloat(pricePerTon) }),
        ...(priceUnit && { priceUnit }),
        ...(totalValue && { totalValue: parseFloat(totalValue) }),
        ...(yieldPerTree && { yieldPerTree: parseFloat(yieldPerTree) }),
        ...(yieldPerStremma && { yieldPerStremma: parseFloat(yieldPerStremma) }),
        ...(notes !== undefined && { notes }),
        ...(completed !== undefined && { completed })
      }
    })

    // If pricing was updated, update all other harvests in the same year and farm
    if (isPricingUpdate) {
      const priceUpdateData: any = {}
      if (pricePerKg) priceUpdateData.pricePerKg = parseFloat(pricePerKg)
      if (pricePerTon) priceUpdateData.pricePerTon = parseFloat(pricePerTon)
      if (priceUnit) priceUpdateData.priceUnit = priceUnit

      await prisma.harvest.updateMany({
        where: {
          farmId: existingHarvest.farmId,
          year: existingHarvest.year,
          id: { not: harvestId } // Don't update the harvest we just updated
        },
        data: priceUpdateData
      })

      console.log('✅ Updated pricing for all harvests in year:', existingHarvest.year)
    }

    console.log('✅ Harvest updated:', updatedHarvest.year, 'for harvest ID:', harvestId)

    return NextResponse.json({
      success: true,
      harvest: updatedHarvest
    })
  } catch (error) {
    console.error('❌ Harvest update error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Αποτυχία ενημέρωσης συγκομιδής'
    }, { status: 500 })
  }
} 