import { PrismaClient, WeatherDataSource } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()
export const db = prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Create a user from Clerk data
export async function createUser(clerkUser: {
  id: string
  emailAddresses: Array<{ emailAddress: string }>
  firstName: string | null
  lastName: string | null
}) {
  try {
    const user = await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
      },
      create: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
      },
    })

    console.log('User created/updated:', user.id)
    return user
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

// Get user by Clerk ID (basic info only)
export async function getUserByClerkIdBasic(clerkId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId }
    })

    return user
  } catch (error) {
    console.error('Error getting user:', error)
    throw error
  }
}

// Get user by Clerk ID (with all related data)
export async function getUserByClerkId(clerkId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        farms: {
          include: {
            activities: {
              orderBy: { date: 'desc' },
              take: 1 // Only get the most recent activity for each farm
            },
            harvests: true,
          }
        }
      }
    })

    return user
  } catch (error) {
    console.error('Error getting user:', error)
    throw error
  }
}

// Get farm by ID with all related data, scoped to the current Clerk user.
export async function getFarmById(farmId: string, clerkId: string) {
  try {
    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        user: {
          clerkId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        activities: {
          orderBy: { date: 'desc' }
        },
        harvests: {
          orderBy: { year: 'desc' }
        }
      }
    })

    return farm
  } catch (error) {
    console.error('Error getting farm:', error)
    throw error
  }
}

// ===== WEATHER RECORD FUNCTIONS =====

export interface WeatherRecordInput {
  farmId: string
  date: Date
  tempHigh: number
  tempLow: number
  tempAvg: number
  humidity: number
  rainfall: number
  windSpeed: number
  windGust?: number
  windDirection?: number
  pressure?: number
  clouds?: number
  uvIndex?: number
  condition: string
  icon?: string
  source?: WeatherDataSource
}

// Running mean of two values where either may be missing.
function meanWith(prev: number | null | undefined, next: number | null | undefined, n: number): number | null {
  if (next == null) return prev ?? null
  if (prev == null) return next
  return (prev * n + next) / (n + 1)
}

function maxWith(prev: number | null | undefined, next: number | null | undefined): number | null {
  if (prev == null) return next ?? null
  if (next == null) return prev
  return Math.max(prev, next)
}

function roundOrNull(value: number | null): number | null {
  return value == null ? null : Math.round(value)
}

// The day's already-aggregated values needed to fold in a new sample.
export interface WeatherDayAggregate {
  tempHigh: number
  tempLow: number
  tempAvg: number
  sampleCount: number
  humidity: number
  rainfall: number
  windSpeed: number
  windGust?: number | null
  windDirection?: number | null
  pressure?: number | null
  clouds?: number | null
  uvIndex?: number | null
  icon?: string | null
  source?: WeatherDataSource
}

/**
 * Pure aggregation: fold one sample into the day's running averages.
 * `tempAvg` in the sample is the instantaneous reading; `tempHigh`/`tempLow`
 * are candidate daily extremes (e.g. forecast) used to widen the range.
 * Exported so the math can be unit-tested without a database.
 */
export function foldWeatherSample(existing: WeatherDayAggregate, sample: WeatherRecordInput) {
  const n = existing.sampleCount
  return {
    tempHigh: Math.max(existing.tempHigh, sample.tempHigh, sample.tempAvg),
    tempLow: Math.min(existing.tempLow, sample.tempLow, sample.tempAvg),
    tempAvg: (existing.tempAvg * n + sample.tempAvg) / (n + 1),
    sampleCount: n + 1,
    humidity: Math.round((existing.humidity * n + sample.humidity) / (n + 1)),
    // Rainfall is a daily total from the forecast, so keep the largest reported
    // value rather than summing irregular samples.
    rainfall: Math.max(existing.rainfall, sample.rainfall),
    windSpeed: (existing.windSpeed * n + sample.windSpeed) / (n + 1),
    windGust: maxWith(existing.windGust, sample.windGust),
    windDirection: sample.windDirection ?? existing.windDirection ?? null,
    pressure: roundOrNull(meanWith(existing.pressure, sample.pressure, n)),
    clouds: roundOrNull(meanWith(existing.clouds, sample.clouds, n)),
    uvIndex: maxWith(existing.uvIndex, sample.uvIndex),
    icon: sample.icon ?? existing.icon ?? null,
    source: sample.source || existing.source || ('API_CURRENT' as WeatherDataSource),
  }
}

/**
 * Record a single weather sample for a farm's day, maintaining true daily
 * averages. The first sample of the day creates the record; every later sample
 * folds into the running mean (tempAvg, humidity, windSpeed, clouds, pressure),
 * widens the observed range (tempHigh/tempLow), and keeps the peak gust/UV and
 * best-known rainfall total. Call this as often as you like (hourly cron plus
 * opportunistic saves) — the more samples, the more accurate the average.
 *
 * In this sample model `tempAvg` is the instantaneous reading, while
 * `tempHigh`/`tempLow` are the candidate daily extremes (e.g. from the
 * forecast) used to widen the observed range.
 */
export async function saveWeatherRecord(data: WeatherRecordInput) {
  try {
    // Normalize date to midnight UTC
    const normalizedDate = new Date(data.date)
    normalizedDate.setUTCHours(0, 0, 0, 0)

    const existing = await prisma.weatherRecord.findUnique({
      where: { farmId_date: { farmId: data.farmId, date: normalizedDate } },
    })

    if (!existing) {
      return await prisma.weatherRecord.create({
        data: {
          farmId: data.farmId,
          date: normalizedDate,
          tempHigh: Math.max(data.tempHigh, data.tempAvg),
          tempLow: Math.min(data.tempLow, data.tempAvg),
          tempAvg: data.tempAvg,
          sampleCount: 1,
          humidity: data.humidity,
          rainfall: data.rainfall,
          windSpeed: data.windSpeed,
          windGust: data.windGust,
          windDirection: data.windDirection,
          pressure: data.pressure,
          clouds: data.clouds,
          uvIndex: data.uvIndex,
          condition: data.condition,
          icon: data.icon,
          source: data.source || 'API_CURRENT',
        },
      })
    }

    return await prisma.weatherRecord.update({
      where: { id: existing.id },
      data: {
        ...foldWeatherSample(existing, data),
        condition: data.condition,
        recordedAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Error saving weather record:', error)
    throw error
  }
}

// Get weather for a specific date
export async function getWeatherForDate(farmId: string, date: Date) {
  try {
    // Normalize to start of day in UTC
    const startOfDay = new Date(date)
    startOfDay.setUTCHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setUTCHours(23, 59, 59, 999)

    const record = await prisma.weatherRecord.findFirst({
      where: {
        farmId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: { recordedAt: 'desc' } // Get most recent record for that day
    })

    return record
  } catch (error) {
    console.error('Error getting weather for date:', error)
    return null
  }
}

// Get weather history for a farm
export async function getWeatherHistory(farmId: string, options?: {
  startDate?: Date
  endDate?: Date
  limit?: number
}) {
  try {
    const where: { farmId: string; date?: { gte?: Date; lte?: Date } } = { farmId }

    if (options?.startDate || options?.endDate) {
      where.date = {}
      if (options.startDate) where.date.gte = options.startDate
      if (options.endDate) where.date.lte = options.endDate
    }

    const records = await prisma.weatherRecord.findMany({
      where,
      orderBy: { date: 'desc' },
      take: options?.limit || 30
    })

    return records
  } catch (error) {
    console.error('Error getting weather history:', error)
    throw error
  }
}

// ===== Olive fruit fly (δάκος) trap readings =====

export interface TrapReadingInput {
  farmId: string
  date: Date
  trapType?: 'MCPHAIL' | 'YELLOW_STICKY' | 'DACUS_TRAP' | 'OTHER'
  trapCount?: number
  totalCatch: number
  femaleCatch?: number | null
  daysSincePrev?: number | null
  notes?: string | null
}

// Record a trap inspection. When daysSincePrev is not supplied we derive it
// from the most recent prior reading so flies/trap/day stays meaningful.
export async function createTrapReading(data: TrapReadingInput) {
  try {
    let daysSincePrev = data.daysSincePrev ?? null
    if (daysSincePrev == null) {
      const prev = await prisma.trapReading.findFirst({
        where: { farmId: data.farmId, date: { lt: data.date } },
        orderBy: { date: 'desc' },
        select: { date: true },
      })
      if (prev) {
        const diff = Math.round(
          (data.date.getTime() - prev.date.getTime()) / (24 * 60 * 60 * 1000)
        )
        daysSincePrev = diff > 0 ? diff : null
      }
    }

    return await prisma.trapReading.create({
      data: {
        farmId: data.farmId,
        date: data.date,
        trapType: data.trapType ?? 'MCPHAIL',
        trapCount: data.trapCount && data.trapCount > 0 ? data.trapCount : 1,
        totalCatch: data.totalCatch,
        femaleCatch: data.femaleCatch ?? null,
        daysSincePrev,
        notes: data.notes ?? null,
      },
    })
  } catch (error) {
    console.error('Error creating trap reading:', error)
    throw error
  }
}

export async function getTrapReadings(farmId: string, options?: { startDate?: Date; limit?: number }) {
  try {
    const where: { farmId: string; date?: { gte?: Date } } = { farmId }
    if (options?.startDate) {
      where.date = { gte: options.startDate }
    }
    return await prisma.trapReading.findMany({
      where,
      orderBy: { date: 'desc' },
      take: options?.limit ?? 30,
    })
  } catch (error) {
    console.error('Error getting trap readings:', error)
    throw error
  }
}

// Get all farms with coordinates for cron job
export async function getAllFarmsWithCoordinates() {
  try {
    const farms = await prisma.farm.findMany({
      where: {
        isActive: true,
        OR: [
          {
            latitude: { not: null },
            longitude: { not: null }
          },
          {
            coordinates: { not: null }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        coordinates: true,
        latitude: true,
        longitude: true,
        userId: true,
        user: {
          select: {
            subscription: { select: { plan: true } }
          }
        }
      }
    })

    return farms
  } catch (error) {
    console.error('Error getting farms with coordinates:', error)
    throw error
  }
}

// Get weather statistics for a farm
export async function getWeatherStats(farmId: string, days: number = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const records = await prisma.weatherRecord.findMany({
      where: {
        farmId,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    })

    if (records.length === 0) {
      return null
    }

    // Calculate statistics
    const temps = records.map(r => r.tempAvg)
    const humidities = records.map(r => r.humidity)
    const totalRainfall = records.reduce((sum, r) => sum + r.rainfall, 0)

    return {
      avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
      maxTemp: Math.max(...records.map(r => r.tempHigh)),
      minTemp: Math.min(...records.map(r => r.tempLow)),
      avgHumidity: humidities.reduce((a, b) => a + b, 0) / humidities.length,
      totalRainfall,
      recordCount: records.length,
      dateRange: {
        start: records[0].date,
        end: records[records.length - 1].date
      }
    }
  } catch (error) {
    console.error('Error getting weather stats:', error)
    throw error
  }
}
