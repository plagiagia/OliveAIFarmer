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

interface FarmWithRelations {
  id: string
  name: string
  totalArea: number | null
  treeCount: number | null
  oliveVariety: string | null
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
    const totalTrees = farms.reduce((sum, farm) => sum + (farm.treeCount || 0), 0)
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
        treeCount: farm.treeCount || 0,
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

    // Enhanced Efficiency Metrics
    const totalYield = farms.reduce((sum: number, farm: FarmWithRelations) =>
      sum + farm.harvests.reduce((hSum: number, h: HarvestData) => hSum + (h.totalYield || 0), 0), 0
    )

    const roi = totalCosts > 0 ? ((totalHarvestValue - totalCosts) / totalCosts) * 100 : 0
    const costPerKg = totalYield > 0 ? totalCosts / totalYield : 0
    const yieldPerTree = totalTrees > 0 ? totalYield / totalTrees : 0
    const avgYieldPerStremma = totalArea > 0 ? totalYield / totalArea : 0
    const profitMargin = totalHarvestValue > 0 ? ((totalHarvestValue - totalCosts) / totalHarvestValue) * 100 : 0

    // Cost Breakdown by Activity Type
    const costBreakdown = activityData.map(a => ({
      type: a.type,
      typeLabel: a.typeLabel,
      cost: a.totalCost,
      percentage: totalCosts > 0 ? (a.totalCost / totalCosts) * 100 : 0
    }))

    // Profitability Timeline (by year)
    const profitabilityTimeline = Object.entries(harvestsByYear)
      .map(([year, data]) => {
        const yearNum = parseInt(year)
        const yearCosts = farms.reduce((sum: number, farm: FarmWithRelations) =>
          sum + farm.activities
            .filter((a: ActivityData) => new Date(a.date).getFullYear() === yearNum)
            .reduce((aSum: number, a: ActivityData) => aSum + (a.cost || 0), 0), 0
        )
        return {
          year: yearNum,
          revenue: data.totalValue,
          costs: yearCosts,
          profit: data.totalValue - yearCosts
        }
      })
      .sort((a, b) => a.year - b.year)

    // Year-over-Year Comparison
    let yearOverYearComparison = null
    if (years.length >= 2) {
      const currentYear = years[0]
      const previousYear = years[1]

      const currentYearCosts = farms.reduce((sum: number, farm: FarmWithRelations) =>
        sum + farm.activities
          .filter((a: ActivityData) => new Date(a.date).getFullYear() === currentYear)
          .reduce((aSum: number, a: ActivityData) => aSum + (a.cost || 0), 0), 0
      )

      const previousYearCosts = farms.reduce((sum: number, farm: FarmWithRelations) =>
        sum + farm.activities
          .filter((a: ActivityData) => new Date(a.date).getFullYear() === previousYear)
          .reduce((aSum: number, a: ActivityData) => aSum + (a.cost || 0), 0), 0
      )

      const currentYearActivities = farms.reduce((sum: number, farm: FarmWithRelations) =>
        sum + farm.activities.filter((a: ActivityData) => new Date(a.date).getFullYear() === currentYear).length, 0
      )

      const previousYearActivities = farms.reduce((sum: number, farm: FarmWithRelations) =>
        sum + farm.activities.filter((a: ActivityData) => new Date(a.date).getFullYear() === previousYear).length, 0
      )

      yearOverYearComparison = {
        currentYear,
        previousYear,
        yieldChange: previousYear && harvestsByYear[previousYear]?.totalYield > 0
          ? ((harvestsByYear[currentYear]?.totalYield - harvestsByYear[previousYear]?.totalYield) / harvestsByYear[previousYear]?.totalYield) * 100
          : 0,
        revenueChange: previousYear && harvestsByYear[previousYear]?.totalValue > 0
          ? ((harvestsByYear[currentYear]?.totalValue - harvestsByYear[previousYear]?.totalValue) / harvestsByYear[previousYear]?.totalValue) * 100
          : 0,
        costChange: previousYearCosts > 0
          ? ((currentYearCosts - previousYearCosts) / previousYearCosts) * 100
          : 0,
        activityChange: previousYearActivities > 0
          ? ((currentYearActivities - previousYearActivities) / previousYearActivities) * 100
          : 0
      }
    }

    // Farm Performance Rankings
    const farmPerformance = farms.map(farm => {
      const farmYield = farm.harvests.reduce((sum: number, h: HarvestData) => sum + (h.totalYield || 0), 0)
      const farmRevenue = farm.harvests.reduce((sum: number, h: HarvestData) => sum + (h.totalValue || 0), 0)
      const farmCosts = farm.activities.reduce((sum: number, a: ActivityData) => sum + (a.cost || 0), 0)
      const farmProfit = farmRevenue - farmCosts
      const farmROI = farmCosts > 0 ? (farmProfit / farmCosts) * 100 : 0
      const farmYieldPerStremma = farm.totalArea && farm.totalArea > 0 ? farmYield / farm.totalArea : 0
      const farmYieldPerTree = farm.treeCount && farm.treeCount > 0 ? farmYield / farm.treeCount : 0

      return {
        farmId: farm.id,
        farmName: farm.name,
        totalYield: farmYield,
        revenue: farmRevenue,
        costs: farmCosts,
        profit: farmProfit,
        roi: farmROI,
        yieldPerStremma: farmYieldPerStremma,
        yieldPerTree: farmYieldPerTree,
        efficiency: farmCosts > 0 ? farmYield / farmCosts : 0
      }
    })

    const bestPerformingFarm = farmPerformance.length > 0
      ? farmPerformance.reduce((best, farm) => farm.roi > best.roi ? farm : best)
      : null

    const worstPerformingFarm = farmPerformance.length > 0
      ? farmPerformance.reduce((worst, farm) => farm.roi < worst.roi ? farm : worst)
      : null

    const mostEfficientFarm = farmPerformance.length > 0
      ? farmPerformance.reduce((best, farm) => farm.efficiency > best.efficiency ? farm : best)
      : null

    // Activity Intensity Heatmap Data (for calendar view)
    const activityIntensity: Record<string, number> = {}
    farms.forEach(farm => {
      farm.activities.forEach((activity: ActivityData) => {
        const dateKey = new Date(activity.date).toISOString().split('T')[0]
        activityIntensity[dateKey] = (activityIntensity[dateKey] || 0) + 1
      })
    })

    const activityHeatmapData = Object.entries(activityIntensity).map(([date, count]) => ({
      date,
      count
    }))

    // Actionable Recommendations
    const recommendations = []

    if (roi < 20) {
      recommendations.push({
        type: 'warning',
        category: 'Κερδοφορία',
        message: 'Η απόδοση επένδυσης (ROI) είναι χαμηλή. Εξετάστε τρόπους μείωσης κόστους ή βελτίωσης παραγωγής.',
        priority: 'high'
      })
    }

    if (costPerKg > 2) {
      recommendations.push({
        type: 'warning',
        category: 'Κόστος',
        message: `Το κόστος παραγωγής (€${costPerKg.toFixed(2)}/kg) είναι υψηλό. Αναζητήστε ευκαιρίες βελτιστοποίησης.`,
        priority: 'medium'
      })
    }

    const highCostActivities = activityData.filter(a => a.totalCost > totalCosts * 0.2)
    if (highCostActivities.length > 0) {
      recommendations.push({
        type: 'info',
        category: 'Δραστηριότητες',
        message: `Οι δραστηριότητες ${highCostActivities.map(a => a.typeLabel).join(', ')} αποτελούν μεγάλο μέρος του κόστους. Εξετάστε εναλλακτικές μεθόδους.`,
        priority: 'medium'
      })
    }

    if (yieldPerTree < 10) {
      recommendations.push({
        type: 'warning',
        category: 'Παραγωγικότητα',
        message: `Η απόδοση ανά δέντρο (${yieldPerTree.toFixed(1)} kg) είναι χαμηλή. Εξετάστε βελτίωση φροντίδας δέντρων.`,
        priority: 'high'
      })
    }

    if (profitMargin > 50) {
      recommendations.push({
        type: 'success',
        category: 'Επιτυχία',
        message: `Εξαιρετικό περιθώριο κέρδους ${profitMargin.toFixed(1)}%! Συνεχίστε τις τρέχουσες πρακτικές.`,
        priority: 'low'
      })
    }

    if (totalActivities === 0) {
      recommendations.push({
        type: 'info',
        category: 'Δραστηριότητες',
        message: 'Δεν έχετε καταγράψει δραστηριότητες. Ξεκινήστε να καταγράφετε για καλύτερη ανάλυση.',
        priority: 'high'
      })
    }

    // Seasonal Pattern Analysis
    const seasonalData = {
      winter: { activities: 0, costs: 0 }, // Δεκ, Ιαν, Φεβ
      spring: { activities: 0, costs: 0 }, // Μαρ, Απρ, Μαι
      summer: { activities: 0, costs: 0 }, // Ιουν, Ιουλ, Αυγ
      autumn: { activities: 0, costs: 0 }  // Σεπ, Οκτ, Νοε
    }

    farms.forEach(farm => {
      farm.activities.forEach((activity: ActivityData) => {
        const month = new Date(activity.date).getMonth() + 1
        if ([12, 1, 2].includes(month)) {
          seasonalData.winter.activities += 1
          seasonalData.winter.costs += activity.cost || 0
        } else if ([3, 4, 5].includes(month)) {
          seasonalData.spring.activities += 1
          seasonalData.spring.costs += activity.cost || 0
        } else if ([6, 7, 8].includes(month)) {
          seasonalData.summer.activities += 1
          seasonalData.summer.costs += activity.cost || 0
        } else if ([9, 10, 11].includes(month)) {
          seasonalData.autumn.activities += 1
          seasonalData.autumn.costs += activity.cost || 0
        }
      })
    })

    return NextResponse.json({
      summary: {
        totalFarms,
        totalTrees,
        totalArea,
        totalActivities,
        totalCosts,
        totalHarvestValue,
        yieldTrend,
        totalYield,
        netProfit: totalHarvestValue - totalCosts
      },
      efficiencyMetrics: {
        roi,
        costPerKg,
        yieldPerTree,
        avgYieldPerStremma,
        profitMargin
      },
      harvestData,
      activityData,
      monthlyActivityData,
      farmComparisonData,
      costBreakdown,
      profitabilityTimeline,
      yearOverYearComparison,
      farmPerformance: {
        all: farmPerformance,
        best: bestPerformingFarm,
        worst: worstPerformingFarm,
        mostEfficient: mostEfficientFarm
      },
      activityHeatmapData,
      recommendations,
      seasonalData
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
