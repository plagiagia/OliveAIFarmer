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
 * Fetch soil moisture from Sentinel-1 SAR data
 * Uses VV backscatter with change detection approach
 */
export async function fetchSoilMoisture(
  lat: number,
  lon: number,
  areaStremmata?: number,
  date?: Date
): Promise<{ soilMoisture: number | null; date: Date }> {
  const token = await getAccessToken()

  const bbox = areaStremmata
    ? createBoundingBoxFromArea(lat, lon, areaStremmata)
    : createBoundingBox(lat, lon, 300)

  // Use provided date or current
  const toDate = date ? new Date(date) : new Date()
  toDate.setHours(23, 59, 59, 999)

  const fromDate = new Date(toDate)
  fromDate.setDate(fromDate.getDate() - 30) // Look back 30 days
  fromDate.setHours(0, 0, 0, 0)

  // For change detection, we also need historical reference (1 year back)
  const historicalFrom = new Date(toDate)
  historicalFrom.setFullYear(historicalFrom.getFullYear() - 1)
  historicalFrom.setHours(0, 0, 0, 0)

  const request = {
    input: {
      bounds: {
        bbox: [bbox.west, bbox.south, bbox.east, bbox.north],
        properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' }
      },
      data: [{
        type: 'sentinel-1-grd',
        dataFilter: {
          timeRange: {
            from: historicalFrom.toISOString(),
            to: toDate.toISOString()
          },
          acquisitionMode: 'IW',
          polarization: 'DV', // Dual VV+VH
          resolution: 'HIGH'
        },
        processing: {
          backCoeff: 'SIGMA0_ELLIPSOID',
          orthorectify: true,
          demInstance: 'COPERNICUS'
        }
      }]
    },
    aggregation: {
      timeRange: {
        from: historicalFrom.toISOString(),
        to: toDate.toISOString()
      },
      aggregationInterval: {
        of: 'P10D' // 10-day intervals for historical range
      },
      evalscript: `
        //VERSION=3
        function setup() {
          return {
            input: ["VV", "VH", "dataMask"],
            output: [
              { id: "vv", bands: 1 },
              { id: "vh", bands: 1 },
              { id: "valid", bands: 1 },
              { id: "dataMask", bands: 1 }
            ]
          };
        }

        function evaluatePixel(sample) {
          if (sample.dataMask === 1 && sample.VV > 0 && sample.VH > 0) {
            // Convert to dB for more linear relationship with soil moisture
            let vv_db = 10 * Math.log10(sample.VV);
            let vh_db = 10 * Math.log10(sample.VH);

            return {
              vv: [vv_db],
              vh: [vh_db],
              valid: [1],
              dataMask: [1]
            };
          }

          return {
            vv: [-999],
            vh: [-999],
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
            percentiles: { k: [5, 50, 95] } // Need min/max for change detection
          }
        }
      }
    }
  }

  try {
    const response = await fetch(`${SENTINEL_HUB_URL}/api/v1/statistics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[fetchSoilMoisture] API ERROR:', error)
      return { soilMoisture: null, date: toDate }
    }

    const data = await response.json()

    if (!data.data || data.data.length === 0) {
      return { soilMoisture: null, date: toDate }
    }

    // Calculate soil moisture using change detection
    // Collect all valid VV values to find historical range
    const validEntries = data.data.filter((entry: any) =>
      entry.outputs?.valid?.bands?.B0?.stats?.mean > 0.05
    )

    if (validEntries.length < 2) {
      return { soilMoisture: null, date: toDate }
    }

    // Get historical min/max VV (5th and 95th percentiles across all data)
    let vvMin = Infinity
    let vvMax = -Infinity

    for (const entry of validEntries) {
      const p5 = entry.outputs?.vv?.bands?.B0?.stats?.percentiles?.p5 ?? entry.outputs?.vv?.bands?.B0?.stats?.min
      const p95 = entry.outputs?.vv?.bands?.B0?.stats?.percentiles?.p95 ?? entry.outputs?.vv?.bands?.B0?.stats?.max

      if (p5 != null && p5 !== -999) vvMin = Math.min(vvMin, p5)
      if (p95 != null && p95 !== -999) vvMax = Math.max(vvMax, p95)
    }

    // Get the most recent valid observation
    const sortedEntries = validEntries.sort((a: any, b: any) =>
      new Date(b.interval.from).getTime() - new Date(a.interval.from).getTime()
    )
    const latestEntry = sortedEntries[0]
    const currentVV = latestEntry.outputs?.vv?.bands?.B0?.stats?.mean

    if (currentVV == null || vvMin === Infinity || vvMax === -Infinity || vvMin >= vvMax) {
      return { soilMoisture: null, date: toDate }
    }

    // Soil moisture estimation: inverse relationship with VV backscatter
    // Lower VV (more negative dB) = drier soil
    // Higher VV (less negative dB) = wetter soil
    // Normalize to 0-100 scale, capped at 60% (typical saturation)
    const normalizedMoisture = ((currentVV - vvMin) / (vvMax - vvMin)) * 60
    const soilMoisture = Math.max(0, Math.min(60, Math.round(normalizedMoisture * 10) / 10))

    return {
      soilMoisture,
      date: new Date(latestEntry.interval.from)
    }
  } catch (error) {
    console.error('[fetchSoilMoisture] Error:', error)
    return { soilMoisture: null, date: toDate }
  }
}

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

  // Use provided date or get latest (normalized to end of day for clear boundaries)
  const toDate = date ? new Date(date) : new Date()
  toDate.setHours(23, 59, 59, 999)

  const fromDate = new Date(toDate)
  fromDate.setDate(fromDate.getDate() - 30) // Look back 30 days for clear imagery
  fromDate.setHours(0, 0, 0, 0)

  // console.log removed

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

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })



  if (!response.ok) {
    const error = await response.text()
    console.error('[fetchVegetationIndices] API ERROR:', error)
    console.error('[fetchVegetationIndices] Request was sent to:', endpoint)
    console.error('[fetchVegetationIndices] Request had keys:', Object.keys(request))
    throw new Error('Failed to fetch satellite data from Copernicus')
  }

  const data = await response.json()

  // Find latest valid entry
  let latestEntry = null;
  if (data.data) {
    // Sort desc by date
    const sorted = data.data.sort((a: any, b: any) =>
      new Date(b.interval.from).getTime() - new Date(a.interval.from).getTime()
    );

    for (const entry of sorted) {
      // 'valid' band mean is the ratio of valid pixels (0 to 1)
      const validRatio = entry.outputs?.valid?.bands?.B0?.stats?.mean;

      // If we have some valid pixels (e.g. > 5% of the area)
      if (validRatio > 0.05) {
        latestEntry = entry;
        break;
      }
    }
  }

  if (!latestEntry) {
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

  return {
    ndvi,
    ndmi,
    evi: null,
    soilMoisture: null, // Fetched separately via fetchSoilMoisture (Sentinel-1)
    cloudCoverage: 0,
    date: new Date(latestEntry.interval.from)
  }
}

/**
 * Fetch all satellite data (vegetation indices + soil moisture) in parallel
 * Combines Sentinel-2 (optical) and Sentinel-1 (SAR) data
 */
export async function fetchAllSatelliteData(
  lat: number,
  lon: number,
  areaStremmata?: number,
  date?: Date
): Promise<SatelliteIndices> {
  // Fetch both in parallel for better performance
  const [vegetationResult, soilResult] = await Promise.all([
    fetchVegetationIndices(lat, lon, areaStremmata, date),
    fetchSoilMoisture(lat, lon, areaStremmata, date)
  ])

  return {
    ...vegetationResult,
    soilMoisture: soilResult.soilMoisture
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

  // Normalize dates to ensure consistent 10-day aggregation buckets
  const toDate = new Date()
  toDate.setHours(23, 59, 59, 999)

  const fromDate = new Date(toDate)
  fromDate.setMonth(fromDate.getMonth() - monthsBack)
  fromDate.setHours(0, 0, 0, 0)

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
    const error = await response.text()
    console.warn('Statistics API failed, returning empty time series:', error)
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

        // 'valid' band mean is the ratio of valid pixels (0 to 1)
        const validRatio = entry.outputs?.valid?.bands?.B0?.stats?.mean ?? 0

        // Only include if we have some valid pixels (e.g. > 5% of the area)
        if (validRatio > 0.05) {
          const ndviStats = entry.outputs?.ndvi?.bands?.B0?.stats
          const ndmiStats = entry.outputs?.ndmi?.bands?.B0?.stats

          points.push({
            date,
            ndvi: ndviStats?.mean ?? null,
            ndmi: ndmiStats?.mean ?? null,
            cloudCoverage: (1 - validRatio) * 100 // Estimate cloud coverage from invalid pixels
          })
        }
      }
    }
  } catch (error) {
    console.error('Failed to parse statistics response:', error)
  }

  // Sort ascending by date for charts
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
