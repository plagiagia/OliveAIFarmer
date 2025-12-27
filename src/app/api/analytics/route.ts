import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface HarvestData {
  year: number
  totalYield: number | null
  totalValue: number | null
}

interface ActivityData {
  type: string
  date: Date
  cost: number | null
  duration: number | null
}

interface TreeData {
  id: string
}

interface FarmWithRelations {
  id: string
  name: string
  totalArea: number | null
  trees: TreeData[]
  activities: ActivityData[]
  harvests: HarvestData[]
}

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        farms: {
          include: {
            trees: true,
            activities: true,
            harvests: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const farms = user.farms as FarmWithRelations[]

    // Calculate summary stats
    const totalFarms = farms.length
    const totalTrees = farms.reduce((sum, farm) => sum + farm.trees.length, 0)
    const totalArea = farms.reduce((sum, farm) => sum + (farm.totalArea || 0), 0)
    const totalActivities = farms.reduce((sum, farm) => sum + farm.activities.length, 0)

    // Calculate harvest data by year
    const harvestsByYear: Record<number, { totalYield: number; totalValue: number }> = {}

    farms.forEach(farm => {
      farm.harvests.forEach((harvest: HarvestData) => {
        if (!harvestsByYear[harvest.year]) {
          harvestsByYear[harvest.year] = { totalYield: 0, totalValue: 0 }
        }
        harvestsByYear[harvest.year].totalYield += harvest.totalYield || 0
        harvestsByYear[harvest.year].totalValue += harvest.totalValue || 0
      })
    })

    const harvestData = Object.entries(harvestsByYear)
      .map(([year, data]) => ({
        year: parseInt(year),
        totalYield: data.totalYield,
        totalValue: data.totalValue,
        yieldPerStremma: totalArea > 0 ? data.totalYield / totalArea : 0
      }))
      .sort((a, b) => a.year - b.year)

    // Calculate activity data by type
    const activityLabels: Record<string, string> = {
      WATERING: 'Πότισμα',
      PRUNING: 'Κλάδεμα',
      FERTILIZING: 'Λίπανση',
      PEST_CONTROL: 'Φυτοπροστασία',
      SOIL_WORK: 'Εργασίες εδάφους',
      HARVESTING: 'Συγκομιδή',
      MAINTENANCE: 'Συντήρηση',
      INSPECTION: 'Επιθεώρηση',
      OTHER: 'Άλλο'
    }

    const activitiesByType: Record<string, { count: number; totalCost: number; totalDuration: number }> = {}

    farms.forEach(farm => {
      farm.activities.forEach((activity: ActivityData) => {
        const type = activity.type
        if (!activitiesByType[type]) {
          activitiesByType[type] = { count: 0, totalCost: 0, totalDuration: 0 }
        }
        activitiesByType[type].count += 1
        activitiesByType[type].totalCost += activity.cost || 0
        activitiesByType[type].totalDuration += activity.duration || 0
      })
    })

    const activityData = Object.entries(activitiesByType)
      .map(([type, data]) => ({
        type,
        typeLabel: activityLabels[type] || type,
        count: data.count,
        totalCost: data.totalCost,
        totalDuration: data.totalDuration
      }))
      .sort((a, b) => b.count - a.count)

    // Calculate monthly activity data for current year
    const currentYear = new Date().getFullYear()
    const monthlyData: Record<number, { activities: number; costs: number }> = {}

    farms.forEach(farm => {
      farm.activities.forEach((activity: ActivityData) => {
        const activityDate = new Date(activity.date)
        if (activityDate.getFullYear() === currentYear) {
          const month = activityDate.getMonth() + 1
          if (!monthlyData[month]) {
            monthlyData[month] = { activities: 0, costs: 0 }
          }
          monthlyData[month].activities += 1
          monthlyData[month].costs += activity.cost || 0
        }
      })
    })

    const monthlyActivityData = Object.entries(monthlyData)
      .map(([month, data]) => ({
        monthNumber: parseInt(month),
        month: getGreekMonthName(parseInt(month)),
        activities: data.activities,
        costs: data.costs
      }))

    // Farm comparison data
    const farmComparisonData = farms.map(farm => {
      const farmTotalYield = farm.harvests.reduce((sum: number, h: HarvestData) => sum + (h.totalYield || 0), 0)
      return {
        farmName: farm.name,
        totalArea: farm.totalArea || 0,
        treeCount: farm.trees.length,
        totalYield: farmTotalYield,
        yieldPerStremma: farm.totalArea && farm.totalArea > 0
          ? farmTotalYield / farm.totalArea
          : 0
      }
    })

    // Calculate total costs
    const totalCosts = farms.reduce((sum: number, farm: FarmWithRelations) =>
      sum + farm.activities.reduce((aSum: number, a: ActivityData) => aSum + (a.cost || 0), 0), 0
    )

    // Calculate total harvest value
    const totalHarvestValue = farms.reduce((sum: number, farm: FarmWithRelations) =>
      sum + farm.harvests.reduce((hSum: number, h: HarvestData) => hSum + (h.totalValue || 0), 0), 0
    )

    // Calculate yield trend (compare last 2 years)
    const years = Object.keys(harvestsByYear).map(Number).sort((a, b) => b - a)
    let yieldTrend = null
    if (years.length >= 2) {
      const lastYear = harvestsByYear[years[0]]?.totalYield || 0
      const prevYear = harvestsByYear[years[1]]?.totalYield || 0
      if (prevYear > 0) {
        const change = ((lastYear - prevYear) / prevYear) * 100
        yieldTrend = {
          value: Math.round(Math.abs(change)),
          isPositive: change >= 0
        }
      }
    }

    return NextResponse.json({
      summary: {
        totalFarms,
        totalTrees,
        totalArea,
        totalActivities,
        totalCosts,
        totalHarvestValue,
        yieldTrend
      },
      harvestData,
      activityData,
      monthlyActivityData,
      farmComparisonData
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

function getGreekMonthName(month: number): string {
  const months = [
    'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος',
    'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος',
    'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
  ]
  return months[month - 1] || ''
}
