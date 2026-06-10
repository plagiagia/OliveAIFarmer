'use client'

import {
  AnalyticsSummaryHero,
  CostBreakdownChart,
  HarvestChart,
  ProfitabilityChart,
  StatsCard
} from '@/components/analytics'
import { ExportDropdown } from '@/components/export/ExportButton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { SkeletonChart, SkeletonStats } from '@/components/ui/Skeleton'
import {
  activityExportColumns,
  exportToCSV,
  farmExportColumns,
  harvestExportColumns,
  type ActivityExportData,
  type FarmExportData,
  type HarvestExportData
} from '@/lib/export/csv'
import {
  ArrowLeft,
  MapPin,
  Package,
  Scale,
  TreeDeciduous
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

function formatHarvestKg(kg: number): { display: string; full: string } {
  const full = `${kg.toLocaleString('el-GR')} kg`
  if (kg >= 1000) {
    const display = `${(kg / 1000).toLocaleString('el-GR', { maximumFractionDigits: 1 })} τ.`
    return { display, full }
  }
  return { display: full, full }
}

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
    costBreakdown,
    profitabilityTimeline,
    yearOverYearComparison
  } = data

  const harvestKg = formatHarvestKg(summary.totalYield)

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Πίνακας Ελέγχου</span>
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Η Χρονιά μου</h1>
              <p className="text-sm sm:text-base text-gray-600">
                {summary.totalFarms === 1
                  ? 'Παραγωγή, έσοδα και κόστος για 1 ελαιώνα'
                  : `Παραγωγή, έσοδα και κόστος για ${summary.totalFarms} ελαιώνες`}
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <ExportDropdown
                options={exportOptions}
                label="Εξαγωγή"
              />
            </div>
          </div>
        </div>

        {/* The money answer: profit, revenue, costs, vs. last year */}
        <AnalyticsSummaryHero
          netProfit={summary.netProfit}
          totalHarvestValue={summary.totalHarvestValue}
          totalCosts={summary.totalCosts}
          profitMargin={efficiencyMetrics.profitMargin}
          profitabilityTimeline={profitabilityTimeline}
          yearOverYearComparison={yearOverYearComparison}
        />

        {/* Inventory counts */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <StatsCard title="Ελαιώνες" value={summary.totalFarms} icon={MapPin} />
          <StatsCard
            title="Δέντρα"
            value={summary.totalTrees.toLocaleString('el-GR')}
            icon={TreeDeciduous}
          />
          <StatsCard
            title="Έκταση"
            value={`${summary.totalArea.toFixed(1)} στρ.`}
            icon={Scale}
          />
          <StatsCard
            title="Συγκομιδή"
            value={harvestKg.display}
            valueTitle={harvestKg.full}
            icon={Package}
            trend={summary.yieldTrend || undefined}
          />
        </div>

        {/* Charts: profitability per year, yield per year, where the money went */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ErrorBoundary>
            <ProfitabilityChart
              data={profitabilityTimeline}
              title="Κερδοφορία ανά Έτος"
            />
          </ErrorBoundary>
          <ErrorBoundary>
            <HarvestChart data={harvestData} title="Παραγωγή & Αξία ανά Έτος" />
          </ErrorBoundary>
        </div>

        <div className="mb-8">
          <ErrorBoundary>
            <CostBreakdownChart data={costBreakdown} title="Πού πήγαν τα χρήματα" />
          </ErrorBoundary>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Τελευταία ενημέρωση: {new Date().toLocaleString('el-GR')}</p>
          <p className="mt-1">Όλες οι μετρήσεις υπολογίζονται αυτόματα με βάση τα δεδομένα σας</p>
        </div>
      </div>
    </div>
  )
}
