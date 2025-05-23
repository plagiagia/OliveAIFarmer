'use client'

import { ArrowLeft, Loader2, MapPin, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface FarmCreationFormProps {
  userId: string
}

// Common Greek olive growing regions
const GREEK_LOCATIONS = [
  'Καλαμάτα, Μεσσηνία',
  'Κρήτη, Ηράκλειο',
  'Κρήτη, Χανιά',
  'Κρήτη, Ρέθυμνο',
  'Κρήτη, Λασίθι',
  'Λέσβος, Βόρειο Αιγαίο',
  'Κόρινθος, Πελοπόννησος',
  'Σπάρτη, Λακωνία',
  'Άργος, Αργολίδα',
  'Αμφίκλεια, Φωκίδα',
  'Λαμία, Φθιώτιδα',
  'Βόλος, Μαγνησία',
  'Τρίκαλα, Θεσσαλία',
  'Άλλη τοποθεσία'
]

export default function FarmCreationForm({ userId }: FarmCreationFormProps) {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    customLocation: '',
    coordinates: '',
    totalArea: '',
    description: '',
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // Use custom location if "Άλλη τοποθεσία" is selected
      const finalLocation = formData.location === 'Άλλη τοποθεσία' 
        ? formData.customLocation 
        : formData.location

      const response = await fetch('/api/farms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          location: finalLocation,
          coordinates: formData.coordinates,
          totalArea: formData.totalArea,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="max-w-2xl mx-auto">
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
              <p className="text-gray-600 text-sm">Προσθέστε τον ελαιώνα σας</p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Location */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Τοποθεσία *
              </label>
              <select
                required
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 bg-white"
              >
                <option value="">Επιλέξτε τοποθεσία</option>
                {GREEK_LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Location Input */}
            {formData.location === 'Άλλη τοποθεσία' && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Συγκεκριμένη Τοποθεσία *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customLocation}
                  onChange={(e) => handleInputChange('customLocation', e.target.value)}
                  placeholder="π.χ. Μυλοπόταμος, Ρέθυμνο"
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 placeholder-gray-400"
                />
              </div>
            )}

            {/* Total Area */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Συνολική Έκταση (εκτάρια)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.totalArea}
                onChange={(e) => handleInputChange('totalArea', e.target.value)}
                placeholder="π.χ. 5.2"
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 placeholder-gray-400"
              />
              <p className="text-sm text-gray-500 mt-2">
                Προαιρετικό - μπορείτε να το προσθέσετε αργότερα
              </p>
            </div>

            {/* GPS Coordinates */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                <MapPin className="inline w-5 h-5 mr-2 text-green-600" />
                Συντεταγμένες GPS (προαιρετικό)
              </label>
              <input
                type="text"
                value={formData.coordinates}
                onChange={(e) => handleInputChange('coordinates', e.target.value)}
                placeholder="π.χ. 37.0755, 22.4133"
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 placeholder-gray-400"
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 Συμβουλή: Χρησιμοποιήστε Google Maps για να βρείτε τις συντεταγμένες
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

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.location || (formData.location === 'Άλλη τοποθεσία' && !formData.customLocation)}
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
          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <h3 className="font-bold text-green-800 mb-3 flex items-center">
              <span className="text-xl mr-2">💡</span>
              Συμβουλές για το ΕλαιοLog
            </h3>
            <ul className="text-sm text-green-700 space-y-2">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>Επιλέξτε ένα περιγραφικό όνομα που θα σας βοηθήσει να αναγνωρίζετε τον ελαιώνα</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>Η ακριβής τοποθεσία βοηθά στην παρακολούθηση καιρικών συνθηκών</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>Μπορείτε να ενημερώσετε όλες αυτές τις πληροφορίες οποτεδήποτε</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span>Μετά τη δημιουργία θα μπορείτε να προσθέσετε δέντρα και δραστηριότητες</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 