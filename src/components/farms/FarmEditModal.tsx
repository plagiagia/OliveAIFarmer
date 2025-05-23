'use client'

import LocationAutocomplete from '@/components/map/LocationAutocomplete'
import MapboxMap from '@/components/map/MapboxMap'
import { convertFromStremmata, convertToStremmata, type AreaUnit } from '@/lib/area-conversions'
import { formatCoordinates, parseCoordinates } from '@/lib/mapbox-utils'
import { AlertTriangle, Loader2, MapPin, Save, Trash2, X } from 'lucide-react'
import { useState } from 'react'

interface LocationSuggestion {
  id: string
  place_name: string
  center: [number, number] // [longitude, latitude]
}

interface FarmEditModalProps {
  farm: any
  onClose: () => void
  onSuccess: () => void
}

export default function FarmEditModal({ farm, onClose, onSuccess }: FarmEditModalProps) {
  const [formData, setFormData] = useState({
    name: farm.name || '',
    location: farm.location || '',
    longitude: parseCoordinates(farm.coordinates)?.lng || null as number | null,
    latitude: parseCoordinates(farm.coordinates)?.lat || null as number | null,
    totalArea: farm.totalArea ? convertFromStremmata(farm.totalArea, 'στρέμματα').toString() : '',
    areaUnit: 'στρέμματα' as AreaUnit,
    description: farm.description || '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // Convert area to stremmata for storage
      const areaInStremmata = formData.totalArea 
        ? convertToStremmata(parseFloat(formData.totalArea), formData.areaUnit)
        : null

      // Format coordinates for storage
      const coordinates = formData.longitude && formData.latitude
        ? formatCoordinates(formData.longitude, formData.latitude)
        : null

      const response = await fetch(`/api/farms/${farm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          coordinates,
          totalArea: areaInStremmata,
          description: formData.description,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
      } else {
        setError(data.error || 'Αποτυχία ενημέρωσης ελαιώνα')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setError('Αποτυχία ενημέρωσης ελαιώνα. Προσπαθήστε ξανά.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError('')

    try {
      const response = await fetch(`/api/farms/${farm.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to dashboard after successful deletion
        window.location.href = '/dashboard?deleted=true'
      } else {
        setError(data.error || 'Αποτυχία διαγραφής ελαιώνα')
      }
    } catch (error) {
      console.error('Delete error:', error)
      setError('Αποτυχία διαγραφής ελαιώνα. Προσπαθήστε ξανά.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('') // Clear error when user types
  }

  // Handle location selection from autocomplete
  const handleLocationSelect = (location: LocationSuggestion) => {
    const [lng, lat] = location.center
    setFormData(prev => ({
      ...prev,
      location: location.place_name,
      longitude: lng,
      latitude: lat,
    }))
  }

  // Handle location selection from map
  const handleMapLocationSelect = (lng: number, lat: number) => {
    setFormData(prev => ({
      ...prev,
      longitude: lng,
      latitude: lat,
    }))
  }

  // Check if form is valid
  const isFormValid = formData.name.trim() && formData.location.trim()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🫒</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Επεξεργασία Ελαιώνα</h3>
              <p className="text-sm text-gray-600">Ενημερώστε τις πληροφορίες του ελαιώνα σας</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-lg">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Σφάλμα:</strong>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-lg font-bold text-red-900 mb-2">
                  Επιβεβαίωση Διαγραφής
                </h4>
                <p className="text-red-800 mb-4">
                  Είστε σίγουροι ότι θέλετε να διαγράψετε τον ελαιώνα <strong>"{farm.name}"</strong>;
                </p>
                <p className="text-sm text-red-700 mb-4">
                  ⚠️ Αυτή η ενέργεια θα διαγράψει επίσης όλα τα δέντρα, τμήματα, δραστηριότητες και συγκομιδές που σχετίζονται με αυτόν τον ελαιώνα. Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Διαγραφή...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Ναι, Διαγραφή</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Ακύρωση
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              {/* Farm Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Όνομα Ελαιώνα *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="π.χ. Ελαιώνας Μεσσηνίας"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 placeholder-gray-400"
                />
              </div>

              {/* Location with Autocomplete */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Τοποθεσία *
                </label>
                <LocationAutocomplete
                  value={formData.location}
                  onChange={(value) => handleInputChange('location', value)}
                  onLocationSelect={handleLocationSelect}
                  placeholder="Αναζητήστε την τοποθεσία του ελαιώνα σας..."
                  required
                />
              </div>

              {/* Coordinates Display */}
              {formData.longitude && formData.latitude && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Συντεταγμένες GPS:</span>
                  </div>
                  <p className="text-sm text-blue-800 mt-1">
                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </p>
                </div>
              )}

              {/* Area */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Συνολική Έκταση
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Area Value Input */}
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.totalArea}
                    onChange={(e) => handleInputChange('totalArea', e.target.value)}
                    placeholder="π.χ. 52"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 placeholder-gray-400"
                  />
                  
                  {/* Unit Selection */}
                  <select
                    value={formData.areaUnit}
                    onChange={(e) => handleInputChange('areaUnit', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 bg-white"
                  >
                    <option value="στρέμματα">Στρέμματα</option>
                    <option value="εκτάρια">Εκτάρια</option>
                    <option value="τετραγωνικά μέτρα">Τ.μ.</option>
                    <option value="τετραγωνικά χιλιόμετρα">Χλμ²</option>
                  </select>
                </div>
                
                {/* Conversion Preview */}
                {formData.totalArea && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700">
                      <strong>Μετατροπή:</strong> {formData.totalArea} {formData.areaUnit} = {convertToStremmata(parseFloat(formData.totalArea), formData.areaUnit).toFixed(1)} στρέμματα
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Περιγραφή
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Περιγράψτε τον ελαιώνα σας (προαιρετικό)..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 placeholder-gray-400 resize-none"
                />
              </div>
            </div>

            {/* Right Column - Map */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Χάρτης Ελαιώνα
                </label>
                
                <MapboxMap
                  longitude={formData.longitude || undefined}
                  latitude={formData.latitude || undefined}
                  markerLongitude={formData.longitude || undefined}
                  markerLatitude={formData.latitude || undefined}
                  zoom={formData.longitude && formData.latitude ? 14 : 6}
                  height={400}
                  interactive={true}
                  showMarker={!!(formData.longitude && formData.latitude)}
                  onLocationSelect={handleMapLocationSelect}
                  className="border-2 border-gray-300 focus-within:border-green-500 rounded-xl"
                />
                
                {!formData.longitude || !formData.latitude ? (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Κάντε κλικ στον χάρτη για να τοποθετήσετε τον ελαιώνα σας με ακρίβεια
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Η τοποθεσία του ελαιώνα έχει οριστεί
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 mt-8 border-t border-gray-200">
            {/* Delete Button */}
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Διαγραφή Ελαιώνα</span>
            </button>

            {/* Save/Cancel Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Ακύρωση
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Αποθήκευση...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Αποθήκευση Αλλαγών</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 