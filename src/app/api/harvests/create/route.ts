import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      farmId,
      year,
      startDate,
      endDate,
      totalYield,
      totalYieldTons,
      qualityGrade,
      pricePerKg,
      pricePerTon,
      priceUnit,
      totalValue,
      yieldPerTree,
      yieldPerStremma,
      oilExtracted,
      notes
    } = body

    // Validate required fields
    if (!farmId || !year || !startDate || !totalYield) {
      return NextResponse.json({ 
        error: 'Τα υποχρεωτικά πεδία (ελαιώνας, έτος, ημερομηνία έναρξης, συνολική παραγωγή) είναι απαραίτητα' 
      }, { status: 400 })
    }

    // Verify user owns the farm
    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        user: {
          clerkId: userId
        }
      }
    })

    if (!farm) {
      return NextResponse.json({ 
        error: 'Ο ελαιώνας δεν βρέθηκε ή δεν έχετε πρόσβαση σε αυτόν' 
      }, { status: 404 })
    }

    // Check if harvest for this year already exists
    const existingHarvest = await prisma.harvest.findUnique({
      where: {
        farmId_year: {
          farmId: farmId,
          year: parseInt(year)
        }
      }
    })

    if (existingHarvest) {
      return NextResponse.json({ 
        error: `Υπάρχει ήδη συγκομιδή για το έτος ${year} σε αυτόν τον ελαιώνα` 
      }, { status: 400 })
    }

    // Calculate oil yield percentage if oil extracted is provided
    let oilYieldPercent = null
    if (oilExtracted && totalYield) {
      // Approximate conversion: 1 liter olive oil ≈ 0.92 kg
      const oilWeightKg = oilExtracted * 0.92
      oilYieldPercent = (oilWeightKg / totalYield) * 100
    }

    // Create the harvest
    const harvest = await prisma.harvest.create({
      data: {
        farmId,
        year: parseInt(year),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        totalYield: parseFloat(totalYield),
        totalYieldTons: parseFloat(totalYieldTons),
        qualityGrade: qualityGrade || null,
        pricePerKg: pricePerKg ? parseFloat(pricePerKg) : null,
        pricePerTon: pricePerTon ? parseFloat(pricePerTon) : null,
        priceUnit: priceUnit || 'PER_KG',
        totalValue: totalValue ? parseFloat(totalValue) : null,
        yieldPerTree: yieldPerTree ? parseFloat(yieldPerTree) : null,
        yieldPerStremma: yieldPerStremma ? parseFloat(yieldPerStremma) : null,
        oilExtracted: oilExtracted ? parseFloat(oilExtracted) : null,
        oilYieldPercent: oilYieldPercent,
        notes: notes || null,
        completed: false, // Can be updated later
      }
    })

    console.log('✅ New harvest created:', harvest.year, 'for farm:', farm.name)

    return NextResponse.json({
      success: true,
      harvest: {
        id: harvest.id,
        year: harvest.year,
        totalYield: harvest.totalYield,
        totalYieldTons: harvest.totalYieldTons,
        totalValue: harvest.totalValue,
        yieldPerTree: harvest.yieldPerTree,
        yieldPerStremma: harvest.yieldPerStremma,
        qualityGrade: harvest.qualityGrade,
        priceUnit: harvest.priceUnit,
        completed: harvest.completed
      }
    })
  } catch (error) {
    console.error('❌ Harvest creation error:', error)
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({
        success: false,
        error: 'Υπάρχει ήδη συγκομιδή για αυτό το έτος σε αυτόν τον ελαιώνα'
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Αποτυχία δημιουργίας συγκομιδής'
    }, { status: 500 })
  }
} 