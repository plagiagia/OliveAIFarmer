import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface TreeInput {
  treeNumber: string
  variety: string
  plantingYear: number | null
  health: string
  notes: string | null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { userId } = await auth()
    const { farmId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { trees } = body as { trees: TreeInput[] }

    if (!trees || !Array.isArray(trees) || trees.length === 0) {
      return NextResponse.json({
        error: 'Παρακαλώ παρέχετε δέντρα για προσθήκη'
      }, { status: 400 })
    }

    // Verify farm ownership
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { trees: { select: { treeNumber: true } } }
    })

    if (!farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    if (farm.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check for existing tree numbers
    const existingNumbers = new Set(farm.trees.map((t: { treeNumber: string }) => t.treeNumber))
    const newNumbers = trees.map(t => t.treeNumber)
    const duplicates = newNumbers.filter(n => existingNumbers.has(n))

    if (duplicates.length > 0) {
      return NextResponse.json({
        error: `Αυτοί οι αριθμοί δέντρων υπάρχουν ήδη: ${duplicates.join(', ')}`
      }, { status: 400 })
    }

    // Check for duplicates within the input
    const inputDuplicates = newNumbers.filter((n, i) => newNumbers.indexOf(n) !== i)
    if (inputDuplicates.length > 0) {
      return NextResponse.json({
        error: `Διπλότυποι αριθμοί δέντρων: ${[...new Set(inputDuplicates)].join(', ')}`
      }, { status: 400 })
    }

    // Create trees
    const treeData = trees.map(tree => ({
      farmId,
      treeNumber: tree.treeNumber,
      variety: tree.variety,
      plantingYear: tree.plantingYear,
      health: tree.health as 'EXCELLENT' | 'GOOD' | 'HEALTHY' | 'FAIR' | 'POOR' | 'DISEASED',
      notes: tree.notes
    }))

    const result = await prisma.oliveTree.createMany({
      data: treeData
    })

    console.log(`✅ Created ${result.count} trees for farm: ${farm.name}`)

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Προστέθηκαν ${result.count} δέντρα επιτυχώς`
    })
  } catch (error) {
    console.error('Bulk tree creation error:', error)
    return NextResponse.json({
      error: 'Αποτυχία προσθήκης δέντρων'
    }, { status: 500 })
  }
}
