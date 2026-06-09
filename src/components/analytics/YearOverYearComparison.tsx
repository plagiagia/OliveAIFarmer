'use client'

import OliveIcon from '@/components/ui/OliveIcon'
import { cn } from '@/lib/utils'
import { Activity, Euro, Minus, TrendingDown, TrendingUp, Wallet } from 'lucide-react'

interface YearOverYearData {
  currentYear: number
  previousYear: number
  yieldChange: number
  revenueChange: number
  costChange: number
  activityChange: number
}

interface YearOverYearComparisonProps {
  data: YearOverYearData | null
  title?: string
}

function trendMeta(change: number, inverse = false) {
  const isNeutral = Math.abs(change) < 1
  const isPositive = inverse ? change < 0 : change > 0
  return { isNeutral, isPositive }
}

export function YearOverYearComparison({ data, title = 'Σύγκριση Ετών' }: YearOverYearComparisonProps) {
  if (!data) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex h-48 items-center justify-center text-gray-500">
          Χρειάζονται δεδομένα τουλάχιστον 2 ετών για σύγκριση
        </div>
      </div>
    )
  }

  const metrics = [
    {
      label: 'Παραγωγή',
      change: data.yieldChange,
      icon: 'olive' as const,
      inverse: false
    },
    {
      label: 'Έσοδα',
      change: data.revenueChange,
      icon: Euro,
      inverse: false
    },
    {
      label: 'Έξοδα',
      change: data.costChange,
      icon: Wallet,
      inverse: true
    },
    {
      label: 'Δραστηριότητες',
      change: data.activityChange,
      icon: Activity,
      inverse: false
    }
  ]

  const positiveTrend =
    data.yieldChange > 0 && data.revenueChange > 0
  const negativeTrend = data.yieldChange < 0 || data.revenueChange < 0

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">
        <span className="font-medium text-olive-800">{data.currentYear}</span>
        {' vs '}
        <span className="font-medium text-gray-700">{data.previousYear}</span>
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((metric) => {
          const { isNeutral, isPositive } = trendMeta(metric.change, metric.inverse)
          const Icon = metric.icon === 'olive' ? null : metric.icon

          return (
            <div
              key={metric.label}
              className="rounded-xl border border-gray-100 bg-gray-50/80 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                {metric.icon === 'olive' ? (
                  <OliveIcon size="md" className="text-gray-600" />
                ) : Icon ? (
                  <Icon className="h-5 w-5 text-gray-500" aria-hidden />
                ) : null}
                <span
                  className={cn(
                    'flex items-center',
                    isNeutral && 'text-gray-500',
                    !isNeutral && isPositive && 'text-olive-700',
                    !isNeutral && !isPositive && 'text-red-600'
                  )}
                >
                  {isNeutral ? (
                    <Minus className="h-4 w-4" aria-hidden />
                  ) : isPositive ? (
                    <TrendingUp className="h-4 w-4" aria-hidden />
                  ) : (
                    <TrendingDown className="h-4 w-4" aria-hidden />
                  )}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600">{metric.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
                {Math.abs(metric.change).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                {metric.change > 0 ? 'αύξηση' : metric.change < 0 ? 'μείωση' : 'σταθερό'}
              </p>
            </div>
          )
        })}
      </div>

      <p className="mt-6 border-t border-gray-100 pt-4 text-center text-sm text-gray-600">
        {positiveTrend && (
          <>
            <span className="font-medium text-olive-800">Θετική πορεία.</span> Αύξηση σε παραγωγή
            και έσοδα.
          </>
        )}
        {negativeTrend && !positiveTrend && (
          <>
            <span className="font-medium text-gray-900">Προσοχή.</span> Μείωση στην απόδοση ή στα
            έσοδα.
          </>
        )}
        {!positiveTrend && !negativeTrend && (
          <span className="font-medium text-gray-700">Σταθερή πορεία σε σχέση με το προηγούμενο έτος.</span>
        )}
      </p>
    </div>
  )
}
