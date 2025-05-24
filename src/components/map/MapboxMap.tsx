'use client'

import { MapPin } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useRef, useState } from 'react'
import Map, { GeolocateControl, Marker, NavigationControl } from 'react-map-gl'

interface MapboxMapProps {
  // Map configuration
  longitude?: number
  latitude?: number
  zoom?: number
  
  // Interaction modes
  interactive?: boolean
  showMarker?: boolean
  onLocationSelect?: (lng: number, lat: number, address?: string) => void
  
  // Styling
  height?: string | number
  className?: string
  
  // Initial marker position
  markerLongitude?: number
  markerLatitude?: number
}

// Greek coordinates - centered on Greece
const GREECE_CENTER = {
  longitude: 24.0, // Central Greece longitude
  latitude: 39.0,  // Central Greece latitude
}

// Greece bounds for better user experience
const GREECE_BOUNDS = {
  north: 41.8,
  south: 34.8,
  east: 29.7,
  west: 19.3,
}

export default function MapboxMap({
  longitude = GREECE_CENTER.longitude,
  latitude = GREECE_CENTER.latitude,
  zoom = 6,
  interactive = true,
  showMarker = false,
  onLocationSelect,
  height = 400,
  className = '',
  markerLongitude,
  markerLatitude,
}: MapboxMapProps) {
  const mapRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [marker, setMarker] = useState<{ lng: number; lat: number } | null>(
    markerLongitude && markerLatitude 
      ? { lng: markerLongitude, lat: markerLatitude }
      : null
  )

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  // Show error if no token
  if (!mapboxToken) {
    return (
      <div 
        className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 ${className}`}
        style={{ height }}
      >
        <MapPin className="w-8 h-8 mb-2" />
        <p className="text-sm text-center">
          Χάρτης μη διαθέσιμος<br />
          <span className="text-xs">Απαιτείται διαμόρφωση Mapbox</span>
        </p>
      </div>
    )
  }

  // Handle map click for location selection
  const handleMapClick = (event: any) => {
    if (!interactive || !onLocationSelect) return
    
    const { lng, lat } = event.lngLat
    
    // Check if click is within Greece bounds
    if (
      lng < GREECE_BOUNDS.west || lng > GREECE_BOUNDS.east ||
      lat < GREECE_BOUNDS.south || lat > GREECE_BOUNDS.north
    ) {
      return // Ignore clicks outside Greece
    }
    
    setMarker({ lng, lat })
    onLocationSelect(lng, lat)
  }

  // Handle map load
  const handleMapLoad = () => {
    setMapLoaded(true)
    
    // Restrict map to Greece region
    if (mapRef.current) {
      const map = mapRef.current.getMap()
      if (map && map.setMaxBounds) {
        map.setMaxBounds([
          [GREECE_BOUNDS.west, GREECE_BOUNDS.south], // Southwest corner
          [GREECE_BOUNDS.east, GREECE_BOUNDS.north]  // Northeast corner
        ])
      }
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`} style={{ height }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          longitude,
          latitude,
          zoom,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        interactive={interactive}
        scrollZoom={interactive}
        boxZoom={interactive}
        dragRotate={interactive}
        dragPan={interactive}
        keyboard={interactive}
        doubleClickZoom={interactive}
        touchZoomRotate={interactive}
      >
        {/* Navigation controls for interactive maps */}
        {interactive && (
          <>
            <NavigationControl position="top-right" />
            <GeolocateControl
              position="top-right"
              trackUserLocation={true}
              showUserHeading={true}
            />
          </>
        )}

        {/* Show marker if location is selected or provided */}
        {(marker || (showMarker && longitude && latitude)) && (
          <Marker
            longitude={marker?.lng || longitude}
            latitude={marker?.lat || latitude}
            anchor="bottom"
          >
            <div className="bg-red-600 text-white p-2 rounded-full shadow-lg">
              <MapPin className="w-6 h-6" />
            </div>
          </Marker>
        )}
      </Map>

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Φόρτωση χάρτη...</p>
          </div>
        </div>
      )}
      
      {/* Interactive instructions overlay */}
      {interactive && onLocationSelect && !marker && mapLoaded && (
        <div className="absolute top-4 left-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
            <p className="text-sm text-gray-700 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-green-600" />
              Κάντε κλικ στον χάρτη για να επιλέξετε την τοποθεσία του ελαιώνα σας
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 