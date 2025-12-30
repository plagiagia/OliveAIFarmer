/**
 * Test script to validate Sentinel-1 soil moisture data
 *
 * Run with: npx tsx scripts/test-soil-moisture.ts
 *
 * This script fetches raw Sentinel-1 data and displays all values
 * so we can validate the soil moisture calculation.
 */

import * as fs from 'fs'
import * as path from 'path'

// Load .env files manually (check .env.local first, then .env)
function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const envContent = fs.readFileSync(filePath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          // Only set if not already set (allows .env.local to override)
          const envKey = key.trim()
          if (!process.env[envKey]) {
            process.env[envKey] = valueParts.join('=').trim()
          }
        }
      }
    }
    return true
  }
  return false
}

// Try loading env files in order of priority
const envFiles = ['.env.local', '.env']
for (const envFile of envFiles) {
  loadEnvFile(path.join(process.cwd(), envFile))
}

const COPERNICUS_AUTH_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'
const SENTINEL_HUB_URL = 'https://sh.dataspace.copernicus.eu'

// Test location - Kalamata, Greece (olive growing region)
const TEST_LOCATION = {
  name: 'Kalamata, Greece',
  lat: 37.0422,
  lon: 22.1140
}

interface TokenCache {
  token: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) {
    return tokenCache.token
  }

  const clientId = process.env.COPERNICUS_CLIENT_ID
  const clientSecret = process.env.COPERNICUS_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing COPERNICUS_CLIENT_ID or COPERNICUS_CLIENT_SECRET in .env')
  }

  console.log('🔑 Authenticating with Copernicus...')

  const response = await fetch(COPERNICUS_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Auth failed: ${error}`)
  }

  const data = await response.json()
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  }

  console.log('✅ Authenticated successfully\n')
  return data.access_token
}

function createBoundingBox(lat: number, lon: number, radiusMeters: number = 500) {
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

async function testSoilMoisture(lat: number, lon: number, locationName: string) {
  console.log('═'.repeat(60))
  console.log(`📍 Testing location: ${locationName}`)
  console.log(`   Coordinates: ${lat}, ${lon}`)
  console.log('═'.repeat(60))

  const token = await getAccessToken()
  const bbox = createBoundingBox(lat, lon, 500)

  const toDate = new Date()
  toDate.setHours(23, 59, 59, 999)

  const fromDate = new Date(toDate)
  fromDate.setMonth(fromDate.getMonth() - 6)
  fromDate.setHours(0, 0, 0, 0)

  console.log(`📅 Date range: ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`)
  console.log(`📦 Bounding box: [${bbox.west.toFixed(4)}, ${bbox.south.toFixed(4)}, ${bbox.east.toFixed(4)}, ${bbox.north.toFixed(4)}]`)
  console.log('')

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
            from: fromDate.toISOString(),
            to: toDate.toISOString()
          },
          acquisitionMode: 'IW',
          polarization: 'DV',
          resolution: 'HIGH'
        },
        processing: {
          backCoeff: 'SIGMA0_ELLIPSOID',
          orthorectify: true
        }
      }]
    },
    aggregation: {
      timeRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      },
      aggregationInterval: {
        of: 'P10D'
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
          if (sample.dataMask === 1 && sample.VV > 0) {
            let vv_db = 10 * Math.log10(sample.VV);
            let vh_db = sample.VH > 0 ? 10 * Math.log10(sample.VH) : -30;

            return {
              vv: [vv_db],
              vh: [vh_db],
              valid: [1],
              dataMask: [1]
            };
          }

          return {
            vv: [-30],
            vh: [-30],
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
            percentiles: { k: [5, 25, 50, 75, 95] }
          }
        }
      }
    }
  }

  console.log('🛰️  Fetching Sentinel-1 data...\n')

  const response = await fetch(`${SENTINEL_HUB_URL}/api/v1/statistics`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ API Error:', response.status)
    console.error(errorText)
    return
  }

  const data = await response.json()

  if (!data.data || data.data.length === 0) {
    console.log('❌ No data returned from API')
    return
  }

  console.log(`📊 Received ${data.data.length} time intervals\n`)

  // Process and display all entries
  const entries: any[] = []

  for (const entry of data.data) {
    const dateFrom = new Date(entry.interval.from)
    const dateTo = new Date(entry.interval.to)
    const vvStats = entry.outputs?.vv?.bands?.B0?.stats
    const validStats = entry.outputs?.valid?.bands?.B0?.stats

    if (vvStats && validStats) {
      entries.push({
        dateFrom,
        dateTo,
        vvMean: vvStats.mean,
        vvMin: vvStats.min,
        vvMax: vvStats.max,
        vvP5: vvStats.percentiles?.p5,
        vvP50: vvStats.percentiles?.p50,
        vvP95: vvStats.percentiles?.p95,
        validRatio: validStats.mean,
        sampleCount: vvStats.sampleCount
      })
    }
  }

  // Sort by date
  entries.sort((a, b) => a.dateFrom.getTime() - b.dateFrom.getTime())

  // Find min/max VV across all entries for normalization
  const validEntries = entries.filter(e => e.validRatio > 0.05 && e.vvMean > -30)

  if (validEntries.length === 0) {
    console.log('❌ No valid entries found (all cloudy or no data)')
    return
  }

  let globalVvMin = Math.min(...validEntries.map(e => e.vvP5 ?? e.vvMin).filter(v => v > -30))
  let globalVvMax = Math.max(...validEntries.map(e => e.vvP95 ?? e.vvMax).filter(v => v > -30))

  console.log('┌─────────────────────────────────────────────────────────────────────────────────────┐')
  console.log('│ Date Range          │ VV Mean  │ VV P5    │ VV P95   │ Valid % │ Est. Moisture │')
  console.log('├─────────────────────────────────────────────────────────────────────────────────────┤')

  for (const entry of entries) {
    const dateStr = `${entry.dateFrom.toISOString().split('T')[0]}`
    const validPercent = (entry.validRatio * 100).toFixed(0)

    if (entry.validRatio < 0.05 || entry.vvMean <= -30) {
      console.log(`│ ${dateStr.padEnd(19)} │ ${'-'.padStart(8)} │ ${'-'.padStart(8)} │ ${'-'.padStart(8)} │ ${validPercent.padStart(6)}% │ ${'N/A'.padStart(13)} │`)
    } else {
      const vvMean = entry.vvMean.toFixed(2)
      const vvP5 = entry.vvP5?.toFixed(2) ?? '-'
      const vvP95 = entry.vvP95?.toFixed(2) ?? '-'

      // Calculate soil moisture using same algorithm
      const moisture = ((entry.vvMean - globalVvMin) / (globalVvMax - globalVvMin)) * 60
      const moistureClamped = Math.max(0, Math.min(60, moisture)).toFixed(1)

      console.log(`│ ${dateStr.padEnd(19)} │ ${vvMean.padStart(8)} │ ${vvP5.padStart(8)} │ ${vvP95.padStart(8)} │ ${validPercent.padStart(6)}% │ ${(moistureClamped + '%').padStart(13)} │`)
    }
  }

  console.log('└─────────────────────────────────────────────────────────────────────────────────────┘')

  // Summary
  console.log('')
  console.log('📈 Summary:')
  console.log(`   Valid entries: ${validEntries.length} / ${entries.length}`)
  console.log(`   VV range (dB): ${globalVvMin.toFixed(2)} to ${globalVvMax.toFixed(2)}`)
  console.log(`   Latest VV: ${validEntries[validEntries.length - 1]?.vvMean.toFixed(2)} dB`)

  const latestMoisture = ((validEntries[validEntries.length - 1]?.vvMean - globalVvMin) / (globalVvMax - globalVvMin)) * 60
  console.log(`   Latest soil moisture: ${Math.max(0, Math.min(60, latestMoisture)).toFixed(1)}%`)

  // Interpretation
  console.log('')
  console.log('📝 Interpretation:')
  console.log('   • VV backscatter in dB typically ranges from -25 dB (dry) to -5 dB (wet)')
  console.log('   • Higher VV (less negative) = wetter soil')
  console.log('   • Lower VV (more negative) = drier soil')
  console.log('   • The soil moisture % is relative to the observed range over 6 months')
  console.log('')
  console.log('🔗 To verify, compare with local weather data:')
  console.log('   • Check if recent rainfall correlates with higher VV values')
  console.log('   • Dry periods should show lower (more negative) VV values')
}

// Run the test
async function main() {
  console.log('')
  console.log('🧪 Sentinel-1 Soil Moisture Validation Test')
  console.log('==========================================')
  console.log('')

  // Parse command line args: npx tsx scripts/test-soil-moisture.ts [lat] [lon] [name]
  const args = process.argv.slice(2)

  let lat = TEST_LOCATION.lat
  let lon = TEST_LOCATION.lon
  let name = TEST_LOCATION.name

  if (args.length >= 2) {
    lat = parseFloat(args[0])
    lon = parseFloat(args[1])
    name = args[2] || `Custom (${lat}, ${lon})`

    if (isNaN(lat) || isNaN(lon)) {
      console.error('❌ Invalid coordinates. Usage: npx tsx scripts/test-soil-moisture.ts [lat] [lon] [name]')
      console.error('   Example: npx tsx scripts/test-soil-moisture.ts 37.0422 22.114 "My Farm"')
      process.exit(1)
    }
  }

  try {
    await testSoilMoisture(lat, lon, name)

  } catch (error) {
    console.error('❌ Error:', error)
    if (String(error).includes('COPERNICUS')) {
      console.log('')
      console.log('💡 Tip: Set your credentials like this:')
      console.log('   COPERNICUS_CLIENT_ID=xxx COPERNICUS_CLIENT_SECRET=yyy npx tsx scripts/test-soil-moisture.ts')
    }
  }
}

main()
