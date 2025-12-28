'use client'

import { useState, useEffect } from 'react'
import { History, TrendingUp, TrendingDown, Droplets, Thermometer } from 'lucide-react'

interface WeatherRecord {
  id: string
  date: string
  tempHigh: number
  tempLow: number
  tempAvg: number
  humidity: number
  rainfall: number
  condition: string
}

interface WeatherStats {
  avgTemp: number
  maxTemp: number
  minTemp: number
  avgHumidity: number
  totalRainfall: number
  recordCount: number
}

interface WeatherHistoryProps {
  farmId: string
  days?: number
}

export default function WeatherHistory({ farmId, days = 7 }: WeatherHistoryProps) {
  const [history, setHistory] = useState<WeatherRecord[]>([])
  const [stats, setStats] = useState<WeatherStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/weather/history?farmId=${farmId}&days=${days}&stats=true`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch weather history')
        }

        const data = await response.json()
        setHistory(data.history || [])
        setStats(data.stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [farmId, days])

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-center text-gray-500">
          <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Δεν υπάρχει ακόμα ιστορικό καιρού</p>
          <p className="text-xs text-gray-400 mt-1">
            Τα δεδομένα θα συλλεχθούν αυτόματα
          </p>
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-center text-gray-500">
          <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Δεν υπάρχει ακόμα ιστορικό καιρού</p>
          <p className="text-xs text-gray-400 mt-1">
            Τα δεδομένα θα συλλεχθούν αυτόματα καθημερινά
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-500" />
          Ιστορικό Καιρού ({days} ημέρες)
        </h3>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-lg font-bold">{Math.round(stats.maxTemp)}°</span>
              </div>
              <p className="text-xs text-gray-500">Μέγιστη</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                <TrendingDown className="w-4 h-4" />
                <span className="text-lg font-bold">{Math.round(stats.minTemp)}°</span>
              </div>
              <p className="text-xs text-gray-500">Ελάχιστη</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                <Thermometer className="w-4 h-4" />
                <span className="text-lg font-bold">{Math.round(stats.avgTemp)}°</span>
              </div>
              <p className="text-xs text-gray-500">Μέση</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                <Droplets className="w-4 h-4" />
                <span className="text-lg font-bold">{stats.totalRainfall.toFixed(1)}mm</span>
              </div>
              <p className="text-xs text-gray-500">Βροχή</p>
            </div>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {history.map((record) => (
          <div key={record.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-800">
                {new Date(record.date).toLocaleDateString('el-GR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })}
              </p>
              <p className="text-xs text-gray-500">{record.condition}</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-right">
                <span className="text-red-500 font-medium">{Math.round(record.tempHigh)}°</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-blue-500 font-medium">{Math.round(record.tempLow)}°</span>
              </div>
              <div className="text-gray-500 text-xs w-12 text-right">
                {record.humidity}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500 text-center">
        {stats?.recordCount || history.length} εγγραφές
      </div>
    </div>
  )
}
