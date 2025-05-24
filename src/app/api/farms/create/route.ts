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
    const { name, location, coordinates, totalArea, treeCount, oliveVariety, description } = body

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
      include: {
        trees: true,
        activities: true,
        harvests: true,
      }
    })

    // If tree count is provided, create tree records
    if (treeCount && treeCount > 0) {
      const treesToCreate = []
      
      for (let i = 1; i <= treeCount; i++) {
        treesToCreate.push({
          farmId: farm.id,
          treeNumber: i.toString(),
          variety: oliveVariety?.trim() || 'Άγνωστο',
          plantingYear: null, // Can be updated later
          notes: null,
        })
      }

      await prisma.oliveTree.createMany({
        data: treesToCreate
      })

      console.log(`✅ Created ${treeCount} trees for farm: ${farm.name}`)
    }

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