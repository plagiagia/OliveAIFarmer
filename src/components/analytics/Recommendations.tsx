'use client'

import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Info, Lightbulb } from 'lucide-react'
import { useState } from 'react'

const MAX_VISIBLE = 3

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

function getBorderClass(type: Recommendation['type']) {
  switch (type) {
    case 'success':
      return 'border-l-olive-600'
    case 'warning':
      return 'border-l-amber-500'
    case 'error':
      return 'border-l-red-500'
    case 'info':
    default:
      return 'border-l-gray-300'
  }
}

function getIcon(type: Recommendation['type']) {
  const className = 'h-5 w-5 shrink-0 text-gray-500'
  switch (type) {
    case 'success':
      return <CheckCircle className={className} aria-hidden />
    case 'warning':
    case 'error':
      return <AlertCircle className={className} aria-hidden />
    case 'info':
    default:
      return <Info className={className} aria-hidden />
  }
}

function priorityLabel(priority: Recommendation['priority']) {
  switch (priority) {
    case 'high':
      return 'Υψηλή'
    case 'medium':
      return 'Μέτρια'
    case 'low':
      return 'Χαμηλή'
  }
}

export function Recommendations({ data, title = 'Συστάσεις & Ενέργειες' }: RecommendationsProps) {
  const [expanded, setExpanded] = useState(false)

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <CheckCircle className="mb-3 h-12 w-12 text-olive-600" aria-hidden />
          <p>Όλα φαίνονται εντάξει. Συνεχίστε έτσι.</p>
        </div>
      </div>
    )
  }

  const sortedData = [...data].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const hasMore = sortedData.length > MAX_VISIBLE
  const visible = expanded ? sortedData : sortedData.slice(0, MAX_VISIBLE)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-olive-700" aria-hidden />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">
              {sortedData.length === 1
                ? '1 ενέργεια προτεραιότητας'
                : `${sortedData.length} προτεινόμενες ενέργειες`}
            </p>
          </div>
        </div>
      </div>

      <ul className="space-y-3">
        {visible.map((recommendation, index) => (
          <li
            key={`${recommendation.category}-${index}`}
            className={cn(
              'rounded-lg border border-gray-100 border-l-4 bg-gray-50/50 py-3 pl-4 pr-4',
              getBorderClass(recommendation.type)
            )}
          >
            <div className="flex gap-3">
              {getIcon(recommendation.type)}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {recommendation.category}
                  </span>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {priorityLabel(recommendation.priority)}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {recommendation.message}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 flex w-full items-center justify-center gap-1 text-sm font-medium text-olive-700 hover:text-olive-800"
        >
          {expanded ? (
            <>
              Λιγότερες συστάσεις
              <ChevronUp className="h-4 w-4" aria-hidden />
            </>
          ) : (
            <>
              Όλες οι συστάσεις ({sortedData.length})
              <ChevronDown className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      )}
    </div>
  )
}
