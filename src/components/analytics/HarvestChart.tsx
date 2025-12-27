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
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis
            yAxisId="left"
            stroke="#2E7D32"
            fontSize={12}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}t`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#1976D2"
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
            stroke="#2E7D32"
            strokeWidth={3}
            dot={{ fill: '#2E7D32', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="totalValue"
            stroke="#1976D2"
            strokeWidth={3}
            dot={{ fill: '#1976D2', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
