// Utility functions for Mapbox integration

// Parse coordinates from various string formats
export function parseCoordinates(coordinatesString: string): { lng: number; lat: number } | null {
  if (!coordinatesString?.trim()) return null

  // Clean the string
  const cleaned = coordinatesString.trim().replace(/[^\d.,-]/g, '')
  
  // Try different formats
  const formats = [
    /^([+-]?\d+\.?\d*)[,\s]+([+-]?\d+\.?\d*)$/, // "lat, lng" or "lat lng"
    /^([+-]?\d+\.?\d*)[,\s]+([+-]?\d+\.?\d*)$/, // "lng, lat" or "lng lat"
  ]

  for (const format of formats) {
    const match = cleaned.match(format)
    if (match) {
      const [, first, second] = match
      const firstNum = parseFloat(first)
      const secondNum = parseFloat(second)

      // Validate numbers
      if (isNaN(firstNum) || isNaN(secondNum)) continue

      // Determine if it's lat,lng or lng,lat based on Greek coordinates
      // Greece: lat ~34.8-41.8, lng ~19.3-29.7
      if (firstNum >= 34.8 && firstNum <= 41.8 && secondNum >= 19.3 && secondNum <= 29.7) {
        // Format: lat, lng
        return { lng: secondNum, lat: firstNum }
      } else if (secondNum >= 34.8 && secondNum <= 41.8 && firstNum >= 19.3 && firstNum <= 29.7) {
        // Format: lng, lat
        return { lng: firstNum, lat: secondNum }
      }
    }
  }

  return null
}

// Format coordinates for display
export function formatCoordinates(lng: number, lat: number, precision: number = 6): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`
}

// Validate if coordinates are within Greece bounds
export function isWithinGreece(lng: number, lat: number): boolean {
  const GREECE_BOUNDS = {
    north: 41.8,
    south: 34.8,
    east: 29.7,
    west: 19.3,
  }

  return (
    lng >= GREECE_BOUNDS.west &&
    lng <= GREECE_BOUNDS.east &&
    lat >= GREECE_BOUNDS.south &&
    lat <= GREECE_BOUNDS.north
  )
}

// Get center coordinates for Greece
export function getGreeceCenter(): { lng: number; lat: number } {
  return {
    lng: 24.0, // Central Greece longitude
    lat: 39.0,  // Central Greece latitude
  }
}

// Calculate zoom level based on area (in stremmata)
export function calculateZoomLevel(areaInStremmata?: number | null): number {
  if (!areaInStremmata) return 14 // Default zoom for unknown area

  // Zoom levels based on farm size
  if (areaInStremmata < 10) return 16      // Very small farms (< 10 stremmata)
  if (areaInStremmata < 50) return 15      // Small farms (10-50 stremmata)
  if (areaInStremmata < 200) return 14     // Medium farms (50-200 stremmata)
  if (areaInStremmata < 500) return 13     // Large farms (200-500 stremmata)
  return 12                                // Very large farms (500+ stremmata)
}

// Extract coordinates from Mapbox geocoding response
export function extractCoordinatesFromGeocoding(feature: any): { lng: number; lat: number } | null {
  if (feature?.center && Array.isArray(feature.center) && feature.center.length === 2) {
    const [lng, lat] = feature.center
    if (isWithinGreece(lng, lat)) {
      return { lng, lat }
    }
  }
  return null
}

// Generate a Mapbox static map URL for preview images
export function generateStaticMapUrl(
  lng: number,
  lat: number,
  zoom: number = 14,
  width: number = 300,
  height: number = 200,
  mapboxToken?: string
): string | null {
  if (!mapboxToken || !isWithinGreece(lng, lat)) return null

  const markerColor = '22c55e' // Green marker
  const markerSize = 'l' // Large marker

  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-${markerSize}+${markerColor}(${lng},${lat})/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${mapboxToken}`
}

// Validate Mapbox access token format
export function validateMapboxToken(token: string): boolean {
  // Mapbox tokens start with 'pk.' or 'sk.'
  return /^(pk|sk)\.[a-zA-Z0-9_-]{20,}$/.test(token)
}

// Greek region names mapping for better UX
export const GREEK_REGIONS = {
  'Attica': 'Αττική',
  'Central Macedonia': 'Κεντρική Μακεδονία',
  'Central Greece': 'Στερεά Ελλάδα',
  'Crete': 'Κρήτη',
  'Eastern Macedonia and Thrace': 'Ανατολική Μακεδονία και Θράκη',
  'Epirus': 'Ήπειρος',
  'Ionian Islands': 'Ιόνια Νησιά',
  'North Aegean': 'Βόρειο Αιγαίο',
  'Peloponnese': 'Πελοπόννησος',
  'South Aegean': 'Νότιο Αιγαίο',
  'Thessaly': 'Θεσσαλία',
  'Western Greece': 'Δυτική Ελλάδα',
  'Western Macedonia': 'Δυτική Μακεδονία',
} as const

// Get Greek region name from English name
export function getGreekRegionName(englishName: string): string {
  return GREEK_REGIONS[englishName as keyof typeof GREEK_REGIONS] || englishName
} 