'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  TreeDeciduous,
  MapPin,
  Activity,
  TrendingUp,
  Euro,
  Scale,
  Wallet
} from 'lucide-react'
import {
  HarvestChart,
  ActivityChart,
  FarmComparisonChart,
  MonthlyActivityChart,
  StatsCard,
  CostBreakdownChart,
  ProfitabilityChart,
  YearOverYearComparison,
  EfficiencyMetrics,
  FarmPerformanceHighlights,
  ActivityHeatmap,
  Recommendations
} from '@/components/analytics'
import { SkeletonChart, SkeletonStats } from '@/components/ui/Skeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ExportDropdown } from '@/components/export/ExportButton'
import {
  exportToCSV,
  farmExportColumns,
  harvestExportColumns,
  activityExportColumns,
  type FarmExportData,
  type HarvestExportData,
  type ActivityExportData
} from '@/lib/export/csv'

interface AnalyticsData {
  summary: {
    totalFarms: number
    totalTrees: number
    totalArea: number
    totalActivities: number
    totalCosts: number
    totalHarvestValue: number
    totalYield: number
    netProfit: number
    yieldTrend: { value: number; isPositive: boolean } | null
  }
  efficiencyMetrics: {
    roi: number
    costPerKg: number
    yieldPerTree: number
    avgYieldPerStremma: number
    profitMargin: number
  }
  harvestData: Array<{
    year: number
    totalYield: number
    totalValue: number
    yieldPerStremma: number
  }>
  activityData: Array<{
    type: string
    typeLabel: string
    count: number
    totalCost: number
    totalDuration: number
  }>
  monthlyActivityData: Array<{
    month: string
    monthNumber: number
    activities: number
    costs: number
  }>
  farmComparisonData: Array<{
    farmName: string
    totalArea: number
    treeCount: number
    totalYield: number
    yieldPerStremma: number
  }>
  costBreakdown: Array<{
    type: string
    typeLabel: string
    cost: number
    percentage: number
  }>
  profitabilityTimeline: Array<{
    year: number
    revenue: number
    costs: number
    profit: number
  }>
  yearOverYearComparison: {
    currentYear: number
    previousYear: number
    yieldChange: number
    revenueChange: number
    costChange: number
    activityChange: number
  } | null
  farmPerformance: {
    all: Array<{
      farmId: string
      farmName: string
      totalYield: number
      revenue: number
      costs: number
      profit: number
      roi: number
      yieldPerStremma: number
      yieldPerTree: number
      efficiency: number
    }>
    best: {
      farmId: string
      farmName: string
      totalYield: number
      revenue: number
      costs: number
      profit: number
      roi: number
      yieldPerStremma: number
      yieldPerTree: number
      efficiency: number
    } | null
    worst: {
      farmId: string
      farmName: string
      totalYield: number
      revenue: number
      costs: number
      profit: number
      roi: number
      yieldPerStremma: number
      yieldPerTree: number
      efficiency: number
    } | null
    mostEfficient: {
      farmId: string
      farmName: string
      totalYield: number
      revenue: number
      costs: number
      profit: number
      roi: number
      yieldPerStremma: number
      yieldPerTree: number
      efficiency: number
    } | null
  }
  activityHeatmapData: Array<{
    date: string
    count: number
  }>
  recommendations: Array<{
    type: 'success' | 'warning' | 'info' | 'error'
    category: string
    message: string
    priority: 'high' | 'medium' | 'low'
  }>
  seasonalData: {
    winter: { activities: number; costs: number }
    spring: { activities: number; costs: number }
    summer: { activities: number; costs: number }
    autumn: { activities: number; costs: number }
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/analytics')
        if (!response.ok) {
          throw new Error('Failed to fetch analytics')
        }
        const analyticsData = await response.json()
        setData(analyticsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Σφάλμα φόρτωσης')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-10 w-40 bg-gray-200 rounded-xl animate-pulse mb-4" />
            <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <SkeletonStats />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <SkeletonChart />
            <SkeletonChart />
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="text-olive-600 hover:text-olive-700 font-medium"
          >
            Επιστροφή στον πίνακα ελέγχου
          </Link>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const {
    summary,
    efficiencyMetrics,
    harvestData,
    activityData,
    monthlyActivityData,
    farmComparisonData,
    costBreakdown,
    profitabilityTimeline,
    yearOverYearComparison,
    farmPerformance,
    activityHeatmapData,
    recommendations
  } = data

  // Export handlers
  const handleExportFarms = async () => {
    const response = await fetch('/api/export?type=farms')
    const { data: farms } = await response.json()
    exportToCSV<FarmExportData>(farms, farmExportColumns, `ελαιώνες_${new Date().toISOString().split('T')[0]}`)
  }

  const handleExportHarvests = async () => {
    const response = await fetch('/api/export?type=harvests')
    const { data: harvests } = await response.json()
    exportToCSV<HarvestExportData>(harvests, harvestExportColumns, `συγκομιδές_${new Date().toISOString().split('T')[0]}`)
  }

  const handleExportActivities = async () => {
    const response = await fetch('/api/export?type=activities')
    const { data: activities } = await response.json()
    exportToCSV<ActivityExportData>(activities, activityExportColumns, `δραστηριότητες_${new Date().toISOString().split('T')[0]}`)
  }

  const exportOptions = [
    { label: 'Ελαιώνες', onExport: handleExportFarms },
    { label: 'Συγκομιδές', onExport: handleExportHarvests },
    { label: 'Δραστηριότητες', onExport: handleExportActivities },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Πίνακας Ελέγχου</span>
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Αναλύσεις & Στατιστικά</h1>
              <p className="text-gray-600">Εξελιγμένη ανάλυση για όλους τους ελαιώνες σας</p>
            </div>
            <ExportDropdown
              options={exportOptions}
              label="Εξαγωγή CSV"
            />
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <StatsCard
            title="Ελαιώνες"
            value={summary.totalFarms}
            icon={MapPin}
            color="green"
          />
          <StatsCard
            title="Δέντρα"
            value={summary.totalTrees.toLocaleString('el-GR')}
            icon={TreeDeciduous}
            color="green"
          />
          <StatsCard
            title="Έκταση"
            value={`${summary.totalArea.toFixed(1)} στρ.`}
            icon={Scale}
            color="blue"
          />
          <StatsCard
            title="Δραστηριότητες"
            value={summary.totalActivities}
            icon={Activity}
            color="purple"
          />
          <StatsCard
            title="Έσοδα"
            value={`€${summary.totalHarvestValue.toLocaleString('el-GR')}`}
            icon={Euro}
            color="green"
            trend={summary.yieldTrend || undefined}
          />
          <StatsCard
            title="Έξοδα"
            value={`€${summary.totalCosts.toLocaleString('el-GR')}`}
            icon={TrendingUp}
            color="amber"
          />
          <StatsCard
            title="Καθαρό Κέρδος"
            value={`€${summary.netProfit.toLocaleString('el-GR')}`}
            icon={Wallet}
            color={summary.netProfit >= 0 ? 'green' : 'red'}
          />
        </div>

        {/* Recommendations Section */}
        {recommendations && recommendations.length > 0 && (
          <div className="mb-8">
            <ErrorBoundary>
              <Recommendations data={recommendations} />
            </ErrorBoundary>
          </div>
        )}

        {/* Efficiency Metrics */}
        <div className="mb-8">
          <ErrorBoundary>
            <EfficiencyMetrics data={efficiencyMetrics} />
          </ErrorBoundary>
        </div>

        {/* Farm Performance Highlights */}
        {summary.totalFarms > 1 && (
          <div className="mb-8">
            <ErrorBoundary>
              <FarmPerformanceHighlights data={farmPerformance} />
            </ErrorBoundary>
          </div>
        )}

        {/* Year over Year Comparison */}
        {yearOverYearComparison && (
          <div className="mb-8">
            <ErrorBoundary>
              <YearOverYearComparison data={yearOverYearComparison} />
            </ErrorBoundary>
          </div>
        )}

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ErrorBoundary>
            <ProfitabilityChart
              data={profitabilityTimeline}
              title="Κερδοφορία ανά Έτος"
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <HarvestChart
              data={harvestData}
              title="Παραγωγή & Αξία ανά Έτος"
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <CostBreakdownChart
              data={costBreakdown}
              title="Κατανομή Κόστους ανά Δραστηριότητα"
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <ActivityChart
              data={activityData}
              title="Δραστηριότητες ανά Τύπο"
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <MonthlyActivityChart
              data={monthlyActivityData}
              title={`Μηνιαία Δραστηριότητα & Κόστος ${new Date().getFullYear()}`}
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <ActivityHeatmap
              data={activityHeatmapData}
              title="Ένταση Δραστηριοτήτων"
            />
          </ErrorBoundary>

          {summary.totalFarms > 1 && (
            <ErrorBoundary>
              <FarmComparisonChart
                data={farmComparisonData}
                title="Σύγκριση Απόδοσης Ελαιώνων"
              />
            </ErrorBoundary>
          )}
        </div>

        {/* Additional Detailed Insights */}
        {summary.totalFarms > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Λεπτομερή Στοιχεία</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Basic Metrics */}
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Μέση έκταση ανά ελαιώνα</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(summary.totalArea / summary.totalFarms).toFixed(1)} <span className="text-base font-normal text-gray-600">στρ.</span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Μέσος αριθμός δέντρων ανά ελαιώνα</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(summary.totalTrees / summary.totalFarms)} <span className="text-base font-normal text-gray-600">δέντρα</span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Συνολική παραγωγή</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary.totalYield.toLocaleString('el-GR')} <span className="text-base font-normal text-gray-600">kg</span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Περιθώριο κέρδους</p>
                <p className={`text-2xl font-bold ${
                  efficiencyMetrics.profitMargin >= 40 ? 'text-green-600' :
                  efficiencyMetrics.profitMargin >= 20 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {efficiencyMetrics.profitMargin.toFixed(1)}%
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Κόστος ανά κιλό</p>
                <p className={`text-2xl font-bold ${
                  efficiencyMetrics.costPerKg < 1.5 ? 'text-green-600' :
                  efficiencyMetrics.costPerKg < 2.5 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  €{efficiencyMetrics.costPerKg.toFixed(2)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Απόδοση ανά δέντρο</p>
                <p className={`text-2xl font-bold ${
                  efficiencyMetrics.yieldPerTree > 20 ? 'text-green-600' :
                  efficiencyMetrics.yieldPerTree > 10 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {efficiencyMetrics.yieldPerTree.toFixed(1)} <span className="text-base font-normal text-gray-600">kg</span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Απόδοση ανά στρέμμα</p>
                <p className={`text-2xl font-bold ${
                  efficiencyMetrics.avgYieldPerStremma > 150 ? 'text-green-600' :
                  efficiencyMetrics.avgYieldPerStremma > 100 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {efficiencyMetrics.avgYieldPerStremma.toFixed(0)} <span className="text-base font-normal text-gray-600">kg</span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">ROI (Απόδοση Επένδυσης)</p>
                <p className={`text-2xl font-bold ${
                  efficiencyMetrics.roi > 30 ? 'text-green-600' :
                  efficiencyMetrics.roi > 15 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {efficiencyMetrics.roi.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Τελευταία ενημέρωση: {new Date().toLocaleString('el-GR')}</p>
          <p className="mt-1">Όλες οι μετρήσεις υπολογίζονται αυτόματα με βάση τα δεδομένα σας</p>
        </div>
      </div>
    </div>
  )
}
