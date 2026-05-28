'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { CHART, TOOLTIP_STYLE } from './chartColors'

interface HarvestData {
  year: number
  totalYield: number
  totalValue: number
  yieldPerStremma?: number
}

interface HarvestChartProps {
  data: HarvestData[]
  title?: string
}

export function HarvestChart({ data, title = 'Παραγωγή ανά Έτος' }: HarvestChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Δεν υπάρχουν δεδομένα συγκομιδής
        </div>
      </div>
    )
  }

  const formatYield = (value: number) => `${value.toLocaleString('el-GR')} kg`
  const formatValue = (value: number) => `€${value.toLocaleString('el-GR')}`

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
          <XAxis
            dataKey="year"
            stroke={CHART.axis}
            fontSize={12}
          />
          <YAxis
            yAxisId="left"
            stroke={CHART.revenue}
            fontSize={12}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}t`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke={CHART.costs}
            fontSize={12}
            tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => {
              const numValue = Number(value) || 0
              if (name === 'totalYield') return [formatYield(numValue), 'Παραγωγή']
              if (name === 'totalValue') return [formatValue(numValue), 'Αξία']
              return [numValue, String(name)]
            }}
            labelFormatter={(label) => `Έτος ${label}`}
          />
          <Legend
            formatter={(value) => {
              if (value === 'totalYield') return 'Παραγωγή (kg)'
              if (value === 'totalValue') return 'Αξία (€)'
              return value
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="totalYield"
            stroke={CHART.revenue}
            strokeWidth={3}
            dot={{ fill: CHART.revenue, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="totalValue"
            stroke={CHART.costs}
            strokeWidth={3}
            dot={{ fill: CHART.costs, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
