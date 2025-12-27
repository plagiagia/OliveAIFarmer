'use client'

import { useState, useEffect } from 'react'
import {
  Cloud,
  CloudRain,
  Droplets,
  Sun,
  Thermometer,
  Wind,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Bug,
  Droplet
} from 'lucide-react'
import {
  WeatherIntelligence,
  WeatherAlert,
  DiseaseRisk,
  WEATHER_ICONS
} from '@/types/weather'

interface WeatherWidgetProps {
  farmId: string
  latitude: number
  longitude: number
}

export default function WeatherWidget({ farmId, latitude, longitude }: WeatherWidgetProps) {
  const [data, setData] = useState<WeatherIntelligence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>('alerts')

  const fetchWeather = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/weather?lat=${latitude}&lon=${longitude}&farmId=${farmId}`
      )

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to fetch weather')
      }

      const weatherData = await response.json()
      setData(weatherData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weather data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeather()
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [latitude, longitude, farmId])

  if (loading) {
    return <WeatherSkeleton />
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-500" />
            Καιρός & Έξυπνες Συστάσεις
          </h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Cloud className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>{error}</p>
          <button
            onClick={fetchWeather}
            className="mt-4 text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Δοκιμάστε ξανά
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { weather, alerts, irrigation, diseaseRisks } = data
  const weatherIcon = WEATHER_ICONS[weather.current.icon] || '🌤️'

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header with current weather */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Καιρός & Έξυπνες Συστάσεις
          </h3>
          <button
            onClick={fetchWeather}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Ανανέωση"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{weatherIcon}</span>
            <div>
              <div className="text-4xl font-bold">{weather.current.temperature}°C</div>
              <div className="text-blue-100">{weather.current.description}</div>
            </div>
          </div>

          <div className="text-right text-sm space-y-1">
            <div className="flex items-center justify-end gap-1">
              <Thermometer className="w-4 h-4" />
              <span>Αίσθηση: {weather.current.feelsLike}°C</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <Droplets className="w-4 h-4" />
              <span>Υγρασία: {weather.current.humidity}%</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <Wind className="w-4 h-4" />
              <span>Άνεμος: {Math.round(weather.current.windSpeed * 3.6)} km/h</span>
            </div>
          </div>
        </div>

        {/* 5-day forecast mini */}
        <div className="mt-6 grid grid-cols-5 gap-2">
          {weather.forecast.slice(0, 5).map((day, i) => (
            <div key={i} className="text-center bg-white/10 rounded-lg py-2">
              <div className="text-xs text-blue-100">
                {day.date.toLocaleDateString('el-GR', { weekday: 'short' })}
              </div>
              <div className="text-lg my-1">{WEATHER_ICONS[day.icon] || '🌤️'}</div>
              <div className="text-xs">
                <span className="font-semibold">{day.tempMax}°</span>
                <span className="text-blue-200"> / {day.tempMin}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="border-b border-gray-100">
          <button
            onClick={() => toggleSection('alerts')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-gray-800">
                Ειδοποιήσεις ({alerts.length})
              </span>
            </div>
            {expandedSection === 'alerts' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSection === 'alerts' && (
            <div className="px-6 pb-4 space-y-3">
              {alerts.map((alert, i) => (
                <AlertCard key={i} alert={alert} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Irrigation Section */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection('irrigation')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Droplet className={`w-5 h-5 ${irrigation.shouldIrrigate ? 'text-blue-500' : 'text-gray-400'}`} />
            <span className="font-medium text-gray-800">Σύσταση Ποτίσματος</span>
            {irrigation.shouldIrrigate && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                Συνιστάται
              </span>
            )}
          </div>
          {expandedSection === 'irrigation' ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSection === 'irrigation' && (
          <div className="px-6 pb-4">
            <div className={`p-4 rounded-xl ${irrigation.shouldIrrigate ? 'bg-blue-50' : 'bg-gray-50'}`}>
              <p className="text-gray-700">{irrigation.reason}</p>
              {irrigation.waterAmount && (
                <p className="mt-2 text-sm text-blue-600 font-medium">
                  Προτεινόμενη ποσότητα: {irrigation.waterAmount}
                </p>
              )}
              {irrigation.nextIrrigationDate && (
                <p className="mt-1 text-sm text-gray-500">
                  Επόμενο πότισμα: {new Date(irrigation.nextIrrigationDate).toLocaleDateString('el-GR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Disease Risks Section */}
      {diseaseRisks.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection('diseases')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-gray-800">Κίνδυνοι Ασθενειών</span>
              {diseaseRisks.some(r => r.riskLevel === 'high') && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                  Υψηλός κίνδυνος
                </span>
              )}
            </div>
            {expandedSection === 'diseases' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSection === 'diseases' && (
            <div className="px-6 pb-4 space-y-3">
              {diseaseRisks.map((risk, i) => (
                <DiseaseRiskCard key={i} risk={risk} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500 text-center">
        Τελευταία ενημέρωση: {new Date(data.lastUpdated).toLocaleTimeString('el-GR')}
        {' • '}
        {weather.location.name}
      </div>
    </div>
  )
}

function AlertCard({ alert }: { alert: WeatherAlert }) {
  const severityColors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger: 'bg-red-50 border-red-200 text-red-800'
  }

  const severityIcons = {
    info: '💡',
    warning: '⚠️',
    danger: '🚨'
  }

  return (
    <div className={`p-4 rounded-xl border ${severityColors[alert.severity]}`}>
      <div className="flex items-start gap-2">
        <span className="text-xl">{severityIcons[alert.severity]}</span>
        <div className="flex-1">
          <h4 className="font-semibold">{alert.title}</h4>
          <p className="text-sm mt-1">{alert.message}</p>
          <p className="text-sm mt-2 opacity-80">
            <strong>Σύσταση:</strong> {alert.recommendation}
          </p>
        </div>
      </div>
    </div>
  )
}

function DiseaseRiskCard({ risk }: { risk: DiseaseRisk }) {
  const riskColors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700'
  }

  const riskLabels = {
    low: 'Χαμηλός',
    medium: 'Μέτριος',
    high: 'Υψηλός'
  }

  return (
    <div className="p-4 rounded-xl bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-800">{risk.greekName}</h4>
        <span className={`text-xs px-2 py-1 rounded-full ${riskColors[risk.riskLevel]}`}>
          {riskLabels[risk.riskLevel]} ({risk.riskPercentage}%)
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">
        <strong>Συνθήκες:</strong> {risk.conditions}
      </p>
      <p className="text-sm text-gray-600">
        <strong>Πρόληψη:</strong> {risk.prevention}
      </p>
    </div>
  )
}

function WeatherSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="bg-gradient-to-r from-blue-400 to-blue-500 p-6">
        <div className="h-6 w-48 bg-white/30 rounded mb-4" />
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/30 rounded-full" />
          <div>
            <div className="h-10 w-20 bg-white/30 rounded mb-2" />
            <div className="h-4 w-24 bg-white/30 rounded" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white/20 rounded-lg h-16" />
          ))}
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="h-12 bg-gray-100 rounded-xl" />
        <div className="h-12 bg-gray-100 rounded-xl" />
        <div className="h-12 bg-gray-100 rounded-xl" />
      </div>
    </div>
  )
}
