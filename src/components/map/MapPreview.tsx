'use client'

import { MapPin } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useState } from 'react'
import Map, { Marker } from 'react-map-gl'

interface MapPreviewProps {
  longitude?: number
  latitude?: number
  zoom?: number
  height?: number
  className?: string
  farmName?: string
}

export default function MapPreview({
  longitude,
  latitude,
  zoom = 10,
  height = 120,
  className = "",
  farmName = "Ελαιώνας",
}: MapPreviewProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  // Show placeholder if no coordinates or token
  if (!mapboxToken || !longitude || !latitude) {
    return (
      <div 
        className={`bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 ${className}`}
        style={{ height }}
      >
        <MapPin className="w-6 h-6 mb-1" />
        <span className="text-xs">Χάρτης</span>
      </div>
    )
  }

  // Show error state
  if (hasError) {
    return (
      <div 
        className={`bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center text-red-400 ${className}`}
        style={{ height }}
      >
        <MapPin className="w-6 h-6 mb-1" />
        <span className="text-xs">Σφάλμα</span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border border-gray-200 ${className}`} style={{ height }}>
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          longitude,
          latitude,
          zoom,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        interactive={false}
        onLoad={() => setMapLoaded(true)}
        onError={() => setHasError(true)}
        scrollZoom={false}
        boxZoom={false}
        dragRotate={false}
        dragPan={false}
        keyboard={false}
        doubleClickZoom={false}
        touchZoomRotate={false}
      >
        {/* Farm location marker */}
        <Marker
          longitude={longitude}
          latitude={latitude}
          anchor="bottom"
        >
          <div className="bg-green-600 text-white p-1.5 rounded-full shadow-lg">
            <MapPin className="w-4 h-4" />
          </div>
        </Marker>
      </Map>

      {/* Loading overlay */}
      {!mapLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mx-auto mb-1"></div>
            <p className="text-xs text-gray-500">Φόρτωση...</p>
          </div>
        </div>
      )}

      {/* Farm name overlay */}
      {mapLoaded && !hasError && (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="bg-white/90 backdrop-blur-sm rounded px-2 py-1">
            <p className="text-xs font-medium text-gray-800 truncate">{farmName}</p>
          </div>
        </div>
      )}
    </div>
  )
} 