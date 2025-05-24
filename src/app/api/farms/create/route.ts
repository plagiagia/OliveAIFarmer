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
    const { name, location, coordinates, totalArea, description } = body

    // Validate required fields
    if (!name || !location) {
      return NextResponse.json({ 
        error: 'Το όνομα και η τοποθεσία είναι υποχρεωτικά' 
      }, { status: 400 })
    }

    // Get user from database to ensure they exist
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Create the farm
    const farm = await prisma.farm.create({
      data: {
        name: name.trim(),
        location: location.trim(),
        coordinates: coordinates?.trim() || null,
        totalArea: totalArea ? parseFloat(totalArea) : null,
        description: description?.trim() || null,
        userId: user.id,
      },
                  include: {        trees: true,        activities: true,        harvests: true,      }
    })

    console.log('✅ New farm created:', farm.name, 'for user:', user.email)

    return NextResponse.json({
      success: true,
      farm: {
        id: farm.id,
        name: farm.name,
        location: farm.location,
        totalArea: farm.totalArea,
        description: farm.description,
      }
    })
  } catch (error) {
    console.error('❌ Farm creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Αποτυχία δημιουργίας ελαιώνα'
    }, { status: 500 })
  }
} 