'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface MonthlyData {
  month: string
  monthNumber: number
  activities: number
  costs: number
}

interface MonthlyActivityChartProps {
  data: MonthlyData[]
  title?: string
}

const MONTHS_GR = [
  'Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαι', 'Ιουν',
  'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'
]

export function MonthlyActivityChart({ data, title = 'Μηνιαία Δραστηριότητα' }: MonthlyActivityChartProps) {
  // Ensure we have 12 months of data
  const fullYearData = MONTHS_GR.map((month, index) => {
    const existing = data?.find(d => d.monthNumber === index + 1)
    return {
      month,
      monthNumber: index + 1,
      activities: existing?.activities || 0,
      costs: existing?.costs || 0
    }
  })

  const hasData = fullYearData.some(d => d.activities > 0 || d.costs > 0)

  if (!hasData) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Δεν υπάρχουν δεδομένα δραστηριότητας για αυτό το έτος
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={fullYearData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorActivities" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#2E7D32" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF9800" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#FF9800" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis
            yAxisId="left"
            stroke="#2E7D32"
            fontSize={12}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#FF9800"
            fontSize={12}
            tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => {
              const numValue = Number(value) || 0
              if (name === 'activities') return [numValue, 'Δραστηριότητες']
              if (name === 'costs') return [`€${numValue.toLocaleString('el-GR')}`, 'Κόστος']
              return [numValue, String(name)]
            }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="activities"
            stroke="#2E7D32"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorActivities)"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="costs"
            stroke="#FF9800"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCosts)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
