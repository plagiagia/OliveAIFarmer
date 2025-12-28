'use client'

import { ACTIVITY_TYPE_ICONS, ACTIVITY_TYPE_LABELS, ActivityFormData, ActivityWithTrees, ActivityType } from '@/types/activity'
import { Calendar, CheckCircle2, Clock, CloudSun, Euro, FileText, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ActivityFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ActivityFormData) => Promise<void>
  farmId: string
  farmCoordinates?: string | null // Farm coordinates for weather fetching
  activity?: ActivityWithTrees | null
  isLoading?: boolean
}

export default function ActivityFormModal({
  isOpen,
  onClose,
  onSubmit,
  farmId,
  farmCoordinates,
  activity,
  isLoading = false
}: ActivityFormModalProps) {
  const [formData, setFormData] = useState<ActivityFormData>({
    type: 'WATERING',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    cost: '',
    weather: '',
    notes: '',
    completed: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [weatherLoading, setWeatherLoading] = useState(false)

  // Parse coordinates helper
  const parseCoordinates = (coordString: string): { lat: number; lng: number } | null => {
    try {
      const [lat, lng] = coordString.split(',').map(s => parseFloat(s.trim()))
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng }
      }
    } catch {
      // Ignore parse errors
    }
    return null
  }

  // Check date relationship to today
  const getDateRelation = (dateString: string): 'past' | 'today' | 'future' => {
    const today = new Date().toISOString().split('T')[0]
    if (dateString === today) return 'today'
    return dateString < today ? 'past' : 'future'
  }

  // Helper to check if date is today
  const isToday = (dateString: string) => getDateRelation(dateString) === 'today'

  // Fetch current weather from API for today/future
  const fetchWeatherFromAPI = async (dateString: string) => {
    if (!farmCoordinates) {
      setFormData(prev => ({ ...prev, weather: '' }))
      return
    }

    const coords = parseCoordinates(farmCoordinates)
    if (!coords) {
      setFormData(prev => ({ ...prev, weather: '' }))
      return
    }

    setWeatherLoading(true)
    try {
      const response = await fetch(`/api/weather?lat=${coords.lat}&lon=${coords.lng}`)
      if (!response.ok) {
        setFormData(prev => ({ ...prev, weather: '' }))
        return
      }

      const data = await response.json()
      const relation = getDateRelation(dateString)

      if (relation === 'today') {
        // Today - use current weather
        if (data.weather?.current) {
          const current = data.weather.current
          const weatherString = `${current.description}, ${current.temperature}°C, Υγρασία ${current.humidity}%, Άνεμος ${current.windSpeed.toFixed(1)} m/s`
          setFormData(prev => ({ ...prev, weather: weatherString }))
        } else {
          setFormData(prev => ({ ...prev, weather: '' }))
        }
      } else if (relation === 'future') {
        // Future date - try to find in forecast
        if (data.weather?.forecast && Array.isArray(data.weather.forecast)) {
          const forecastDay = data.weather.forecast.find((day: { date: string | Date; tempMax: number; tempMin: number; humidity: number; windSpeed: number; description: string }) => {
            // Handle both Date objects (serialized as ISO strings) and plain strings
            const dayDateStr = typeof day.date === 'string'
              ? day.date.split('T')[0]
              : new Date(day.date).toISOString().split('T')[0]
            return dayDateStr === dateString
          })

          if (forecastDay) {
            const weatherString = `${forecastDay.description}, ${forecastDay.tempMax}°C/${forecastDay.tempMin}°C, Υγρασία ${forecastDay.humidity}%, Άνεμος ${forecastDay.windSpeed.toFixed(1)} m/s`
            setFormData(prev => ({ ...prev, weather: weatherString }))
          } else {
            // Future date not in forecast range (beyond ~5 days)
            setFormData(prev => ({ ...prev, weather: '' }))
          }
        } else {
          setFormData(prev => ({ ...prev, weather: '' }))
        }
      } else {
        // Shouldn't happen, but handle gracefully
        setFormData(prev => ({ ...prev, weather: '' }))
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error)
      setFormData(prev => ({ ...prev, weather: '' }))
    } finally {
      setWeatherLoading(false)
    }
  }

  // Fetch historical weather for a past date
  const fetchHistoricalWeather = async (dateString: string) => {
    if (!farmId) {
      setFormData(prev => ({ ...prev, weather: '' }))
      return
    }

    setWeatherLoading(true)
    try {
      const response = await fetch(`/api/weather/history?farmId=${farmId}&date=${dateString}`)
      if (!response.ok) {
        setFormData(prev => ({ ...prev, weather: '' }))
        return
      }

      const data = await response.json()
      if (data.record) {
        const record = data.record
        // Format weather string from historical data
        const weatherString = `${record.condition}, ${Math.round(record.tempAvg)}°C, Υγρασία ${record.humidity}%, Άνεμος ${record.windSpeed.toFixed(1)} m/s`
        setFormData(prev => ({ ...prev, weather: weatherString }))
      } else {
        // No historical data found, leave blank
        setFormData(prev => ({ ...prev, weather: '' }))
      }
    } catch (error) {
      console.error('Failed to fetch historical weather:', error)
      setFormData(prev => ({ ...prev, weather: '' }))
    } finally {
      setWeatherLoading(false)
    }
  }

  // Fetch weather based on selected date
  const fetchWeatherForDate = async (dateString: string) => {
    const relation = getDateRelation(dateString)
    if (relation === 'past') {
      // Past date - try to get from historical data
      await fetchHistoricalWeather(dateString)
    } else {
      // Today or future - get from weather API
      await fetchWeatherFromAPI(dateString)
    }
  }

  // Populate form when editing or reset for new
  useEffect(() => {
    if (activity) {
      setFormData({
        type: activity.type,
        title: activity.title,
        description: activity.description || '',
        date: new Date(activity.date).toISOString().split('T')[0],
        duration: activity.duration?.toString() || '',
        cost: activity.cost?.toString() || '',
        weather: activity.weather || '',
        notes: activity.notes || '',
        completed: activity.completed
      })
    } else if (isOpen) {
      // Reset form for new activity
      const todayDate = new Date().toISOString().split('T')[0]
      setFormData({
        type: 'WATERING',
        title: '',
        description: '',
        date: todayDate,
        duration: '',
        cost: '',
        weather: '',
        notes: '',
        completed: false
      })
      // Auto-fetch weather for today
      fetchWeatherForDate(todayDate)
    }
    setErrors({})
  }, [activity, isOpen, farmCoordinates, farmId])

  // Watch for date changes and fetch weather accordingly (only for new activities)
  const handleDateChange = async (newDate: string) => {
    setFormData(prev => ({ ...prev, date: newDate }))
    // Only auto-fetch weather for new activities, not when editing
    if (!activity) {
      await fetchWeatherForDate(newDate)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Ο τίτλος είναι υποχρεωτικός'
    }

    if (!formData.date) {
      newErrors.date = 'Η ημερομηνία είναι υποχρεωτική'
    }

    if (formData.duration && (isNaN(Number(formData.duration)) || Number(formData.duration) < 0)) {
      newErrors.duration = 'Η διάρκεια πρέπει να είναι θετικός αριθμός'
    }

    if (formData.cost && (isNaN(Number(formData.cost)) || Number(formData.cost) < 0)) {
      newErrors.cost = 'Το κόστος πρέπει να είναι θετικός αριθμός'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    await onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {activity ? 'Επεξεργασία Δραστηριότητας' : 'Νέα Δραστηριότητα'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Τύπος Δραστηριότητας *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ActivityType }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoading}
            >
              {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {ACTIVITY_TYPE_ICONS[value as ActivityType]} {label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Τίτλος *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="π.χ. Πότισμα βόρειου τμήματος"
              disabled={isLoading}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Περιγραφή
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Προαιρετική περιγραφή της δραστηριότητας..."
              disabled={isLoading}
            />
          </div>

          {/* Date and Duration Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Ημερομηνία *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Διάρκεια (λεπτά)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.duration ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="60"
                min="0"
                disabled={isLoading}
              />
              {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
            </div>
          </div>

          {/* Cost and Weather Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Euro className="w-4 h-4 inline mr-1" />
                Κόστος (€)
              </label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.cost ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={isLoading}
              />
              {errors.cost && <p className="mt-1 text-sm text-red-600">{errors.cost}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CloudSun className="w-4 h-4 inline mr-1" />
                Καιρικές Συνθήκες
                {weatherLoading && (
                  <Loader2 className="w-3 h-3 inline ml-2 animate-spin text-blue-500" />
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.weather}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-blue-50 text-gray-700 cursor-default"
                  placeholder={weatherLoading ? 'Φόρτωση καιρού...' : farmCoordinates ? 'Αυτόματη καταγραφή' : 'Δεν υπάρχουν συντεταγμένες'}
                />
                {formData.weather && !weatherLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    Αυτόματο
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {!formData.weather && !weatherLoading
                  ? getDateRelation(formData.date) === 'past'
                    ? 'Δεν υπάρχουν ιστορικά δεδομένα για αυτή την ημερομηνία'
                    : getDateRelation(formData.date) === 'future'
                      ? 'Η ημερομηνία είναι εκτός του εύρους πρόβλεψης (5 ημέρες)'
                      : 'Αναμονή για δεδομένα καιρού...'
                  : 'Ο καιρός καταγράφεται αυτόματα (τρέχων, πρόβλεψη ή ιστορικός)'}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Σημειώσεις
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Επιπλέον σημειώσεις ή παρατηρήσεις..."
              disabled={isLoading}
            />
          </div>

          {/* Completed Checkbox */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.completed}
                onChange={(e) => setFormData(prev => ({ ...prev, completed: e.target.checked }))}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                disabled={isLoading}
              />
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                Η δραστηριότητα έχει ολοκληρωθεί
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={isLoading}
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>
                {activity ? 'Ενημέρωση' : 'Δημιουργία'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
