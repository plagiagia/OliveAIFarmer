'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import {
  Satellite,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Droplets,
  Leaf,
  Activity,
  MapPin,
  Info,
  ExternalLink
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts'

interface SatelliteIndices {
  ndvi: number | null
  ndmi: number | null
  evi: number | null
  soilMoisture: number | null
  cloudCoverage: number
  date: string
}

interface HealthMetrics {
  healthScore: number
  stressLevel: 'HEALTHY' | 'MILD_STRESS' | 'MODERATE_STRESS' | 'SEVERE_STRESS'
  ndviTrend: 'improving' | 'stable' | 'declining'
  ndviChange: number
  recommendations: string[]
}

interface TimeSeriesPoint {
  date: string
  ndvi: number | null
  ndmi: number | null
  cloudCoverage: number
}

interface SatelliteData {
  configured: boolean
  current: SatelliteIndices | null
  timeSeries: TimeSeriesPoint[]
  health: HealthMetrics | null
  lastUpdated: string | null
  coordinates: { lat: number; lon: number } | null
  message?: string
}

interface GroveHealthTabProps {
  farmId: string
}

// Stress level configuration
const STRESS_CONFIG = {
  HEALTHY: {
    label: 'Υγιής',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    description: 'Η βλάστηση είναι σε άριστη κατάσταση'
  },
  MILD_STRESS: {
    label: 'Ελαφρύ Στρες',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    description: 'Μικρή μείωση της φυτικής δραστηριότητας'
  },
  MODERATE_STRESS: {
    label: 'Μέτριο Στρες',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    description: 'Σημαντική μείωση - απαιτείται προσοχή'
  },
  SEVERE_STRESS: {
    label: 'Σοβαρό Στρες',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    description: 'Κρίσιμη κατάσταση - απαιτείται άμεση δράση'
  }
}

// Trend icons
const TrendIcon = ({ trend }: { trend: 'improving' | 'stable' | 'declining' }) => {
  if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-600" />
  if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-600" />
  return <Minus className="w-4 h-4 text-gray-400" />
}

export default function GroveHealthTab({ farmId }: GroveHealthTabProps) {
  const [data, setData] = useState<SatelliteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch satellite data
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const url = `/api/satellite/${farmId}${forceRefresh ? '?refresh=true' : ''}`
      const response = await fetch(url)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch satellite data')
      }

      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα φόρτωσης δεδομένων')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [farmId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle refresh
  const handleRefresh = () => {
    fetchData(true)
  }

  // Format chart data
  const chartData = data?.timeSeries
    .filter(point => point.ndvi !== null)
    .map(point => ({
      date: format(new Date(point.date), 'dd/MM', { locale: el }),
      fullDate: format(new Date(point.date), 'dd MMM yyyy', { locale: el }),
      ndvi: point.ndvi ? Math.round(point.ndvi * 100) / 100 : null,
      ndmi: point.ndmi ? Math.round(point.ndmi * 100) / 100 : null
    })) || []

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-32 bg-gray-100 rounded-lg" />
              <div className="h-32 bg-gray-100 rounded-lg" />
              <div className="h-32 bg-gray-100 rounded-lg" />
            </div>
            <div className="h-64 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  // Not configured state
  if (data && !data.configured) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg">
              <Satellite className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Υγεία Ελαιώνα</h2>
              <p className="text-blue-100 text-sm">
                Δορυφορική παρακολούθηση με Copernicus Sentinel
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4">
            <Satellite className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Δεν έχει ρυθμιστεί</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            {data.message || 'Η ενσωμάτωση δορυφορικών δεδομένων απαιτεί ρύθμιση του Copernicus API.'}
          </p>
          <a
            href="https://dataspace.copernicus.eu/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            Μάθετε περισσότερα
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    )
  }

  // No coordinates state
  if (error?.includes('coordinates')) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg">
              <Satellite className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Υγεία Ελαιώνα</h2>
              <p className="text-blue-100 text-sm">
                Δορυφορική παρακολούθηση με Copernicus Sentinel
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="p-4 bg-orange-100 rounded-full w-fit mx-auto mb-4">
            <MapPin className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Απαιτούνται Συντεταγμένες</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            Για να λάβετε δορυφορικά δεδομένα, πρέπει να ορίσετε την τοποθεσία του ελαιώνα στο χάρτη.
          </p>
          <p className="text-sm text-gray-500">
            Επεξεργαστείτε το αγρόκτημα και επιλέξτε την τοποθεσία στο χάρτη.
          </p>
        </div>
      </div>
    )
  }

  const current = data?.current
  const health = data?.health
  const stressConfig = health?.stressLevel ? STRESS_CONFIG[health.stressLevel] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg">
              <Satellite className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Υγεία Ελαιώνα</h2>
              <p className="text-blue-100 text-sm">
                Δορυφορική παρακολούθηση με Copernicus Sentinel-2
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Ανανέωση...' : 'Ανανέωση'}
          </button>
        </div>

        {data?.lastUpdated && (
          <p className="text-blue-200 text-xs mt-3">
            Τελευταία ενημέρωση: {format(new Date(data.lastUpdated), 'dd MMM yyyy, HH:mm', { locale: el })}
          </p>
        )}
      </div>

      {/* Error message */}
      {error && !error.includes('coordinates') && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Health Score Card */}
        <div className={`rounded-xl border p-5 ${stressConfig?.bg || 'bg-gray-50'} ${stressConfig?.border || 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Βαθμός Υγείας</span>
            <Activity className={`w-5 h-5 ${stressConfig?.color || 'text-gray-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${stressConfig?.color || 'text-gray-700'}`}>
              {health?.healthScore ?? '--'}
            </span>
            <span className="text-gray-500">/100</span>
          </div>
          {stressConfig && (
            <div className="mt-2">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${stressConfig.bg} ${stressConfig.color} border ${stressConfig.border}`}>
                {stressConfig.label}
              </span>
              <p className="text-xs text-gray-500 mt-1">{stressConfig.description}</p>
            </div>
          )}
        </div>

        {/* NDVI Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">NDVI</span>
            <Leaf className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {current?.ndvi != null ? current.ndvi.toFixed(2) : '--'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {health?.ndviTrend && (
              <>
                <TrendIcon trend={health.ndviTrend} />
                <span className={`text-sm ${
                  health.ndviTrend === 'improving' ? 'text-green-600' :
                  health.ndviTrend === 'declining' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {health.ndviChange > 0 ? '+' : ''}{health.ndviChange}%
                </span>
              </>
            )}
            <span className="text-xs text-gray-400">vs προηγούμενη μέτρηση</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Δείκτης βλάστησης (0-1)
          </p>
        </div>

        {/* Soil Moisture / NDMI Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Υγρασία Φυλλώματος</span>
            <Droplets className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {current?.ndmi != null ? current.ndmi.toFixed(2) : '--'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            NDMI - Δείκτης υγρασίας βλάστησης
          </p>
          {current?.ndmi != null && (
            <div className="mt-2">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                current.ndmi > 0.2 ? 'bg-blue-50 text-blue-600' :
                current.ndmi > 0 ? 'bg-yellow-50 text-yellow-600' :
                'bg-orange-50 text-orange-600'
              }`}>
                {current.ndmi > 0.2 ? 'Καλή υγρασία' :
                 current.ndmi > 0 ? 'Μέτρια υγρασία' : 'Χαμηλή υγρασία'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* NDVI Time Series Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Εξέλιξη NDVI</h3>
              <p className="text-sm text-gray-500">Τελευταίοι 6 μήνες</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">NDVI</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-600">NDMI</span>
              </div>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ndmiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  domain={[-0.2, 1]}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                          <p className="font-medium text-gray-900 mb-1">{data.fullDate}</p>
                          {payload.map((entry: any, index: number) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {entry.value?.toFixed(3) ?? '--'}
                            </p>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <ReferenceLine y={0.6} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Υγιής', fill: '#22c55e', fontSize: 10 }} />
                <ReferenceLine y={0.4} stroke="#eab308" strokeDasharray="5 5" label={{ value: 'Στρες', fill: '#eab308', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="ndvi"
                  name="NDVI"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#ndviGradient)"
                  dot={{ fill: '#22c55e', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="ndmi"
                  name="NDMI"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#ndmiGradient)"
                  dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend / Info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600">
                <strong>NDVI</strong> (Normalized Difference Vegetation Index): Δείκτης υγείας βλάστησης.
                Τιμές &gt;0.6 υποδεικνύουν υγιή βλάστηση, ενώ τιμές &lt;0.4 υποδεικνύουν στρες.{' '}
                <strong>NDMI</strong>: Δείκτης υγρασίας φυλλώματος.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {health?.recommendations && health.recommendations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Προτάσεις Βάσει Δορυφορικών Δεδομένων</h3>
          <div className="space-y-3">
            {health.recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg"
              >
                <Satellite className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No data state */}
      {!current && chartData.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
            <Satellite className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Δεν υπάρχουν δεδομένα</h3>
          <p className="text-gray-600 mb-4">
            Δεν βρέθηκαν διαθέσιμα δορυφορικά δεδομένα. Αυτό μπορεί να οφείλεται σε νεφοκάλυψη.
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white
                     rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Δοκιμάστε Ξανά
          </button>
        </div>
      )}

      {/* Data Source Info */}
      <div className="text-center text-xs text-gray-400">
        <p>
          Τα δεδομένα προέρχονται από το{' '}
          <a
            href="https://dataspace.copernicus.eu/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Copernicus Data Space Ecosystem
          </a>
          {' '}(Sentinel-2 L2A). Ανάλυση 10m, ανανέωση κάθε 5 ημέρες.
        </p>
      </div>
    </div>
  )
}
