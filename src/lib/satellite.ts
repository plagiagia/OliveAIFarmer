/**
 * Copernicus Data Space Ecosystem - Sentinel Hub API Client
 *
 * Provides satellite-derived vegetation indices and soil moisture data
 * for olive grove monitoring.
 *
 * Documentation: https://documentation.dataspace.copernicus.eu/APIs/SentinelHub.html
 */

// Removed Prisma import to avoid build errors
export type StressLevel = 'HEALTHY' | 'MILD_STRESS' | 'MODERATE_STRESS' | 'SEVERE_STRESS'

// ===== CONFIGURATION =====

const COPERNICUS_AUTH_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'
const SENTINEL_HUB_URL = 'https://sh.dataspace.copernicus.eu'

// ===== TYPES =====

export interface SatelliteIndices {
  ndvi: number | null       // Normalized Difference Vegetation Index
  ndmi: number | null       // Normalized Difference Moisture Index
  evi: number | null        // Enhanced Vegetation Index
  soilMoisture: number | null // Relative soil moisture (0-100)
  cloudCoverage: number     // Cloud coverage percentage
  date: Date                // Observation date
}

export interface GroveHealthMetrics {
  healthScore: number       // 0-100 overall health score
  stressLevel: StressLevel
  ndviTrend: 'improving' | 'stable' | 'declining'
  ndviChange: number        // Percentage change from previous observation
  recommendations: string[]
}

export interface SatelliteTimeSeriesPoint {
  date: Date
  ndvi: number | null
  ndmi: number | null
  cloudCoverage: number
}

export interface BoundingBox {
  west: number   // Min longitude
  south: number  // Min latitude
  east: number   // Max longitude
  north: number  // Max latitude
}

interface TokenCache {
  token: string
  expiresAt: number
}

// ===== TOKEN MANAGEMENT =====

let tokenCache: TokenCache | null = null

/**
 * Get OAuth2 access token from Copernicus Data Space
 */
async function getAccessToken(): Promise<string> {
  // Check cache first
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) {
    return tokenCache.token
  }

  const clientId = process.env.COPERNICUS_CLIENT_ID
  const clientSecret = process.env.COPERNICUS_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Copernicus credentials not configured. Set COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET.')
  }

  const response = await fetch(COPERNICUS_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Copernicus auth failed:', error)
    throw new Error('Failed to authenticate with Copernicus Data Space')
  }

  const data = await response.json()

  // Cache the token
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  }

  return data.access_token
}

// ===== HELPER FUNCTIONS =====

/**
 * Create a bounding box around a point with given radius in meters
 */
export function createBoundingBox(lat: number, lon: number, radiusMeters: number = 500): BoundingBox {
  // Approximate degrees per meter at given latitude
  const latDegPerMeter = 1 / 111320
  const lonDegPerMeter = 1 / (111320 * Math.cos(lat * Math.PI / 180))

  const latOffset = radiusMeters * latDegPerMeter
  const lonOffset = radiusMeters * lonDegPerMeter

  return {
    west: lon - lonOffset,
    south: lat - latOffset,
    east: lon + lonOffset,
    north: lat + latOffset,
  }
}

/**
 * Calculate bounding box from farm area in stremmata
 * 1 stremma = 1000 m²
 */
export function createBoundingBoxFromArea(lat: number, lon: number, areaStremmata: number): BoundingBox {
  // Convert stremmata to m², then calculate equivalent radius
  const areaM2 = areaStremmata * 1000
  const radiusMeters = Math.sqrt(areaM2 / Math.PI) * 1.5 // 1.5x to ensure coverage

  return createBoundingBox(lat, lon, Math.max(radiusMeters, 200)) // Minimum 200m radius
}

/**
 * Parse coordinates string to lat/lon
 * Expected format: "lat,lon" e.g., "37.0382,21.9610"
 */
export function parseCoordinates(coordString: string): { lat: number; lon: number } | null {
  if (!coordString) return null

  const parts = coordString.split(',').map(s => parseFloat(s.trim()))
  if (parts.length !== 2 || parts.some(isNaN)) return null

  return { lat: parts[0], lon: parts[1] }
}

// ===== EVALSCRIPTS =====

/**
 * Evalscript for calculating vegetation indices from Sentinel-2
 * Returns: [NDVI, NDMI, EVI, dataMask]
 */
// VEGETATION_INDICES_EVALSCRIPT removed as it is now inlined in aggregation

/**
 * Evalscript for NDVI visualization (for WMS layer)
 */
// NDVI_VISUALIZATION_EVALSCRIPT removed as it was unused

// ===== MAIN API FUNCTIONS =====

/**
 * Fetch current vegetation indices for a farm location
 */
export async function fetchVegetationIndices(
  lat: number,
  lon: number,
  areaStremmata?: number,
  date?: Date
): Promise<SatelliteIndices> {
  const token = await getAccessToken()

  // Create bounding box based on farm area or default
  const bbox = areaStremmata
    ? createBoundingBoxFromArea(lat, lon, areaStremmata)
    : createBoundingBox(lat, lon, 300)

  // Use provided date or get latest
  const toDate = date || new Date()
  const fromDate = new Date(toDate)
  fromDate.setDate(fromDate.getDate() - 30) // Look back 30 days for clear imagery

  console.log('[fetchVegetationIndices] Creating request for:', { lat, lon, areaStremmata, bbox })

  const request = {
    input: {
      bounds: {
        bbox: [bbox.west, bbox.south, bbox.east, bbox.north],
        properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' }
      },
      data: [{
        type: 'sentinel-2-l2a',
        dataFilter: {
          timeRange: {
            from: fromDate.toISOString(),
            to: toDate.toISOString()
          },
          maxCloudCoverage: 30,
          mosaickingOrder: 'leastCC'
        }
      }]
    },
    aggregation: {
      timeRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      },
      aggregationInterval: {
        of: 'P1D'
      },
      evalscript: `
        //VERSION=3
        function setup() {
          return {
            input: ["B04", "B08", "B11", "SCL", "dataMask"],
            output: [
              { id: "ndvi", bands: 1 },
              { id: "ndmi", bands: 1 },
              { id: "valid", bands: 1 },
              { id: "dataMask", bands: 1 }
            ]
          };
        }

        function evaluatePixel(sample) {
          // Note: 'sample' (not 'samples') is an object when mosaicking is SIMPLE (default)
          let scl = sample.SCL;
          
          // Filter out invalid pixels: clouds (7-10) and no-data
          if (sample.dataMask === 1 && (scl < 7 || scl > 10)) {
            let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04 + 0.0001);
            let ndmi = (sample.B08 - sample.B11) / (sample.B08 + sample.B11 + 0.0001);
            
            return {
              ndvi: [ndvi],
              ndmi: [ndmi],
              valid: [1],
              dataMask: [1]
            };
          }
          
          // Return invalid/masked pixel
          return { 
            ndvi: [-9999], 
            ndmi: [-9999], 
            valid: [0], 
            dataMask: [0]
          };
        }
      `
    },
    calculations: {
      default: {
        statistics: {
          default: {
            percentiles: { k: [50] }
          }
        }
      }
    }
  }

  const endpoint = `${SENTINEL_HUB_URL}/api/v1/statistics`
  console.log('[fetchVegetationIndices] Calling Statistics API endpoint:', endpoint)
  console.log('[fetchVegetationIndices] Request has aggregation:', !!request.aggregation)
  console.log('[fetchVegetationIndices] Request payload keys:', Object.keys(request))
  console.log('[fetchVegetationIndices] Evalscript first 200 chars:', request.aggregation.evalscript.substring(0, 200))

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })

  console.log('[fetchVegetationIndices] Response status:', response.status, response.statusText)

  if (!response.ok) {
    const error = await response.text()
    console.error('[fetchVegetationIndices] API ERROR:', error)
    console.error('[fetchVegetationIndices] Request was sent to:', endpoint)
    console.error('[fetchVegetationIndices] Request had keys:', Object.keys(request))
    throw new Error('Failed to fetch satellite data from Copernicus')
  }

  const data = await response.json()
  console.log('[fetchVegetationIndices] Received data entries:', data.data?.length || 0)

  // Find latest valid entry
  let latestEntry = null;
  if (data.data) {
    // Sort desc by date
    const sorted = data.data.sort((a: any, b: any) =>
      new Date(b.interval.from).getTime() - new Date(a.interval.from).getTime()
    );

    console.log('[fetchVegetationIndices] Checking', sorted.length, 'entries for valid data')

    for (const entry of sorted) {
      console.log('[fetchVegetationIndices] Entry outputs structure:', JSON.stringify(entry.outputs).substring(0, 500))
      const validCount = entry.outputs?.valid?.bands?.B0?.stats?.sum;
      console.log('[fetchVegetationIndices] Entry date:', entry.interval.from, 'validCount:', validCount)
      if (validCount > 0) {
        latestEntry = entry;
        break;
      }
    }
  }

  if (!latestEntry) {
    console.log('[fetchVegetationIndices] No valid entries found, returning null')
    return {
      ndvi: null,
      ndmi: null,
      evi: null,
      soilMoisture: null,
      cloudCoverage: 0,
      date: toDate
    }
  }

  const ndvi = latestEntry.outputs?.ndvi?.bands?.B0?.stats?.mean ?? null;
  const ndmi = latestEntry.outputs?.ndmi?.bands?.B0?.stats?.mean ?? null;

  console.log('[fetchVegetationIndices] Parsed values:', { ndvi, ndmi, date: latestEntry.interval.from })

  return {
    ndvi,
    ndmi,
    evi: null,
    soilMoisture: null, // Would require separate soil moisture API
    cloudCoverage: 0,
    date: new Date(latestEntry.interval.from)
  }
}

/**
 * Fetch vegetation indices time series for trend analysis
 */
export async function fetchVegetationTimeSeries(
  lat: number,
  lon: number,
  areaStremmata: number | undefined,
  monthsBack: number = 6
): Promise<SatelliteTimeSeriesPoint[]> {
  const token = await getAccessToken()

  const bbox = areaStremmata
    ? createBoundingBoxFromArea(lat, lon, areaStremmata)
    : createBoundingBox(lat, lon, 300)

  const toDate = new Date()
  const fromDate = new Date()
  fromDate.setMonth(fromDate.getMonth() - monthsBack)

  // Use Statistical API for time series
  const request = {
    input: {
      bounds: {
        bbox: [bbox.west, bbox.south, bbox.east, bbox.north],
        properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' }
      },
      data: [{
        type: 'sentinel-2-l2a',
        dataFilter: {
          timeRange: {
            from: fromDate.toISOString(),
            to: toDate.toISOString()
          },
          maxCloudCoverage: 40
        }
      }]
    },
    aggregation: {
      timeRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      },
      aggregationInterval: {
        of: 'P10D' // 10-day intervals
      },
      evalscript: `
        //VERSION=3
        function setup() {
          return {
            input: ["B04", "B08", "B11", "SCL", "dataMask"],
            output: [
              { id: "ndvi", bands: 1 },
              { id: "ndmi", bands: 1 },
              { id: "valid", bands: 1 }
            ]
          };
        }

        function evaluatePixel(samples) {
          let validCount = 0;
          let ndviSum = 0;
          let ndmiSum = 0;

          for (let s of samples) {
            let scl = s.SCL;
            if (s.dataMask === 1 && (scl < 7 || scl > 10)) {
              let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04 + 0.0001);
              let ndmi = (s.B08 - s.B11) / (s.B08 + s.B11 + 0.0001);
              ndviSum += ndvi;
              ndmiSum += ndmi;
              validCount++;
            }
          }

          if (validCount === 0) {
            return { ndvi: [-9999], ndmi: [-9999], valid: [0] };
          }

          return {
            ndvi: [ndviSum / validCount],
            ndmi: [ndmiSum / validCount],
            valid: [validCount]
          };
        }
      `
    },
    calculations: {
      default: {
        statistics: {
          default: {
            percentiles: { k: [50] }
          }
        }
      }
    }
  }

  const response = await fetch(`${SENTINEL_HUB_URL}/api/v1/statistics`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    // Fallback to basic data if statistics API fails
    console.warn('Statistics API failed, returning empty time series')
    return []
  }

  const data = await response.json()

  return parseStatisticsResponse(data)
}

/**
 * Get NDVI WMS layer URL for Mapbox integration
 */
export function getNdviWmsUrl(bbox: BoundingBox, width: number = 512, height: number = 512): string {
  // This returns a URL template that can be used with Mapbox
  // Actual implementation would require the evalscript to be saved as a configuration
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.3.0',
    REQUEST: 'GetMap',
    BBOX: `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`,
    CRS: 'EPSG:4326',
    WIDTH: width.toString(),
    HEIGHT: height.toString(),
    LAYERS: 'NDVI',
    FORMAT: 'image/png',
    TRANSPARENT: 'true'
  })

  return `${SENTINEL_HUB_URL}/ogc/wms?${params.toString()}`
}

// ===== HEALTH ANALYSIS =====

/**
 * Calculate grove health metrics from satellite indices
 */
export function calculateHealthMetrics(
  current: SatelliteIndices,
  previous?: SatelliteIndices
): GroveHealthMetrics {
  const ndvi = current.ndvi ?? 0.5

  // Calculate health score (0-100)
  // NDVI range for olives: 0.2 (stressed) to 0.8 (very healthy)
  const healthScore = Math.round(Math.min(100, Math.max(0, ((ndvi - 0.2) / 0.6) * 100)))

  // Determine stress level
  let stressLevel: StressLevel
  if (ndvi >= 0.6) stressLevel = 'HEALTHY'
  else if (ndvi >= 0.4) stressLevel = 'MILD_STRESS'
  else if (ndvi >= 0.3) stressLevel = 'MODERATE_STRESS'
  else stressLevel = 'SEVERE_STRESS'

  // Calculate trend
  let ndviTrend: 'improving' | 'stable' | 'declining' = 'stable'
  let ndviChange = 0

  if (previous?.ndvi != null && current.ndvi != null) {
    ndviChange = ((current.ndvi - previous.ndvi) / Math.abs(previous.ndvi || 0.5)) * 100
    if (ndviChange > 5) ndviTrend = 'improving'
    else if (ndviChange < -5) ndviTrend = 'declining'
  }

  // Generate recommendations
  const recommendations: string[] = []

  if (stressLevel === 'SEVERE_STRESS') {
    recommendations.push('Άμεση επιθεώρηση του ελαιώνα για εντοπισμό προβλήματος')
    recommendations.push('Έλεγχος για ασθένειες ή έλλειψη νερού')
  } else if (stressLevel === 'MODERATE_STRESS') {
    recommendations.push('Παρακολούθηση της κατάστασης - πιθανό στρες λόγω ξηρασίας')
    if (current.ndmi != null && current.ndmi < 0) {
      recommendations.push('Χαμηλή υγρασία φυλλώματος - εξετάστε το πότισμα')
    }
  } else if (stressLevel === 'MILD_STRESS') {
    recommendations.push('Ελαφρύ στρες - συνεχίστε την κανονική φροντίδα')
  }

  if (ndviTrend === 'declining') {
    recommendations.push('Φθίνουσα τάση υγείας - εντατικοποιήστε την παρακολούθηση')
  } else if (ndviTrend === 'improving') {
    recommendations.push('Θετική τάση - η φροντίδα αποδίδει')
  }

  if (current.soilMoisture != null && current.soilMoisture < 20) {
    recommendations.push('Χαμηλή εδαφική υγρασία - προγραμματίστε πότισμα')
  }

  return {
    healthScore,
    stressLevel,
    ndviTrend,
    ndviChange: Math.round(ndviChange * 10) / 10,
    recommendations
  }
}

// ===== RESPONSE PARSERS =====

/**
 * Parse multipart tar response from Process API
 */
// parseProcessResponse removed as we now use Statistics API

/**
 * Parse Statistics API response
 */
function parseStatisticsResponse(data: any): SatelliteTimeSeriesPoint[] {
  const points: SatelliteTimeSeriesPoint[] = []

  try {
    if (data.data) {
      for (const entry of data.data) {
        const date = new Date(entry.interval.from)
        const ndviStats = entry.outputs?.ndvi?.bands?.B0?.stats
        const ndmiStats = entry.outputs?.ndmi?.bands?.B0?.stats

        points.push({
          date,
          ndvi: ndviStats?.mean ?? null,
          ndmi: ndmiStats?.mean ?? null,
          cloudCoverage: 0 // Would need separate calculation
        })
      }
    }
  } catch (error) {
    console.error('Failed to parse statistics response:', error)
  }

  return points.sort((a, b) => a.date.getTime() - b.date.getTime())
}

// ===== UTILITY FUNCTIONS =====

/**
 * Check if Copernicus credentials are configured
 */
export function isSatelliteConfigured(): boolean {
  return !!(process.env.COPERNICUS_CLIENT_ID && process.env.COPERNICUS_CLIENT_SECRET)
}

/**
 * Get stress level label in Greek
 */
export function getStressLevelLabel(level: StressLevel): string {
  const labels: Record<StressLevel, string> = {
    HEALTHY: 'Υγιής',
    MILD_STRESS: 'Ελαφρύ Στρες',
    MODERATE_STRESS: 'Μέτριο Στρες',
    SEVERE_STRESS: 'Σοβαρό Στρες'
  }
  return labels[level]
}

/**
 * Get stress level color for UI
 */
export function getStressLevelColor(level: StressLevel): string {
  const colors: Record<StressLevel, string> = {
    HEALTHY: 'text-green-600 bg-green-50',
    MILD_STRESS: 'text-yellow-600 bg-yellow-50',
    MODERATE_STRESS: 'text-orange-600 bg-orange-50',
    SEVERE_STRESS: 'text-red-600 bg-red-50'
  }
  return colors[level]
}
