'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

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

export function YearOverYearComparison({ data, title = 'Σύγκριση Ετών' }: YearOverYearComparisonProps) {
  if (!data) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Χρειάζονται δεδομένα τουλάχιστον 2 ετών για σύγκριση
        </div>
      </div>
    )
  }

  const metrics = [
    {
      label: 'Παραγωγή',
      change: data.yieldChange,
      icon: '🫒'
    },
    {
      label: 'Έσοδα',
      change: data.revenueChange,
      icon: '💰'
    },
    {
      label: 'Έξοδα',
      change: data.costChange,
      icon: '💸',
      inverse: true // Lower is better
    },
    {
      label: 'Δραστηριότητες',
      change: data.activityChange,
      icon: '📊'
    }
  ]

  const getTrendIcon = (change: number, inverse = false) => {
    const isPositive = inverse ? change < 0 : change > 0
    const isNeutral = Math.abs(change) < 1

    if (isNeutral) {
      return <Minus className="w-5 h-5" />
    }
    return isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />
  }

  const getTrendColor = (change: number, inverse = false) => {
    const isPositive = inverse ? change < 0 : change > 0
    const isNeutral = Math.abs(change) < 1

    if (isNeutral) return 'text-gray-500 bg-gray-50'
    return isPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600">
          Σύγκριση: <span className="font-semibold text-olive-700">{data.currentYear}</span> vs <span className="font-semibold text-gray-700">{data.previousYear}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => {
          const colorClass = getTrendColor(metric.change, metric.inverse)

          return (
            <div
              key={index}
              className={`p-4 rounded-xl ${colorClass} transition-all duration-200`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{metric.icon}</span>
                <div className={colorClass}>
                  {getTrendIcon(metric.change, metric.inverse)}
                </div>
              </div>
              <p className="text-sm font-medium mb-1">{metric.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {Math.abs(metric.change).toFixed(1)}%
                </span>
                <span className="text-xs">
                  {metric.change > 0 ? 'αύξηση' : metric.change < 0 ? 'μείωση' : 'σταθερό'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          {data.yieldChange > 0 && data.revenueChange > 0 ? (
            <>
              <span className="text-green-600 font-semibold">📈 Θετική πορεία!</span>
              <span>Αύξηση σε παραγωγή και έσοδα</span>
            </>
          ) : data.yieldChange < 0 || data.revenueChange < 0 ? (
            <>
              <span className="text-orange-600 font-semibold">⚠️ Προσοχή:</span>
              <span>Μείωση στην απόδοση</span>
            </>
          ) : (
            <>
              <span className="text-gray-600 font-semibold">➡️ Σταθερή πορεία</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
