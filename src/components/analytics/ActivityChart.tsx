'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

interface ActivityData {
  type: string
  typeLabel: string
  count: number
  totalCost: number
  totalDuration: number
}

interface ActivityChartProps {
  data: ActivityData[]
  title?: string
}

const ACTIVITY_COLORS: Record<string, string> = {
  WATERING: '#2196F3',
  PRUNING: '#4CAF50',
  FERTILIZING: '#8BC34A',
  PEST_CONTROL: '#FF9800',
  SOIL_WORK: '#795548',
  HARVESTING: '#9C27B0',
  MAINTENANCE: '#607D8B',
  INSPECTION: '#00BCD4',
  OTHER: '#9E9E9E',
}

export function ActivityChart({ data, title = 'Δραστηριότητες ανά Τύπο' }: ActivityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Δεν υπάρχουν δεδομένα δραστηριοτήτων
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#6b7280" fontSize={12} />
          <YAxis
            type="category"
            dataKey="typeLabel"
            stroke="#6b7280"
            fontSize={12}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name, props) => {
              const payload = props?.payload as ActivityData | undefined
              if (!payload) return [Number(value) || 0, String(name)]
              return [
                <div key="tooltip" className="space-y-1">
                  <div>Αριθμός: <strong>{payload.count}</strong></div>
                  {payload.totalCost > 0 && (
                    <div>Κόστος: <strong>€{payload.totalCost.toLocaleString('el-GR')}</strong></div>
                  )}
                  {payload.totalDuration > 0 && (
                    <div>Διάρκεια: <strong>{Math.round(payload.totalDuration / 60)} ώρες</strong></div>
                  )}
                </div>,
                ''
              ]
            }}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={ACTIVITY_COLORS[entry.type] || ACTIVITY_COLORS.OTHER}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
