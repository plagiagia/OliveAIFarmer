'use client'

import { Calendar } from 'lucide-react'

interface HeatmapData {
  date: string
  count: number
}

interface ActivityHeatmapProps {
  data: HeatmapData[]
  title?: string
}

export function ActivityHeatmap({ data, title = 'Ένταση Δραστηριοτήτων' }: ActivityHeatmapProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Δεν υπάρχουν δεδομένα δραστηριότητας
        </div>
      </div>
    )
  }

  // Get max count for color scaling
  const maxCount = Math.max(...data.map(d => d.count))

  // Get current year
  const currentYear = new Date().getFullYear()

  // Group by month
  const monthlyActivity: Record<number, number> = {}
  data.forEach(item => {
    const date = new Date(item.date)
    if (date.getFullYear() === currentYear) {
      const month = date.getMonth()
      monthlyActivity[month] = (monthlyActivity[month] || 0) + item.count
    }
  })

  const months = [
    'Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαι', 'Ιουν',
    'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'
  ]

  const getIntensityColor = (count: number) => {
    if (count === 0) return 'bg-gray-100'
    const intensity = count / maxCount
    if (intensity > 0.75) return 'bg-green-600'
    if (intensity > 0.5) return 'bg-green-500'
    if (intensity > 0.25) return 'bg-green-400'
    return 'bg-green-300'
  }

  const maxMonthlyCount = Math.max(...Object.values(monthlyActivity), 1)

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-3">
        {months.map((month, index) => {
          const count = monthlyActivity[index] || 0
          const percentage = maxMonthlyCount > 0 ? (count / maxMonthlyCount) * 100 : 0

          return (
            <div key={index} className="flex items-center gap-3">
              <div className="w-12 text-sm font-medium text-gray-600">
                {month}
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getIntensityColor(count)}`}
                  style={{ width: `${Math.max(percentage, count > 0 ? 5 : 0)}%` }}
                />
                {count > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-white mix-blend-difference">
                      {count} {count === 1 ? 'δραστηριότητα' : 'δραστηριότητες'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Λιγότερες</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-gray-100 rounded" />
            <div className="w-4 h-4 bg-green-300 rounded" />
            <div className="w-4 h-4 bg-green-400 rounded" />
            <div className="w-4 h-4 bg-green-500 rounded" />
            <div className="w-4 h-4 bg-green-600 rounded" />
          </div>
          <span>Περισσότερες</span>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 bg-olive-50 rounded-xl p-3">
        <p className="text-sm text-olive-800">
          <strong>Συνολικές δραστηριότητες {currentYear}:</strong>{' '}
          {Object.values(monthlyActivity).reduce((sum, count) => sum + count, 0)}
        </p>
      </div>
    </div>
  )
}
