import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get('farmId')
    const year = searchParams.get('year')
    const incomplete = searchParams.get('incomplete') === 'true'

    if (!farmId) {
      return NextResponse.json({ error: 'farmId is required' }, { status: 400 })
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
      return NextResponse.json({ error: 'Farm not found or access denied' }, { status: 404 })
    }

    // Build query conditions
    const whereConditions: any = {
      farmId: farmId
    }

    if (year) {
      whereConditions.year = parseInt(year)
    }

    if (incomplete) {
      whereConditions.completed = false
    }

    // Get harvests
    const harvests = await prisma.harvest.findMany({
      where: whereConditions,
      orderBy: [
        { year: 'desc' },
        { startDate: 'desc' }
      ]
    })

    return NextResponse.json(harvests)
  } catch (error) {
    console.error('❌ Harvest fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch harvests'
    }, { status: 500 })
  }
} 