'use client'

import { ACTIVITY_TYPE_ICONS, ACTIVITY_TYPE_LABELS, ActivityFormData, ActivityWithTrees } from '@/lib/types/activity'
import { ActivityType } from '@prisma/client'
import { Calendar, CheckCircle2, Clock, CloudSun, Euro, FileText, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ActivityFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ActivityFormData) => Promise<void>
  farmId: string
  trees: Array<{
    id: string
    treeNumber: string
    variety: string
  }>
  activity?: ActivityWithTrees | null
  isLoading?: boolean
}

export default function ActivityFormModal({
  isOpen,
  onClose,
  onSubmit,
  farmId,
  trees,
  activity,
  isLoading = false
}: ActivityFormModalProps) {
  const [formData, setFormData] = useState<ActivityFormData>({
    type: ActivityType.WATERING,
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    cost: '',
    weather: '',
    notes: '',
    completed: false,
    selectedTrees: []
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Populate form when editing
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
        completed: activity.completed,
        selectedTrees: activity.treeActivities?.map(ta => ta.treeId) || []
      })
    } else {
      // Reset form for new activity
      setFormData({
        type: ActivityType.WATERING,
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        duration: '',
        cost: '',
        weather: '',
        notes: '',
        completed: false,
        selectedTrees: []
      })
    }
    setErrors({})
  }, [activity, isOpen])

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

  const handleTreeSelection = (treeId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTrees: prev.selectedTrees.includes(treeId)
        ? prev.selectedTrees.filter(id => id !== treeId)
        : [...prev.selectedTrees, treeId]
    }))
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
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
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
              </label>
              <input
                type="text"
                value={formData.weather}
                onChange={(e) => setFormData(prev => ({ ...prev, weather: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="π.χ. Ηλιόλουστο, 25°C"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Tree Selection */}
          {trees.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Επιλογή Δέντρων
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Επιλέξτε τα δέντρα στα οποία εφαρμόστηκε η δραστηριότητα (προαιρετικό)
              </p>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {trees.map(tree => (
                    <label
                      key={tree.id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedTrees.includes(tree.id)}
                        onChange={() => handleTreeSelection(tree.id)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        disabled={isLoading}
                      />
                      <span className="text-sm text-gray-700">
                        #{tree.treeNumber} - {tree.variety}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Επιλεγμένα: {formData.selectedTrees.length} από {trees.length} δέντρα
              </p>
            </div>
          )}

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