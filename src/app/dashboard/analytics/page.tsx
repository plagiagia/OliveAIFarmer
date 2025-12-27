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
  Scale
} from 'lucide-react'
import {
  HarvestChart,
  ActivityChart,
  FarmComparisonChart,
  MonthlyActivityChart,
  StatsCard
} from '@/components/analytics'
import { SkeletonChart, SkeletonStats } from '@/components/ui/Skeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ExportDropdown } from '@/components/export/ExportButton'
import {
  exportToCSV,
  farmExportColumns,
  harvestExportColumns,
  activityExportColumns,
  treeExportColumns,
  type FarmExportData,
  type HarvestExportData,
  type ActivityExportData,
  type TreeExportData
} from '@/lib/export/csv'

interface AnalyticsData {
  summary: {
    totalFarms: number
    totalTrees: number
    totalArea: number
    totalActivities: number
    totalCosts: number
    totalHarvestValue: number
    yieldTrend: { value: number; isPositive: boolean } | null
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

  const { summary, harvestData, activityData, monthlyActivityData, farmComparisonData } = data

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

  const handleExportTrees = async () => {
    const response = await fetch('/api/export?type=trees')
    const { data: trees } = await response.json()
    exportToCSV<TreeExportData>(trees, treeExportColumns, `δέντρα_${new Date().toISOString().split('T')[0]}`)
  }

  const exportOptions = [
    { label: 'Ελαιώνες', onExport: handleExportFarms },
    { label: 'Συγκομιδές', onExport: handleExportHarvests },
    { label: 'Δραστηριότητες', onExport: handleExportActivities },
    { label: 'Δέντρα', onExport: handleExportTrees },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-3xl font-bold text-gray-900">Αναλύσεις & Στατιστικά</h1>
              <p className="text-gray-600 mt-1">Συγκεντρωτικά στοιχεία για όλους τους ελαιώνες σας</p>
            </div>
            <ExportDropdown
              options={exportOptions}
              label="Εξαγωγή CSV"
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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
            title="Συνολικά Έσοδα"
            value={`€${summary.totalHarvestValue.toLocaleString('el-GR')}`}
            icon={Euro}
            color="green"
            trend={summary.yieldTrend || undefined}
          />
          <StatsCard
            title="Συνολικά Έξοδα"
            value={`€${summary.totalCosts.toLocaleString('el-GR')}`}
            icon={TrendingUp}
            color="amber"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorBoundary>
            <HarvestChart
              data={harvestData}
              title="Παραγωγή & Αξία ανά Έτος"
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
              title={`Μηνιαία Δραστηριότητα ${new Date().getFullYear()}`}
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <FarmComparisonChart
              data={farmComparisonData}
              title="Σύγκριση Ελαιώνων"
            />
          </ErrorBoundary>
        </div>

        {/* Additional Insights */}
        {summary.totalFarms > 0 && (
          <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Συνοπτικά Στοιχεία</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Μέση έκταση ανά ελαιώνα</p>
                <p className="text-xl font-semibold text-gray-900">
                  {(summary.totalArea / summary.totalFarms).toFixed(1)} στρέμματα
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Μέσος αριθμός δέντρων ανά ελαιώνα</p>
                <p className="text-xl font-semibold text-gray-900">
                  {Math.round(summary.totalTrees / summary.totalFarms)} δέντρα
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Καθαρό κέρδος</p>
                <p className={`text-xl font-semibold ${
                  summary.totalHarvestValue - summary.totalCosts >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  €{(summary.totalHarvestValue - summary.totalCosts).toLocaleString('el-GR')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
