'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'

interface CostBreakdownData {
  type: string
  typeLabel: string
  cost: number
  percentage: number
  [key: string]: string | number
}

interface CostBreakdownChartProps {
  data: CostBreakdownData[]
  title?: string
}

const COLORS = ['#2196F3', '#4CAF50', '#8BC34A', '#FF9800', '#795548', '#9C27B0', '#607D8B', '#00BCD4', '#9E9E9E']

export function CostBreakdownChart({ data, title = 'Κατανομή Κόστους' }: CostBreakdownChartProps) {
  if (!data || data.length === 0 || data.every(d => d.cost === 0)) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Δεν υπάρχουν δεδομένα κόστους
        </div>
      </div>
    )
  }

  // Filter out zero cost items
  const chartData = data.filter(d => d.cost > 0)

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: CostBreakdownData }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg">
          <p className="font-semibold text-gray-900">{data.typeLabel}</p>
          <p className="text-sm text-gray-600">
            Κόστος: <strong>€{data.cost.toLocaleString('el-GR')}</strong>
          </p>
          <p className="text-sm text-gray-600">
            Ποσοστό: <strong>{data.percentage.toFixed(1)}%</strong>
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    const percentage = percent * 100

    if (percentage < 5) return null

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${percentage.toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="cost"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value, entry) => {
              const payload = entry.payload as CostBreakdownData
              return payload?.typeLabel || value
            }}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
