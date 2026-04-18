import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
      collectionDate,
      totalYield,
      totalYieldUnit, // 'kg' or 'ton'
      totalYieldTons: _totalYieldTons,
      pricePerKg,
      pricePerTon,
      priceUnit,
      totalValue,
      yieldPerTree,
      yieldPerStremma,
      notes,
      completed
    } = body

    // Validate required fields - different validation for new harvest vs daily collection
    if (!farmId || !year || !totalYield) {
      return NextResponse.json({
        error: 'Τα υποχρεωτικά πεδία (ελαιώνας, έτος, συνολική παραγωγή) είναι απαραίτητα'
      }, { status: 400 })
    }
    
    // For new harvests (when completed is false and no existing harvest), require startDate
    // For daily collections, require collectionDate
    if (!startDate && !collectionDate) {
      return NextResponse.json({
        error: 'Απαιτείται ημερομηνία έναρξης ή ημερομηνία συλλογής'
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

    // Convert totalYield to kg if needed
    let totalYieldKg = parseFloat(totalYield)
    if (totalYieldUnit === 'ton') {
      totalYieldKg = totalYieldKg * 1000
    }

    // WORKAROUND: Since collectionDate exists in schema but Prisma client doesn't recognize it
    // We use startDate to store the collection date for daily entries
    console.log('🔍 Date handling:', { startDate, collectionDate, receivedFromFrontend: !!collectionDate })

    // Create the harvest
    const harvest = await prisma.harvest.create({
      data: {
        farmId,
        year: parseInt(year),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        // collectionDate: collectionDate ? new Date(collectionDate) : null, // Prisma type issue in create
        totalYield: totalYieldKg,
        totalYieldTons: totalYieldKg / 1000,
        pricePerKg: pricePerKg ? parseFloat(pricePerKg) : null,
        pricePerTon: pricePerTon ? parseFloat(pricePerTon) : null,
        priceUnit: priceUnit || 'PER_KG',
        totalValue: totalValue ? parseFloat(totalValue) : null,
        yieldPerTree: yieldPerTree ? parseFloat(yieldPerTree) : null,
        yieldPerStremma: yieldPerStremma ? parseFloat(yieldPerStremma) : null,
        notes: notes || null,
        completed: completed || false,
      }
    })

    // If collectionDate was provided, update it using raw SQL as workaround
    if (collectionDate) {
      await prisma.$executeRaw`
        UPDATE harvests 
        SET "collectionDate" = ${new Date(collectionDate)}::timestamp
        WHERE id = ${harvest.id}
      `
      console.log('✅ Updated collectionDate via raw SQL:', collectionDate)
    }

    console.log('✅ New harvest created:', harvest.year, 'for farm:', farm.name)

    return NextResponse.json({
      success: true,
      harvest: {
        id: harvest.id,
        year: harvest.year,
        startDate: harvest.startDate,
        collectionDate: collectionDate ? new Date(collectionDate) : null, // Return the collectionDate we set
        totalYield: harvest.totalYield,
        totalYieldTons: harvest.totalYieldTons,
        totalValue: harvest.totalValue,
        yieldPerTree: harvest.yieldPerTree,
        yieldPerStremma: harvest.yieldPerStremma,
        pricePerKg: harvest.pricePerKg,
        pricePerTon: harvest.pricePerTon,
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