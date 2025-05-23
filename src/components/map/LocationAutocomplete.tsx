'use client'

import { MapPin, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface LocationSuggestion {
  id: string
  place_name: string
  center: [number, number] // [longitude, latitude]
  context?: Array<{
    id: string
    text: string
    short_code?: string
  }>
}

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect: (location: LocationSuggestion) => void
  placeholder?: string
  required?: boolean
  className?: string
}

export default function LocationAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Αναζητήστε τοποθεσία...",
  required = false,
  className = "",
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  // Debounced search function
  const searchLocations = async (query: string) => {
    if (!query.trim() || !mapboxToken) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      
      // Mapbox Geocoding API focused on Greece
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        new URLSearchParams({
          access_token: mapboxToken,
          country: 'GR', // Restrict to Greece
          types: 'place,locality,neighborhood,region,country', // Relevant place types
          language: 'el', // Greek language preference
          limit: '8', // Limit results
          bbox: '19.3,34.8,29.7,41.8' // Greece bounding box
        })
      )

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.features || [])
      } else {
        console.error('Geocoding API error:', response.status)
        setSuggestions([])
      }
    } catch (error) {
      console.error('Location search error:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change with debouncing
  const handleInputChange = (newValue: string) => {
    onChange(newValue)
    setSelectedIndex(-1)
    setShowSuggestions(true)

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce search by 300ms
    debounceRef.current = setTimeout(() => {
      searchLocations(newValue)
    }, 300)
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    onChange(suggestion.place_name)
    onLocationSelect(suggestion)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedIndex(-1)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Clear input
  const handleClear = () => {
    onChange('')
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Format location display (city, region)
  const formatLocationDisplay = (suggestion: LocationSuggestion) => {
    const parts = suggestion.place_name.split(', ')
    if (parts.length >= 2) {
      return (
        <div>
          <div className="font-medium text-gray-900">{parts[0]}</div>
          <div className="text-sm text-gray-500">{parts.slice(1).join(', ')}</div>
        </div>
      )
    }
    return suggestion.place_name
  }

  if (!mapboxToken) {
    return (
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Εισάγετε τοποθεσία..."
          required={required}
          className={`w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 placeholder-gray-400 bg-yellow-50 ${className}`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <MapPin className="w-5 h-5 text-yellow-600" />
        </div>
        <p className="text-xs text-yellow-600 mt-1">
          Αυτόματη συμπλήρωση μη διαθέσιμη - απαιτείται διαμόρφωση Mapbox
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value.trim() && setShowSuggestions(true)}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-4 pr-12 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 placeholder-gray-400 ${className}`}
        />
        
        {/* Right side icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
          )}
          
          {value && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <Search className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                index === selectedIndex ? 'bg-green-50 border-green-200' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {formatLocationDisplay(suggestion)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && value.trim() && !isLoading && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
          <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Δεν βρέθηκαν τοποθεσίες</p>
          <p className="text-xs text-gray-400 mt-1">Δοκιμάστε διαφορετικό όνομα</p>
        </div>
      )}
    </div>
  )
} 