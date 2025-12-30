'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  MapPin,
  Eye,
  ArrowLeft
} from 'lucide-react'

interface Farm {
  id: string
  name: string
  location: string
  oliveVariety: string | null
  treeCount: number | null
  totalArea: number | null
}

interface DashboardAIGeoponosProps {
  user: any
  farms: Farm[]
}

export default function DashboardAIGeoponos({ farms }: DashboardAIGeoponosProps) {
  const router = useRouter()
  const [insights, setInsights] = useState<any[]>([])
  const [portfolioSummary, setPortfolioSummary] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Portfolio stats
  const totalTrees = farms.reduce((sum, f) => sum + (f.treeCount || 0), 0)
  const totalArea = farms.reduce((sum, f) => sum + (f.totalArea || 0), 0)

  // Generate insights
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

      setInsights(data.insights || [])
      setPortfolioSummary(data.portfolioSummary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα δημιουργίας')
    } finally {
      setGenerating(false)
    }
  }

  // Urgency config
  const urgencyConfig: any = {
    CRITICAL: { bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-100 text-red-800', label: 'Κρίσιμο' },
    HIGH: { bg: 'bg-orange-50', border: 'border-orange-300', badge: 'bg-orange-100 text-orange-800', label: 'Υψηλή' },
    MEDIUM: { bg: 'bg-yellow-50', border: 'border-yellow-300', badge: 'bg-yellow-100 text-yellow-800', label: 'Μέτρια' },
    LOW: { bg: 'bg-blue-50', border: 'border-blue-300', badge: 'bg-blue-100 text-blue-800', label: 'Χαμηλή' }
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Επιστροφή στο Dashboard</span>
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Γεωπόνος</h1>
              <p className="text-emerald-100 text-lg mt-1">
                Ο ψηφιακός σας σύμβουλος για όλους τους ελαιώνες σας
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30
                       rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
          >
            <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Ανάλυση...' : 'Νέα Ανάλυση'}
          </button>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-emerald-200 text-sm mb-1">Ελαιώνες</div>
            <div className="text-3xl font-bold">{farms.length}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-emerald-200 text-sm mb-1">Δέντρα</div>
            <div className="text-3xl font-bold">{totalTrees.toLocaleString()}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-emerald-200 text-sm mb-1">Στρέμματα</div>
            <div className="text-3xl font-bold">{totalArea.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Portfolio Summary */}
      {portfolioSummary && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Συνολική Εικόνα Χαρτοφυλακίου
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-gray-600 text-sm mb-1">Γενική Υγεία</div>
              <div className={`text-2xl font-bold ${
                portfolioSummary.overallHealth === 'EXCELLENT' ? 'text-green-600' :
                portfolioSummary.overallHealth === 'GOOD' ? 'text-blue-600' :
                portfolioSummary.overallHealth === 'FAIR' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {portfolioSummary.overallHealth === 'EXCELLENT' ? 'Εξαιρετική' :
                 portfolioSummary.overallHealth === 'GOOD' ? 'Καλή' :
                 portfolioSummary.overallHealth === 'FAIR' ? 'Μέτρια' : 'Προβληματική'}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-gray-600 text-sm mb-1">Επείγουσες Δράσεις</div>
              <div className="text-2xl font-bold text-red-600">{portfolioSummary.urgentActions}</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="text-gray-600 text-sm mb-1">Ευκαιρίες Βελτίωσης</div>
              <div className="text-2xl font-bold text-emerald-600">{portfolioSummary.opportunitiesCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 text-lg">Στρατηγικές Συστάσεις</h3>
          {insights.map((insight: any) => {
            const config = urgencyConfig[insight.urgency]
            return (
              <div
                key={insight.id}
                className={`${config.bg} border ${config.border} rounded-xl p-5`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-gray-900">{insight.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.badge}`}>
                        {config.label}
                      </span>
                      {insight.farmName && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {insight.farmName}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{insight.message}</p>
                    {insight.reasoning && (
                      <p className="text-sm text-gray-600 italic">
                        <strong>Αιτιολόγηση:</strong> {insight.reasoning}
                      </p>
                    )}
                  </div>
                  {insight.farmId && (
                    <button
                      onClick={() => router.push(`/dashboard/farms/${insight.farmId}`)}
                      className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-gray-100
                               text-gray-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Δες Ελαιώνα
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="p-4 bg-emerald-100 rounded-full w-fit mx-auto mb-4">
            <Sparkles className="w-12 h-12 text-emerald-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-xl mb-2">Καλώς ήρθατε στον AI Γεωπόνο!</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Πατήστε &ldquo;Νέα Ανάλυση&rdquo; για να λάβετε στρατηγικές συμβουλές που αφορούν όλους τους ελαιώνες σας.
            Ο AI αναλύει τα δεδομένα από κάθε ελαιώνα και σας δίνει προτεραιοποιημένες δράσεις.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white
                     rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium"
          >
            <Sparkles className="w-5 h-5" />
            Δημιουργία Στρατηγικής Ανάλυσης
          </button>
        </div>
      )}

      {/* Farm List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4">Οι Ελαιώνες σας</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {farms.map(farm => (
            <div
              key={farm.id}
              onClick={() => router.push(`/dashboard/farms/${farm.id}`)}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{farm.name}</h4>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {farm.location}
                  </p>
                </div>
                <Eye className="w-4 h-4 text-gray-400" />
              </div>
              <div className="mt-3 flex gap-4 text-sm text-gray-600">
                <span>{farm.oliveVariety || 'Άγνωστη ποικιλία'}</span>
                <span>•</span>
                <span>{farm.treeCount || 0} δέντρα</span>
                <span>•</span>
                <span>{farm.totalArea?.toFixed(1) || 0} στρ.</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
