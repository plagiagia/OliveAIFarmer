'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lightbulb,
  CloudRain,
  Leaf,
  TrendingUp,
  Bell,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface Insight {
  id: string
  type: string
  title: string
  message: string
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  actionRequired: boolean
  reasoning?: string
  isRead: boolean
  isActioned: boolean
  createdAt: string
  source: string
}

interface AIGeoponosTabProps {
  farmId: string
}

// Urgency colors and icons
const URGENCY_CONFIG = {
  CRITICAL: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    label: 'Κρίσιμο'
  },
  HIGH: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-800',
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    label: 'Υψηλή'
  },
  MEDIUM: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    iconColor: 'text-yellow-600',
    label: 'Μέτρια'
  },
  LOW: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    icon: Lightbulb,
    iconColor: 'text-blue-600',
    label: 'Χαμηλή'
  }
}

// Type icons
const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  TASK_REMINDER: Bell,
  WEATHER_ALERT: CloudRain,
  CARE_SUGGESTION: Leaf,
  OPTIMIZATION: TrendingUp,
  RISK_WARNING: AlertTriangle,
  SEASONAL_TIP: Sparkles
}

export default function AIGeoponosTab({ farmId }: AIGeoponosTabProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null)
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)

  // Fetch insights
  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/insights/${farmId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch insights')
      }

      setInsights(data.insights || [])
      setLastGeneratedAt(data.lastGeneratedAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα φόρτωσης')
    } finally {
      setLoading(false)
    }
  }, [farmId])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  // Generate new insights
  const handleGenerate = async () => {
    try {
      setGenerating(true)
      setError(null)

      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate insights')
      }

      // Refresh insights list
      await fetchInsights()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα δημιουργίας')
    } finally {
      setGenerating(false)
    }
  }

  // Mark insight as read
  const markAsRead = async (insightId: string) => {
    try {
      await fetch(`/api/insights/${insightId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })

      setInsights(prev =>
        prev.map(i => i.id === insightId ? { ...i, isRead: true } : i)
      )
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  // Mark insight as actioned (done)
  const markAsActioned = async (insightId: string) => {
    try {
      await fetch(`/api/insights/${insightId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActioned: true })
      })

      setInsights(prev =>
        prev.map(i => i.id === insightId ? { ...i, isActioned: true, isRead: true } : i)
      )
    } catch (err) {
      console.error('Failed to mark as actioned:', err)
    }
  }

  // Delete insight
  const deleteInsight = async (insightId: string) => {
    try {
      await fetch(`/api/insights/${insightId}`, {
        method: 'DELETE'
      })

      setInsights(prev => prev.filter(i => i.id !== insightId))
    } catch (err) {
      console.error('Failed to delete insight:', err)
    }
  }

  // Toggle expand insight
  const toggleExpand = (insightId: string) => {
    if (!insights.find(i => i.id === insightId)?.isRead) {
      markAsRead(insightId)
    }
    setExpandedInsight(prev => prev === insightId ? null : insightId)
  }

  // Filter active insights (not actioned)
  const activeInsights = insights.filter(i => !i.isActioned)
  const actionedInsights = insights.filter(i => i.isActioned)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-24 bg-gray-100 rounded" />
            <div className="h-24 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Γεωπόνος</h2>
              <p className="text-emerald-100 text-sm">
                Εξατομικευμένες συμβουλές για τον ελαιώνα σας
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Δημιουργία...' : 'Νέες Προτάσεις'}
          </button>
        </div>

        {lastGeneratedAt && (
          <p className="text-emerald-200 text-xs mt-3">
            Τελευταία ενημέρωση: {format(new Date(lastGeneratedAt), 'dd MMM yyyy, HH:mm', { locale: el })}
          </p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Active Insights */}
      {activeInsights.length > 0 ? (
        <div className="space-y-4">
          {activeInsights.map(insight => {
            const urgencyConfig = URGENCY_CONFIG[insight.urgency]
            const TypeIcon = TYPE_ICONS[insight.type] || Lightbulb
            const isExpanded = expandedInsight === insight.id

            return (
              <div
                key={insight.id}
                className={`${urgencyConfig.bg} border ${urgencyConfig.border} rounded-xl
                           overflow-hidden transition-all duration-200
                           ${!insight.isRead ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}
              >
                {/* Insight Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-white/50 transition-colors"
                  onClick={() => toggleExpand(insight.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${urgencyConfig.badge}`}>
                      <TypeIcon className={`w-5 h-5 ${urgencyConfig.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                        {!insight.isRead && (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                            Νέο
                          </span>
                        )}
                      </div>
                      <p className={`text-gray-700 ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {insight.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgencyConfig.badge}`}>
                        {urgencyConfig.label}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200/50 pt-3">
                    {insight.reasoning && (
                      <div className="mb-3 p-3 bg-white/70 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Αιτιολόγηση: </span>
                          {insight.reasoning}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {format(new Date(insight.createdAt), 'dd MMM yyyy, HH:mm', { locale: el })}
                      </p>
                      <div className="flex items-center gap-2">
                        {insight.actionRequired && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsActioned(insight.id)
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600
                                     text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Ολοκληρώθηκε
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteInsight(insight.id)
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600
                                   hover:bg-red-50 rounded-lg transition-colors"
                          title="Διαγραφή"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Δεν υπάρχουν προτάσεις</h3>
          <p className="text-gray-600 mb-4">
            Πατήστε "Νέες Προτάσεις" για να λάβετε εξατομικευμένες συμβουλές από τον AI Γεωπόνο
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white
                     rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Δημιουργία Προτάσεων
          </button>
        </div>
      )}

      {/* Actioned Insights (collapsed by default) */}
      {actionedInsights.length > 0 && (
        <details className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="font-medium text-gray-700">
              Ολοκληρωμένες προτάσεις ({actionedInsights.length})
            </span>
          </summary>
          <div className="p-4 pt-0 space-y-3">
            {actionedInsights.map(insight => (
              <div
                key={insight.id}
                className="bg-white border border-gray-200 rounded-lg p-3 opacity-60"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-gray-700 line-through">
                    {insight.title}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                  {insight.message}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
