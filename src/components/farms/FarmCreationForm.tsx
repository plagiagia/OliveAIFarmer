'use client'

import LocationAutocomplete from '@/components/map/LocationAutocomplete'
import MapboxMap from '@/components/map/MapboxMap'
import { convertToStremmata, type AreaUnit } from '@/lib/area-conversions'
import { formatCoordinates } from '@/lib/mapbox-utils'
import { ArrowLeft, Loader2, MapPin, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface FarmCreationFormProps {
  userId: string
}

interface LocationSuggestion {
  id: string
  place_name: string
  center: [number, number] // [longitude, latitude]
}

export default function FarmCreationForm({ userId }: FarmCreationFormProps) {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    longitude: null as number | null,
    latitude: null as number | null,
    totalArea: '',
    areaUnit: 'στρέμματα' as AreaUnit,
    treeCount: '',
    oliveVariety: '',
    description: '',
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showMap, setShowMap] = useState(false)

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

      const response = await fetch('/api/farms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          coordinates,
          totalArea: areaInStremmata,
          treeCount: formData.treeCount ? parseInt(formData.treeCount) : null,
          oliveVariety: formData.oliveVariety || null,
          description: formData.description,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to dashboard with success message
        router.push('/dashboard?created=true')
      } else {
        setError(data.error || 'Αποτυχία δημιουργίας ελαιώνα')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setError('Αποτυχία δημιουργίας ελαιώνα. Προσπαθήστε ξανά.')
    } finally {
      setIsSubmitting(false)
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
    setShowMap(true) // Show map when location is selected
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-600 hover:text-green-700 transition-colors mr-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Επιστροφή</span>
            </button>
            <div className="text-3xl">🫒</div>
            <div className="ml-3">
              <h1 className="text-2xl font-bold text-gray-800">Νέος Ελαιώνας</h1>
              <p className="text-gray-600 text-sm">Προσθέστε τον ελαιώνα σας στον χάρτη</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-lg mb-6">
              <div className="flex">
                <div className="text-lg mr-2">⚠️</div>
                <div>
                  <strong>Σφάλμα:</strong>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
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
                    className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 placeholder-gray-400"
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
                  <p className="text-sm text-gray-500 mt-2">
                    💡 Ξεκινήστε να πληκτρολογείτε για αυτόματη συμπλήρωση
                  </p>
                </div>

                {/* Coordinates Display */}
                {formData.longitude && formData.latitude && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center text-green-700">
                      <MapPin className="w-5 h-5 mr-2" />
                      <div>
                        <p className="font-medium">Συντεταγμένες GPS</p>
                        <p className="text-sm">
                          {formatCoordinates(formData.longitude, formData.latitude)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Area with Unit Selection */}
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
                      className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 placeholder-gray-400"
                    />
                    
                    {/* Unit Selection */}
                    <select
                      value={formData.areaUnit}
                      onChange={(e) => handleInputChange('areaUnit', e.target.value)}
                      className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 bg-white"
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
                  
                  <p className="text-sm text-gray-500 mt-2">
                    Προαιρετικό - μπορείτε να το προσθέσετε αργότερα
                  </p>
                </div>

                {/* Tree Count */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Αριθμός Δέντρων
                  </label>
                  <input
                    type="number"
                    value={formData.treeCount}
                    onChange={(e) => handleInputChange('treeCount', e.target.value)}
                    placeholder="π.χ. 100"
                    className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 placeholder-gray-400"
                  />
                </div>

                {/* Olive Variety */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Ποικιλία Ελαιάς
                  </label>
                  <select
                    value={formData.oliveVariety}
                    onChange={(e) => handleInputChange('oliveVariety', e.target.value)}
                    className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 bg-white"
                  >
                    <option value="">Επιλέξτε ποικιλία (προαιρετικό)</option>
                    <option value="Κορωνέϊκη">Κορωνέϊκη (Καλαμάτας)</option>
                    <option value="Καλαμών">Καλαμών (Επιτραπέζια)</option>
                    <option value="Μανάκι">Μανάκι (Χίου)</option>
                    <option value="Κολοβή">Κολοβή (Αίγινας)</option>
                    <option value="Αμφίσσης">Αμφίσσης (Κονσερβολιά)</option>
                    <option value="Χονδρολιά">Χονδρολιά (Χαλκιδικής)</option>
                    <option value="Τσουνάτη">Τσουνάτη (Κέρκυρας)</option>
                    <option value="Μαστοειδής">Μαστοειδής (Κω)</option>
                    <option value="Λιανολιά">Λιανολιά (Σάμου)</option>
                    <option value="Άλλη">Άλλη ποικιλία</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-2">
                    Επιλέξτε την κύρια ποικιλία ελαιάς του ελαιώνα σας
                  </p>
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
                    className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 placeholder-gray-400 resize-none"
                  />
                </div>
              </div>

              {/* Right Column - Map */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Χάρτης Ελαιώνα
                  </label>
                  
                  {formData.location ? (
                    <div className="space-y-4">
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
                        className="border-2 border-gray-300 focus-within:border-green-500"
                      />
                      
                      {!formData.longitude || !formData.latitude ? (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-700 flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            Κάντε κλικ στον χάρτη για να τοποθετήσετε τον ελαιώνα σας με ακρίβεια
                          </p>
                        </div>
                      ) : (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="text-sm text-green-700 flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            Τέλεια! Η τοποθεσία του ελαιώνα σας έχει επιλεγεί
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl h-96 flex flex-col items-center justify-center text-gray-500">
                      <MapPin className="w-12 h-12 mb-4" />
                      <p className="text-lg font-medium mb-2">Επιλέξτε πρώτα τοποθεσία</p>
                      <p className="text-sm text-center max-w-xs">
                        Αναζητήστε την τοποθεσία του ελαιώνα σας για να εμφανιστεί ο χάρτης
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-4 px-8 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Δημιουργία...
                  </>
                ) : (
                  <>
                    <Save className="w-6 h-6" />
                    Δημιουργία Ελαιώνα
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Help Section */}
          <div className="mt-8 bg-green-50 rounded-2xl p-6 border border-green-200">
            <h3 className="font-bold text-green-800 mb-3 flex items-center">
              <span className="text-xl mr-2">💡</span>
              Συμβουλές για το ΕλαιοLog
            </h3>
            <ul className="text-sm text-green-700 space-y-2">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>Χρησιμοποιήστε την αυτόματη συμπλήρωση για γρήγορη εύρεση τοποθεσίας</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>Τοποθετήστε τον ελαιώνα σας με ακρίβεια στον χάρτη για καλύτερη παρακολούθηση</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>Οι συντεταγμένες GPS αποθηκεύονται αυτόματα από τον χάρτη</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>Προσθέστε τον αριθμό και την ποικιλία των δέντρων για πλήρη καταγραφή</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>Μετά τη δημιουργία θα μπορείτε να προσθέσετε δραστηριότητες και συγκομιδές</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 