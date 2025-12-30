'use client'

import { TrendingUp, DollarSign, TreeDeciduous, BarChart3, Target } from 'lucide-react'

interface EfficiencyData {
  roi: number
  costPerKg: number
  yieldPerTree: number
  avgYieldPerStremma: number
  profitMargin: number
}

interface EfficiencyMetricsProps {
  data: EfficiencyData
  title?: string
}

export function EfficiencyMetrics({ data, title = 'Δείκτες Απόδοσης' }: EfficiencyMetricsProps) {
  const metrics = [
    {
      label: 'ROI (Απόδοση Επένδυσης)',
      value: `${data.roi.toFixed(1)}%`,
      icon: TrendingUp,
      color: data.roi > 30 ? 'green' : data.roi > 15 ? 'yellow' : 'red',
      description: 'Κέρδος σε σχέση με το κόστος',
      benchmark: { good: 30, fair: 15 }
    },
    {
      label: 'Κόστος ανά Κιλό',
      value: `€${data.costPerKg.toFixed(2)}`,
      icon: DollarSign,
      color: data.costPerKg < 1.5 ? 'green' : data.costPerKg < 2.5 ? 'yellow' : 'red',
      description: 'Μέσο κόστος παραγωγής',
      benchmark: { good: 1.5, fair: 2.5 }
    },
    {
      label: 'Απόδοση ανά Δέντρο',
      value: `${data.yieldPerTree.toFixed(1)} kg`,
      icon: TreeDeciduous,
      color: data.yieldPerTree > 20 ? 'green' : data.yieldPerTree > 10 ? 'yellow' : 'red',
      description: 'Μέση παραγωγή ανά δέντρο',
      benchmark: { good: 20, fair: 10 }
    },
    {
      label: 'Απόδοση ανά Στρέμμα',
      value: `${data.avgYieldPerStremma.toFixed(0)} kg`,
      icon: BarChart3,
      color: data.avgYieldPerStremma > 150 ? 'green' : data.avgYieldPerStremma > 100 ? 'yellow' : 'red',
      description: 'Μέση παραγωγή ανά στρέμμα',
      benchmark: { good: 150, fair: 100 }
    },
    {
      label: 'Περιθώριο Κέρδους',
      value: `${data.profitMargin.toFixed(1)}%`,
      icon: Target,
      color: data.profitMargin > 40 ? 'green' : data.profitMargin > 20 ? 'yellow' : 'red',
      description: 'Ποσοστό κέρδους επί των εσόδων',
      benchmark: { good: 40, fair: 20 }
    }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          icon: 'bg-green-100',
          border: 'border-green-200'
        }
      case 'yellow':
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
          icon: 'bg-yellow-100',
          border: 'border-yellow-200'
        }
      case 'red':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          icon: 'bg-red-100',
          border: 'border-red-200'
        }
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          icon: 'bg-gray-100',
          border: 'border-gray-200'
        }
    }
  }

  const getPerformanceLevel = (color: string) => {
    switch (color) {
      case 'green':
        return 'Εξαιρετικό'
      case 'yellow':
        return 'Καλό'
      case 'red':
        return 'Χρειάζεται Βελτίωση'
      default:
        return 'Μέτριο'
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          const colors = getColorClasses(metric.color)
          const performanceLevel = getPerformanceLevel(metric.color)

          return (
            <div
              key={index}
              className={`${colors.bg} ${colors.border} border rounded-xl p-4 transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`${colors.icon} p-2 rounded-lg`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <span className={`text-xs font-medium px-2 py-1 ${colors.bg} ${colors.text} rounded-full`}>
                  {performanceLevel}
                </span>
              </div>

              <div className="mb-2">
                <div className={`text-2xl font-bold ${colors.text} mb-1`}>
                  {metric.value}
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {metric.label}
                </p>
              </div>

              <p className="text-xs text-gray-600">
                {metric.description}
              </p>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      metric.color === 'green' ? 'bg-green-500' :
                      metric.color === 'yellow' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        (metric.color === 'green' ? 100 :
                         metric.color === 'yellow' ? 66 : 33), 100
                      )}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span>Εξαιρετικό (πάνω από benchmark)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span>Καλό (εντός ορίων)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span>Χρειάζεται Βελτίωση</span>
          </div>
        </div>
      </div>
    </div>
  )
}
