'use client'

import { AlertCircle, CheckCircle, Info, Lightbulb } from 'lucide-react'

interface Recommendation {
  type: 'success' | 'warning' | 'info' | 'error'
  category: string
  message: string
  priority: 'high' | 'medium' | 'low'
}

interface RecommendationsProps {
  data: Recommendation[]
  title?: string
}

export function Recommendations({ data, title = 'Συστάσεις & Ενέργειες' }: RecommendationsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
          <p>Όλα φαίνονται εντάξει! Συνεχίστε έτσι.</p>
        </div>
      </div>
    )
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />
      case 'warning':
        return <AlertCircle className="w-5 h-5" />
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      case 'info':
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: 'text-green-600'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600'
        }
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600'
        }
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600'
        }
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            Υψηλή Προτεραιότητα
          </span>
        )
      case 'medium':
        return (
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
            Μέτρια Προτεραιότητα
          </span>
        )
      case 'low':
        return (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
            Χαμηλή Προτεραιότητα
          </span>
        )
      default:
        return null
    }
  }

  // Sort by priority
  const sortedData = [...data].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="space-y-3">
        {sortedData.map((recommendation, index) => {
          const colors = getColorClasses(recommendation.type)

          return (
            <div
              key={index}
              className={`${colors.bg} ${colors.border} border rounded-xl p-4 transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <div className={`${colors.icon} mt-0.5`}>
                  {getIcon(recommendation.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${colors.text}`}>
                      {recommendation.category}
                    </span>
                    {getPriorityBadge(recommendation.priority)}
                  </div>

                  <p className={`text-sm ${colors.text}`}>
                    {recommendation.message}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>{sortedData.filter(r => r.priority === 'high').length} Υψηλής</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span>{sortedData.filter(r => r.priority === 'medium').length} Μέτριας</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full" />
              <span>{sortedData.filter(r => r.priority === 'low').length} Χαμηλής</span>
            </div>
          </div>
          <span className="text-gray-500">Σύνολο: {sortedData.length} συστάσεις</span>
        </div>
      </div>
    </div>
  )
}
