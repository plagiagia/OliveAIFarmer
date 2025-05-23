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
    <div className="bg-white rounded-3xl shadow-lg p-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-gray-600 hover:text-olive-700 transition-colors mr-4"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Επιστροφή
        </button>
        <div className="text-2xl">🫒</div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Farm Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Όνομα Ελαιώνα *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="π.χ. Ελαιώνας Μεσσηνίας"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Τοποθεσία *
          </label>
          <select
            required
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all"
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Συγκεκριμένη Τοποθεσία *
            </label>
            <input
              type="text"
              required
              value={formData.customLocation}
              onChange={(e) => handleInputChange('customLocation', e.target.value)}
              placeholder="π.χ. Μυλοπόταμος, Ρέθυμνο"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all"
            />
          </div>
        )}

        {/* Total Area */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Συνολική Έκταση (εκτάρια)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={formData.totalArea}
            onChange={(e) => handleInputChange('totalArea', e.target.value)}
            placeholder="π.χ. 5.2"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all"
          />
        </div>

        {/* GPS Coordinates */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            Συντεταγμένες GPS (προαιρετικό)
          </label>
          <input
            type="text"
            value={formData.coordinates}
            onChange={(e) => handleInputChange('coordinates', e.target.value)}
            placeholder="π.χ. 37.0755, 22.4133"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all"
          />
          <p className="text-sm text-gray-500 mt-1">
            Μπορείτε να χρησιμοποιήσετε Google Maps για να βρείτε τις συντεταγμένες
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Περιγραφή
          </label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Περιγράψτε τον ελαιώνα σας (προαιρετικό)..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !formData.name || !formData.location}
            className="bg-gradient-to-r from-olive-700 to-olive-600 hover:from-olive-800 hover:to-olive-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-3 px-8 rounded-2xl font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Δημιουργία...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Δημιουργία Ελαιώνα
              </>
            )}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-olive-50 rounded-xl">
        <h3 className="font-semibold text-olive-800 mb-2">Συμβουλές:</h3>
        <ul className="text-sm text-olive-700 space-y-1">
          <li>• Επιλέξτε ένα περιγραφικό όνομα για τον ελαιώνα σας</li>
          <li>• Η ακριβής τοποθεσία βοηθά στην παρακολούθηση καιρικών συνθηκών</li>
          <li>• Μπορείτε να ενημερώσετε αυτές τις πληροφορίες αργότερα</li>
        </ul>
      </div>
    </div>
  )
} 