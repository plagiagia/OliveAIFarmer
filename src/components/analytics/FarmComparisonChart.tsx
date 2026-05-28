'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { CHART, TOOLTIP_STYLE } from './chartColors'

interface FarmComparisonData {
  farmName: string
  totalArea: number
  treeCount: number
  totalYield: number
  yieldPerStremma: number
}

interface FarmComparisonChartProps {
  data: FarmComparisonData[]
  title?: string
}

export function FarmComparisonChart({ data, title = 'Σύγκριση Ελαιώνων' }: FarmComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Δεν υπάρχουν δεδομένα για σύγκριση
        </div>
      </div>
    )
  }

  // Truncate farm names for display
  const chartData = data.map(farm => ({
    ...farm,
    name: farm.farmName.length > 15 ? farm.farmName.slice(0, 15) + '...' : farm.farmName
  }))

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
          <XAxis
            dataKey="name"
            stroke={CHART.axis}
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            yAxisId="left"
            stroke={CHART.revenue}
            fontSize={12}
            tickFormatter={(value) => `${value} kg/στρ`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke={CHART.costs}
            fontSize={12}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => {
              const numValue = Number(value) || 0
              if (name === 'yieldPerStremma') return [`${numValue.toFixed(1)} kg/στρέμμα`, 'Απόδοση/Στρέμμα']
              if (name === 'treeCount') return [numValue, 'Δέντρα']
              return [numValue, String(name)]
            }}
          />
          <Legend
            formatter={(value) => {
              if (value === 'yieldPerStremma') return 'Απόδοση (kg/στρ)'
              if (value === 'treeCount') return 'Αριθμός Δέντρων'
              return value
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="yieldPerStremma"
            fill={CHART.revenue}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="treeCount"
            fill={CHART.costsLight}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
