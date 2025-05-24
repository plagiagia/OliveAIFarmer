import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const varietyId = searchParams.get('id')
    const includeDetails = searchParams.get('details') === 'true'

    if (varietyId) {
      // Get specific variety with full details
      const variety = await prisma.oliveVariety.findUnique({
        where: { id: varietyId },
        include: {
          monthlyTasks: {
            orderBy: { month: 'asc' }
          },
          riskFactors: {
            orderBy: { severity: 'desc' }
          },
          careGuidelines: {
            orderBy: { importance: 'desc' }
          },
          trees: includeDetails ? {
            include: {
              farm: {
                select: { name: true, location: true }
              }
            }
          } : false
        }
      })

      if (!variety) {
        return NextResponse.json({ error: 'Variety not found' }, { status: 404 })
      }

      return NextResponse.json(variety)
    } else {
      // Get all varieties with basic info
      const varieties = await prisma.oliveVariety.findMany({
        select: {
          id: true,
          name: true,
          scientificName: true,
          alternativeNames: true,
          primaryRegions: true,
          treeSize: true,
          fruitType: true,
          oilContent: true,
          maturityPeriod: true,
          avgYieldPerTree: true,
          avgYieldPerStremma: true,
          waterNeeds: true,
          sunlightNeeds: true,
          pruningNeeds: true,
          fertilizingNeeds: true,
          irrigationNeeds: true,
          _count: {
            monthlyTasks: true,
            riskFactors: true,
            careGuidelines: true,
            trees: true
          }
        },
        orderBy: { name: 'asc' }
      })

      return NextResponse.json(varieties)
    }
  } catch (error) {
    console.error('❌ Error fetching varieties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch varieties' },
      { status: 500 }
    )
  }
}

// Get monthly recommendations for current month
export async function POST(request: NextRequest) {
  try {
    const { varietyId, month, farmLocation } = await request.json()
    
    if (!varietyId || !month) {
      return NextResponse.json(
        { error: 'varietyId and month are required' },
        { status: 400 }
      )
    }

    // Get variety with monthly tasks for the specified month
    const variety = await prisma.oliveVariety.findUnique({
      where: { id: varietyId },
      include: {
        monthlyTasks: {
          where: { month: parseInt(month) },
          orderBy: { priority: 'desc' }
        },
        riskFactors: {
          where: {
            seasonality: {
              has: getMonthName(parseInt(month))
            }
          },
          orderBy: { severity: 'desc' }
        }
      }
    })

    if (!variety) {
      return NextResponse.json({ error: 'Variety not found' }, { status: 404 })
    }

    // Generate smart recommendations based on variety needs and current month
    const recommendations = generateSmartRecommendations(variety, parseInt(month), farmLocation)

    return NextResponse.json({
      variety: {
        id: variety.id,
        name: variety.name,
        waterNeeds: variety.waterNeeds,
        pruningNeeds: variety.pruningNeeds
      },
      monthlyTasks: variety.monthlyTasks,
      riskFactors: variety.riskFactors,
      smartRecommendations: recommendations
    })
  } catch (error) {
    console.error('❌ Error generating recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

function getMonthName(month: number): string {
  const months = [
    'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
    'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
  ]
  return months[month - 1] || 'Άγνωστος'
}

function generateSmartRecommendations(variety: any, month: number, farmLocation?: string) {
  const recommendations = []
  
  // Water-based recommendations
  if (variety.waterNeeds === 'HIGH' && (month >= 5 && month <= 9)) {
    recommendations.push({
      type: 'CARE_SUGGESTION',
      title: 'Αυξημένο πότισμα',
      message: `Η ποικιλία ${variety.name} χρειάζεται εντατικό πότισμα αυτή την εποχή. Ποτίστε 2-3 φορές την εβδομάδα.`,
      urgency: 'HIGH'
    })
  }

  // Pruning recommendations
  if (variety.pruningNeeds === 'INTENSIVE' && (month === 1 || month === 2)) {
    recommendations.push({
      type: 'TASK_REMINDER',
      title: 'Χειμερινό κλάδεμα',
      message: `Η ποικιλία ${variety.name} χρειάζεται εντατικό κλάδεμα. Ιδανική περίοδος για διαμόρφωση κόμης.`,
      urgency: 'HIGH'
    })
  }

  // Seasonal tips
  if (month === 10) {
    recommendations.push({
      type: 'SEASONAL_TIP',
      title: 'Περίοδος συγκομιδής',
      message: `Οκτώβριος είναι η κύρια περίοδος συγκομιδής για την ${variety.name}. Παρακολουθήστε την ωρίμανση των καρπών.`,
      urgency: 'CRITICAL'
    })
  }

  return recommendations
} 