'use client'

import { ActivityChart } from './ActivityChart'
import { ActivityHeatmap } from './ActivityHeatmap'
import { CostBreakdownChart } from './CostBreakdownChart'
import { FarmComparisonChart } from './FarmComparisonChart'
import { FarmPerformanceHighlights } from './FarmPerformanceHighlights'
import { MonthlyActivityChart } from './MonthlyActivityChart'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { cn } from '@/lib/utils'
import { Activity, Coins, MapPin } from 'lucide-react'
import { useState } from 'react'

type TabId = 'costs' | 'activities' | 'farms'

interface ActivityDatum {
  type: string
  typeLabel: string
  count: number
  totalCost: number
  totalDuration: number
}

interface MonthlyActivityDatum {
  month: string
  monthNumber: number
  activities: number
  costs: number
}

interface CostBreakdownDatum {
  type: string
  typeLabel: string
  cost: number
  percentage: number
  [key: string]: string | number
}

interface FarmComparisonDatum {
  farmName: string
  totalArea: number
  treeCount: number
  totalYield: number
  yieldPerStremma: number
}

interface FarmPerformance {
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
}

interface FarmPerformanceData {
  best: FarmPerformance | null
  worst: FarmPerformance | null
  mostEfficient: FarmPerformance | null
}

interface AnalyticsChartsTabsProps {
  activityData: ActivityDatum[]
  monthlyActivityData: MonthlyActivityDatum[]
  costBreakdown: CostBreakdownDatum[]
  activityHeatmapData: Array<{ date: string; count: number }>
  farmComparisonData: FarmComparisonDatum[]
  farmPerformance: FarmPerformanceData
  showFarmsTab: boolean
  currentYear: number
}

export function AnalyticsChartsTabs({
  activityData,
  monthlyActivityData,
  costBreakdown,
  activityHeatmapData,
  farmComparisonData,
  farmPerformance,
  showFarmsTab,
  currentYear
}: AnalyticsChartsTabsProps) {
  const tabs: Array<{ id: TabId; label: string; icon: typeof Coins }> = [
    { id: 'costs', label: 'Κόστη', icon: Coins },
    { id: 'activities', label: 'Δραστηριότητες', icon: Activity }
  ]
  if (showFarmsTab) {
    tabs.push({ id: 'farms', label: 'Ελαιώνες', icon: MapPin })
  }

  const [activeTab, setActiveTab] = useState<TabId>('costs')

  const resolvedTab = tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0].id

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 sm:px-6">
        <p className="pt-5 text-lg font-semibold text-gray-900">Λεπτομερή γραφήματα</p>
        <p className="pb-3 text-sm text-gray-500">Επιλέξτε κατηγορία για περαιτέρω ανάλυση</p>
        <div
          className="-mb-px flex gap-1 overflow-x-auto scrollbar-hide sm:gap-4"
          role="tablist"
          aria-label="Κατηγορίες γραφημάτων"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = resolvedTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors sm:px-1 sm:py-4',
                  isActive
                    ? 'border-olive-600 text-olive-800'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-4 sm:p-6" role="tabpanel">
        {resolvedTab === 'costs' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ErrorBoundary>
              <CostBreakdownChart
                data={costBreakdown}
                title="Κατανομή Κόστους ανά Δραστηριότητα"
              />
            </ErrorBoundary>
            <ErrorBoundary>
              <MonthlyActivityChart
                data={monthlyActivityData}
                title={`Μηνιαία Δραστηριότητα & Κόστος ${currentYear}`}
              />
            </ErrorBoundary>
          </div>
        )}

        {resolvedTab === 'activities' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ErrorBoundary>
              <ActivityChart data={activityData} title="Δραστηριότητες ανά Τύπο" />
            </ErrorBoundary>
            <ErrorBoundary>
              <ActivityHeatmap data={activityHeatmapData} title="Ένταση Δραστηριοτήτων" />
            </ErrorBoundary>
          </div>
        )}

        {resolvedTab === 'farms' && showFarmsTab && (
          <div className="space-y-6">
            <ErrorBoundary>
              <FarmPerformanceHighlights data={farmPerformance} />
            </ErrorBoundary>
            <ErrorBoundary>
              <FarmComparisonChart
                data={farmComparisonData}
                title="Σύγκριση Απόδοσης Ελαιώνων"
              />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  )
}
