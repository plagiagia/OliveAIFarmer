'use client'

import { ACTIVITY_TYPE_ICONS, ACTIVITY_TYPE_LABELS, ActivityType } from '@/types/activity'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Euro,
  FileText,
  Loader2,
  Lightbulb,
  X,
  AlertCircle,
  CheckCircle,
  Droplets,
  Wind,
  Thermometer,
  CloudRain
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

interface Farm {
  id: string
  name: string
  location: string
  coordinates: string | null
}

interface AISuggestion {
  type: 'warning' | 'info' | 'success'
  icon: 'wind' | 'rain' | 'water' | 'temperature' | 'activity'
  title: string
  message: string
  farmId?: string
  farmName?: string
}

interface CalendarActivityModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  farms: Farm[]
  onSuccess: () => void
}

export default function CalendarActivityModal({
  isOpen,
  onClose,
  selectedDate,
  farms,
  onSuccess
}: CalendarActivityModalProps) {
  const [activityType, setActivityType] = useState<ActivityType>('WATERING')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')
  const [completed, setCompleted] = useState(false)

  const [selectedFarms, setSelectedFarms] = useState<string[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setActivityType('WATERING')
      setTitle('')
      setDescription('')
      setDuration('')
      setCost('')
      setNotes('')
      setCompleted(false)
      setSelectedFarms([])
      setAiSuggestions([])
      setErrors({})
    }
  }, [isOpen])

  // Fetch AI suggestions when activity type or farms change
  const fetchAISuggestions = useCallback(async () => {
    if (selectedFarms.length === 0) {
      setAiSuggestions([])
      return
    }

    setIsLoadingSuggestions(true)
    try {
      const response = await fetch('/api/activities/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmIds: selectedFarms,
          activityType,
          date: selectedDate.toISOString()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Failed to fetch AI suggestions:', error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [selectedFarms, activityType, selectedDate])

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchAISuggestions()
    }, 300)
    return () => clearTimeout(debounce)
  }, [fetchAISuggestions])

  // Auto-generate title based on activity type
  useEffect(() => {
    if (!title || Object.values(ACTIVITY_TYPE_LABELS).some(label => title.startsWith(label))) {
      setTitle(ACTIVITY_TYPE_LABELS[activityType])
    }
  }, [activityType, title])

  const toggleFarmSelection = (farmId: string) => {
    setSelectedFarms(prev =>
      prev.includes(farmId)
        ? prev.filter(id => id !== farmId)
        : [...prev, farmId]
    )
  }

  const selectAllFarms = () => {
    setSelectedFarms(farms.map(f => f.id))
  }

  const deselectAllFarms = () => {
    setSelectedFarms([])
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Ο τίτλος είναι υποχρεωτικός'
    }

    if (selectedFarms.length === 0) {
      newErrors.farms = 'Επιλέξτε τουλάχιστον έναν ελαιώνα'
    }

    if (duration && (isNaN(Number(duration)) || Number(duration) < 0)) {
      newErrors.duration = 'Η διάρκεια πρέπει να είναι θετικός αριθμός'
    }

    if (cost && (isNaN(Number(cost)) || Number(cost) < 0)) {
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

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/activities/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmIds: selectedFarms,
          type: activityType,
          title,
          description: description || undefined,
          date: selectedDate.toISOString(),
          duration: duration ? parseInt(duration) : undefined,
          cost: cost ? parseFloat(cost) : undefined,
          notes: notes || undefined,
          completed
        })
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || 'Σφάλμα κατά τη δημιουργία' })
      }
    } catch (error) {
      console.error('Failed to create activities:', error)
      setErrors({ submit: 'Σφάλμα σύνδεσης' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSuggestionIcon = (icon: AISuggestion['icon']) => {
    switch (icon) {
      case 'wind': return <Wind className="w-4 h-4" />
      case 'rain': return <CloudRain className="w-4 h-4" />
      case 'water': return <Droplets className="w-4 h-4" />
      case 'temperature': return <Thermometer className="w-4 h-4" />
      case 'activity': return <Calendar className="w-4 h-4" />
      default: return <Lightbulb className="w-4 h-4" />
    }
  }

  const getSuggestionStyles = (type: AISuggestion['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Νέα Δραστηριότητα
            </h2>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: el })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Activity Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Activity Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Τύπος Δραστηριότητας *
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setActivityType(value as ActivityType)}
                        className={`
                          p-3 rounded-xl text-center transition-all duration-200
                          ${activityType === value
                            ? 'bg-olive-100 border-2 border-olive-500 text-olive-800'
                            : 'bg-gray-50 border-2 border-transparent hover:border-gray-200 text-gray-600'}
                        `}
                      >
                        <span className="text-xl block mb-1">
                          {ACTIVITY_TYPE_ICONS[value as ActivityType]}
                        </span>
                        <span className="text-xs">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Τίτλος *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-transparent ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="π.χ. Πότισμα βόρειου τμήματος"
                    disabled={isSubmitting}
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Περιγραφή
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-transparent resize-none"
                    placeholder="Προαιρετική περιγραφή της δραστηριότητας..."
                    disabled={isSubmitting}
                  />
                </div>

                {/* Duration and Cost Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Διάρκεια (λεπτά)
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-transparent ${
                        errors.duration ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="60"
                      min="0"
                      disabled={isSubmitting}
                    />
                    {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Euro className="w-4 h-4 inline mr-1" />
                      Κόστος (€)
                    </label>
                    <input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-transparent ${
                        errors.cost ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      disabled={isSubmitting}
                    />
                    {errors.cost && <p className="mt-1 text-sm text-red-600">{errors.cost}</p>}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Σημειώσεις
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-transparent resize-none"
                    placeholder="Επιπλέον σημειώσεις..."
                    disabled={isSubmitting}
                  />
                </div>

                {/* Completed Checkbox */}
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={completed}
                      onChange={(e) => setCompleted(e.target.checked)}
                      className="w-4 h-4 text-olive-600 border-gray-300 rounded focus:ring-olive-500"
                      disabled={isSubmitting}
                    />
                    <CheckCircle2 className="w-4 h-4 text-olive-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Η δραστηριότητα έχει ολοκληρωθεί
                    </span>
                  </label>
                </div>
              </div>

              {/* Right Column - Farm Selection & AI Suggestions */}
              <div className="space-y-6">
                {/* Farm Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Επιλογή Ελαιώνων *
                    </label>
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={selectAllFarms}
                        className="text-olive-600 hover:text-olive-700"
                      >
                        Όλοι
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={deselectAllFarms}
                        className="text-gray-500 hover:text-gray-600"
                      >
                        Κανένας
                      </button>
                    </div>
                  </div>

                  <div className={`border rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto ${
                    errors.farms ? 'border-red-500' : 'border-gray-200'
                  }`}>
                    {farms.map((farm) => (
                      <label
                        key={farm.id}
                        className={`
                          flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
                          ${selectedFarms.includes(farm.id)
                            ? 'bg-olive-50 border border-olive-200'
                            : 'hover:bg-gray-50 border border-transparent'}
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFarms.includes(farm.id)}
                          onChange={() => toggleFarmSelection(farm.id)}
                          className="w-4 h-4 text-olive-600 border-gray-300 rounded focus:ring-olive-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">
                            {farm.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {farm.location}
                          </div>
                        </div>
                        {selectedFarms.includes(farm.id) && (
                          <CheckCircle className="w-4 h-4 text-olive-600 shrink-0" />
                        )}
                      </label>
                    ))}
                  </div>
                  {errors.farms && <p className="mt-1 text-sm text-red-600">{errors.farms}</p>}

                  <p className="mt-2 text-xs text-gray-500">
                    {selectedFarms.length} από {farms.length} επιλεγμένοι
                  </p>
                </div>

                {/* AI Suggestions */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <label className="block text-sm font-medium text-gray-700">
                      Έξυπνες Προτάσεις
                    </label>
                    {isLoadingSuggestions && (
                      <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                    )}
                  </div>

                  <div className="space-y-2">
                    {selectedFarms.length === 0 ? (
                      <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 text-center">
                        Επιλέξτε ελαιώνες για να δείτε προτάσεις
                      </div>
                    ) : aiSuggestions.length === 0 && !isLoadingSuggestions ? (
                      <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Όλα δείχνουν καλά για αυτή τη δραστηριότητα!
                      </div>
                    ) : (
                      aiSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className={`text-sm rounded-xl p-3 border ${getSuggestionStyles(suggestion.type)}`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="shrink-0 mt-0.5">
                              {suggestion.type === 'warning' ? (
                                <AlertTriangle className="w-4 h-4" />
                              ) : (
                                getSuggestionIcon(suggestion.icon)
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{suggestion.title}</div>
                              <div className="text-xs mt-0.5 opacity-80">
                                {suggestion.message}
                              </div>
                              {suggestion.farmName && (
                                <div className="text-xs mt-1 opacity-60">
                                  📍 {suggestion.farmName}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.submit}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                disabled={isSubmitting}
              >
                Ακύρωση
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-700 hover:to-olive-600 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <span>
                  Δημιουργία {selectedFarms.length > 1 ? `(${selectedFarms.length} ελαιώνες)` : ''}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
