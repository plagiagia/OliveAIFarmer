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
import { ACTIVITY_CHART_COLORS, CHART, TOOLTIP_STYLE } from './chartColors'

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
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
          <XAxis type="number" stroke={CHART.axis} fontSize={12} />
          <YAxis
            type="category"
            dataKey="typeLabel"
            stroke={CHART.axis}
            fontSize={12}
            width={90}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
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
                fill={ACTIVITY_CHART_COLORS[entry.type] || ACTIVITY_CHART_COLORS.OTHER}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
