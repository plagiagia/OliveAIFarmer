'use client'

import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Leaf,
  Lightbulb,
  RefreshCw,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { URGENCY_CONFIG, type Urgency } from '@/lib/ui/urgency'
import { greekDate } from '@/lib/ai/activity-weather'

interface Insight {
  id: string
  type: string
  title: string
  message: string
  urgency: Urgency
  actionRequired: boolean
  reasoning?: string
  isRead: boolean
  isActioned: boolean
  createdAt: string
  source: string
  triggerConditions?: {
    evidence?: { id: string; detail: string }[]
    missingData?: string[]
    followUpQuestion?: string | null
    context?: { region: string; variety: string; observedDays: number; weatherFresh: boolean; asOf: string }
  } | null
}

interface AIGeoponosTabProps {
  farmId: string
  readOnly?: boolean
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

export default function AIGeoponosTab({ farmId, readOnly = false }: AIGeoponosTabProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null)
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [mutating, setMutating] = useState<string | null>(null)
  const [observation, setObservation] = useState('')

  const saveObservation = async (insight: Insight) => {
    if (readOnly || mutating || observation.trim().length < 5) return
    setMutating(insight.id)
    setError(null)
    try {
      const response = await fetch('/api/activities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, type: 'INSPECTION', title: `Παρατήρηση: ${insight.title}`.slice(0, 120), date: greekDate(new Date()), completed: true,
          notes: `${insight.triggerConditions?.followUpQuestion || ''}\nΠαρατήρηση παραγωγού: ${observation.trim()}` }),
      })
      if (!response.ok) throw new Error('Δεν αποθηκεύτηκε η παρατήρηση. Δοκιμάστε ξανά.')
      setObservation('')
      setNotice('Η παρατήρηση αποθηκεύτηκε στις εργασίες. Πατήστε «Νέες Προτάσεις» για ανάλυση με τα νέα στοιχεία.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία αποθήκευσης')
    } finally {
      setMutating(null)
    }
  }

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
    if (readOnly || generating) return
    try {
      setGenerating(true)
      setError(null)
      setNotice(null)

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
      setNotice(data.notice || (data.usedFallback ? 'Εμφανίζονται βασικές υπενθυμίσεις καταγραφής, όχι νέα ανάλυση AI.' : data.cached ? 'Τα στοιχεία δεν έχουν αλλάξει. Εμφανίζεται η αποθηκευμένη ανάλυση.' : null))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα δημιουργίας')
    } finally {
      setGenerating(false)
    }
  }

  // Mark insight as read
  const markAsRead = async (insightId: string) => {
    if (readOnly) return
    try {
      const response = await fetch(`/api/insights/item/${insightId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })
      if (!response.ok) throw new Error('Δεν αποθηκεύτηκε η ανάγνωση της πρότασης.')

      setInsights(prev =>
        prev.map(i => i.id === insightId ? { ...i, isRead: true } : i)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία ενημέρωσης')
    }
  }

  // Mark insight as actioned (done)
  const markAsActioned = async (insightId: string) => {
    if (readOnly || mutating) return
    setMutating(insightId)
    try {
      const response = await fetch(`/api/insights/item/${insightId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActioned: true })
      })
      if (!response.ok) throw new Error('Δεν αποθηκεύτηκε η ολοκλήρωση της πρότασης.')

      setInsights(prev =>
        prev.map(i => i.id === insightId ? { ...i, isActioned: true, isRead: true } : i)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία ενημέρωσης')
    } finally {
      setMutating(null)
    }
  }

  // Delete insight
  const deleteInsight = async (insightId: string) => {
    if (readOnly || mutating) return
    setMutating(insightId)
    try {
      const response = await fetch(`/api/insights/item/${insightId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Δεν διαγράφηκε η πρόταση.')

      setInsights(prev => prev.filter(i => i.id !== insightId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία διαγραφής')
    } finally {
      setMutating(null)
    }
  }

  // Toggle expand insight
  const toggleExpand = (insightId: string) => {
    setObservation('')
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-white/20 rounded-lg flex-shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">AI Γεωπόνος</h2>
              <p className="text-emerald-100 text-xs sm:text-sm">
                Τι αξίζει να ελέγξετε στον ελαιώνα σας και γιατί
              </p>
            </div>
          </div>
          {!readOnly && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Δημιουργία...' : 'Νέες Προτάσεις'}
          </button>
          )}
        </div>

        {lastGeneratedAt && (
          <p className="text-emerald-200 text-[10px] sm:text-xs mt-3">
            Ενημέρωση: {format(new Date(lastGeneratedAt), 'dd/MM/yy, HH:mm', { locale: el })}
          </p>
        )}
      </div>

      {/* Error message */}
      {notice && <p role="status" className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{notice}</p>}
      <p className="text-sm text-gray-600">Η ανάλυση αξιοποιεί τη δηλωμένη ποικιλία, περιοχή, διαθέσιμο καιρό και καταγραφές. Συμπληρώστε τα στοιχεία του ελαιώνα και τις παρατηρήσεις σας για πιο χρήσιμες προτάσεις.</p>
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
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(insight.id) } }}
                  onClick={() => toggleExpand(insight.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${urgencyConfig.badge}`}>
                      <TypeIcon className={`w-5 h-5 ${urgencyConfig.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="mb-1 text-xs text-gray-600">{insight.source === 'AI_GENERATED' ? 'Ανάλυση AI' : insight.source === 'WEATHER_ALERT' ? 'Καιρικός δείκτης · κανόνες' : 'Βασική υπενθύμιση · χωρίς AI'}</p>
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
                    {insight.triggerConditions?.context && <p className="mb-3 text-xs text-gray-600">
                      {insight.triggerConditions.context.region} · {insight.triggerConditions.context.variety} · στοιχεία {insight.triggerConditions.context.asOf} · καιρός {insight.triggerConditions.context.observedDays}/30 ημέρες{!insight.triggerConditions.context.weatherFresh ? ' (χωρίς πρόσφατη ενημέρωση)' : ''}
                    </p>}
                    {insight.reasoning && (
                      <div className="mb-3 p-3 bg-white/70 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Αιτιολόγηση: </span>
                          {insight.reasoning}
                        </p>
                      </div>
                    )}

                    {!!insight.triggerConditions?.evidence?.length && <div className="mb-3 text-sm text-gray-700">
                      <p className="font-medium">Σε ποια στοιχεία βασίζεται</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5">{insight.triggerConditions.evidence.map(item => <li key={item.id}>{item.id === 'weather' ? `Διαθέσιμο καιρικό ιστορικό: ${insight.triggerConditions?.context?.observedDays ?? '—'} ημέρες. Οι τιμές αφορούν μόνο καταγεγραμμένες παρατηρήσεις.` : item.detail}</li>)}</ul>
                    </div>}
                    {!!insight.triggerConditions?.missingData?.length && <p className="mb-3 text-sm text-gray-600"><span className="font-medium">Χρειάζεται επιβεβαίωση: </span>{insight.triggerConditions.missingData.join(' · ')}</p>}
                    {insight.triggerConditions?.followUpQuestion && <div className="mb-3 rounded-lg bg-white/70 p-3 text-sm text-gray-800">
                      <p className="font-medium">Επόμενη χρήσιμη παρατήρηση</p><p>{insight.triggerConditions.followUpQuestion}</p>
                      {!readOnly && <div className="mt-3 space-y-2">
                        <label htmlFor={`observation-${insight.id}`} className="block text-xs text-gray-600">Τι παρατηρήσατε σήμερα; Η απάντηση αποθηκεύεται ως επιθεώρηση.</label>
                        <textarea id={`observation-${insight.id}`} value={observation} onChange={e => setObservation(e.target.value)} maxLength={600} rows={3} className="w-full rounded-lg border border-gray-300 bg-white p-2" />
                        <button onClick={() => saveObservation(insight)} disabled={mutating !== null || observation.trim().length < 5} className="rounded-lg bg-emerald-700 px-3 py-2 text-white disabled:opacity-50">Αποθήκευση παρατήρησης</button>
                      </div>}
                    </div>}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {format(new Date(insight.createdAt), 'dd MMM yyyy, HH:mm', { locale: el })}
                      </p>
                      {!readOnly && <div className="flex items-center gap-2">
                        {insight.actionRequired && (
                          <button
                            disabled={mutating !== null}
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
                          disabled={mutating !== null}
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
                      </div>}
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
            Πατήστε &quot;Νέες Προτάσεις&quot; για να λάβετε εξατομικευμένες συμβουλές από τον AI Γεωπόνο
          </p>
          {!readOnly && <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white
                     rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Δημιουργία Προτάσεων
          </button>}
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
