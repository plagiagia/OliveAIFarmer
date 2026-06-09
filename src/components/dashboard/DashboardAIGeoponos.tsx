'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  MapPin,
  Eye,
  ArrowLeft,
  TreeDeciduous,
  Scale,
  ChevronRight,
  Lightbulb,
  Loader2
} from 'lucide-react'
import { StatsCard } from '@/components/analytics/StatsCard'
import { URGENCY_CONFIG, type Urgency } from '@/lib/ui/urgency'
import { cn } from '@/lib/utils'

interface Farm {
  id: string
  name: string
  location: string
  oliveVariety: string | null
  treeCount: number | null
  totalArea: number | null
}

interface DashboardAIGeoponosProps {
  user: { id?: string; clerkId?: string; email?: string } | null
  farms: Farm[]
}

interface PortfolioSummary {
  overallHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  urgentActions: number
  opportunitiesCount: number
}

interface DashboardInsight {
  id: string
  title: string
  message: string
  urgency: Urgency
  reasoning?: string | null
  farmId?: string | null
  farmName?: string | null
}

function getHealthDisplay(health: string): { label: string; tone: 'neutral' | 'positive' | 'negative' } {
  switch (health) {
    case 'EXCELLENT':
      return { label: 'Εξαιρετική', tone: 'positive' }
    case 'GOOD':
      return { label: 'Καλή', tone: 'positive' }
    case 'FAIR':
      return { label: 'Μέτρια', tone: 'neutral' }
    default:
      return { label: 'Προβληματική', tone: 'negative' }
  }
}

export default function DashboardAIGeoponos({ farms }: DashboardAIGeoponosProps) {
  const router = useRouter()
  const [insights, setInsights] = useState<DashboardInsight[]>([])
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalTrees = farms.reduce((sum, f) => sum + (f.treeCount || 0), 0)
  const totalArea = farms.reduce((sum, f) => sum + (f.totalArea || 0), 0)

  const fetchInsights = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) setLoading(true)
      setError(null)

      const response = await fetch('/api/insights/dashboard')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch insights')
      }

      setInsights(data.insights || [])
      setPortfolioSummary(data.portfolioSummary ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα φόρτωσης')
    } finally {
      if (!options?.silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      setError(null)

      const response = await fetch('/api/insights/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate insights')
      }

      await fetchInsights({ silent: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα δημιουργίας')
    } finally {
      setGenerating(false)
    }
  }

  const urgencyConfig = URGENCY_CONFIG
  const hasResults = insights.length > 0 || portfolioSummary

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="h-1 bg-gray-200" aria-hidden />
          <div className="p-5 sm:p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-48 rounded bg-gray-200" />
              <div className="h-4 w-72 max-w-full rounded bg-gray-100" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Back link */}
      <button
        onClick={() => router.push('/dashboard')}
        className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900 sm:text-base"
      >
        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        <span>Πίνακας Ελέγχου</span>
      </button>

      {/* Page header */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-emerald-600 to-teal-600" aria-hidden />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  AI Γεωπόνος
                </h1>
                <p className="mt-1 max-w-xl text-sm text-gray-600 sm:text-base">
                  Ο ψηφιακός σας σύμβουλος για όλους τους ελαιώνες σας
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <RefreshCw className={cn('h-4 w-4', generating && 'animate-spin')} />
              {generating ? 'Ανάλυση...' : 'Νέα Ανάλυση'}
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatsCard title="Ελαιώνες" value={farms.length} icon={MapPin} />
        <StatsCard
          title="Δέντρα"
          value={totalTrees.toLocaleString('el-GR')}
          icon={TreeDeciduous}
        />
        <StatsCard
          title="Στρέμματα"
          value={`${totalArea.toFixed(1)} στρ.`}
          icon={Scale}
        />
      </div>

      {/* Generating indicator */}
      {generating && hasResults && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          <span>Επεξεργασία νέας στρατηγικής ανάλυσης…</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Portfolio summary */}
      {portfolioSummary && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Συνολική Εικόνα Χαρτοφυλακίου</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <StatsCard
              title="Γενική Υγεία"
              value={getHealthDisplay(portfolioSummary.overallHealth).label}
              icon={Sparkles}
              valueTone={getHealthDisplay(portfolioSummary.overallHealth).tone}
            />
            <StatsCard
              title="Επείγουσες Δράσεις"
              value={portfolioSummary.urgentActions}
              icon={AlertTriangle}
              valueTone={portfolioSummary.urgentActions > 0 ? 'negative' : 'neutral'}
            />
            <StatsCard
              title="Ευκαιρίες Βελτίωσης"
              value={portfolioSummary.opportunitiesCount}
              icon={Lightbulb}
              valueTone={portfolioSummary.opportunitiesCount > 0 ? 'positive' : 'neutral'}
            />
          </div>
        </section>
      )}

      {/* Insights */}
      {insights.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Στρατηγικές Συστάσεις</h2>
            <span className="text-sm text-gray-500">{insights.length} προτάσεις</span>
          </div>
          <div className="space-y-3">
            {insights.map(insight => {
              const config = urgencyConfig[insight.urgency]
              const UrgencyIcon = config.icon
              return (
                <article
                  key={insight.id}
                  className={cn(
                    'overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md',
                    config.bg,
                    config.border
                  )}
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        config.badge
                      )}
                    >
                      <UrgencyIcon className={cn('h-5 w-5', config.iconColor)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', config.badge)}>
                          {config.label}
                        </span>
                        {insight.farmName && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                            <MapPin className="h-3 w-3" />
                            {insight.farmName}
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-gray-700">{insight.message}</p>
                      {insight.reasoning && (
                        <div className="mt-3 rounded-lg bg-white/70 p-3 ring-1 ring-gray-200/60">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-gray-700">Αιτιολόγηση: </span>
                            {insight.reasoning}
                          </p>
                        </div>
                      )}
                    </div>
                    {insight.farmId && (
                      <button
                        onClick={() => router.push(`/dashboard/farms/${insight.farmId}`)}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />
                        Δες Ελαιώνα
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : generating ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Ανάλυση χαρτοφυλακίου…</h3>
            <p className="mt-2 text-sm text-gray-600">
              Ο AI Γεωπόνος επεξεργάζεται τα δεδομένα από όλους τους ελαιώνες σας.
            </p>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 shadow-sm sm:p-12">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Sparkles className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Ξεκινήστε τη στρατηγική ανάλυση</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Πατήστε «Νέα Ανάλυση» για προτεραιοποιημένες συμβουλές που αφορούν όλους τους ελαιώνες σας.
              Ο AI συνδυάζει δεδομένα από κάθε ελαιώνα και παρουσιάζει ενιαία στρατηγική εικόνα.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Δημιουργία Στρατηγικής Ανάλυσης
            </button>
          </div>
        </section>
      )}

      {/* Farm list */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Οι Ελαιώνες σας</h2>
          <span className="text-sm text-gray-500">{farms.length} ενεργοί</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {farms.map(farm => (
            <button
              key={farm.id}
              type="button"
              onClick={() => router.push(`/dashboard/farms/${farm.id}`)}
              className="group flex w-full items-start justify-between rounded-xl border border-gray-200 p-4 text-left transition-all hover:border-emerald-200 hover:shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 group-hover:text-emerald-800">{farm.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{farm.location}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span>{farm.oliveVariety || 'Άγνωστη ποικιλία'}</span>
                  <span aria-hidden>·</span>
                  <span>{farm.treeCount || 0} δέντρα</span>
                  <span aria-hidden>·</span>
                  <span>{farm.totalArea?.toFixed(1) || 0} στρ.</span>
                </div>
              </div>
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-emerald-600" />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
