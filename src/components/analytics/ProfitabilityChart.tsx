'use client'

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

interface ProfitabilityData {
  year: number
  revenue: number
  costs: number
  profit: number
}

interface ProfitabilityChartProps {
  data: ProfitabilityData[]
  title?: string
}

export function ProfitabilityChart({ data, title = 'Κερδοφορία ανά Έτος' }: ProfitabilityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Δεν υπάρχουν δεδομένα κερδοφορίας
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => `€${(value / 1000).toFixed(0)}k`

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ value: number; name: string; color: string }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      const revenue = payload.find(p => p.name === 'revenue')?.value || 0
      const costs = payload.find(p => p.name === 'costs')?.value || 0
      const profit = payload.find(p => p.name === 'profit')?.value || 0

      return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">Έτος {label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-green-600">Έσοδα:</span>
              <strong>€{revenue.toLocaleString('el-GR')}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-orange-600">Έξοδα:</span>
              <strong>€{costs.toLocaleString('el-GR')}</strong>
            </div>
            <div className="border-t border-gray-200 my-1" />
            <div className="flex justify-between gap-4">
              <span className={profit >= 0 ? 'text-blue-600' : 'text-red-600'}>Κέρδος:</span>
              <strong className={profit >= 0 ? 'text-blue-600' : 'text-red-600'}>
                €{profit.toLocaleString('el-GR')}
              </strong>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => {
              if (value === 'revenue') return 'Έσοδα'
              if (value === 'costs') return 'Έξοδα'
              if (value === 'profit') return 'Κέρδος'
              return value
            }}
          />
          <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
          <Bar
            dataKey="revenue"
            fill="#4CAF50"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="costs"
            fill="#FF9800"
            radius={[4, 4, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="#1976D2"
            strokeWidth={3}
            dot={{ fill: '#1976D2', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
