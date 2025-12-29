import { PrismaClient, WeatherDataSource } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Test database connection
export async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log('Database connected successfully!')

    // Test a simple query
    await prisma.$queryRaw`SELECT version()`
    console.log('Database query test successful!')

    return { success: true, message: 'Database connection successful!' }
  } catch (error) {
    console.error('Database connection failed:', error)
    return {
      success: false,
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  } finally {
    await prisma.$disconnect()
  }
}

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

// Get farm by ID with all related data
export async function getFarmById(farmId: string) {
  try {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
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

// Save or update a weather record (upsert)
export async function saveWeatherRecord(data: WeatherRecordInput) {
  try {
    // Normalize date to midnight UTC
    const normalizedDate = new Date(data.date)
    normalizedDate.setUTCHours(0, 0, 0, 0)

    const record = await prisma.weatherRecord.upsert({
      where: {
        farmId_date: {
          farmId: data.farmId,
          date: normalizedDate
        }
      },
      update: {
        tempHigh: data.tempHigh,
        tempLow: data.tempLow,
        tempAvg: data.tempAvg,
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
        recordedAt: new Date()
      },
      create: {
        farmId: data.farmId,
        date: normalizedDate,
        tempHigh: data.tempHigh,
        tempLow: data.tempLow,
        tempAvg: data.tempAvg,
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
        source: data.source || 'API_CURRENT'
      }
    })

    return record
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

// Get all farms with coordinates for cron job
export async function getAllFarmsWithCoordinates() {
  try {
    const farms = await prisma.farm.findMany({
      where: {
        coordinates: { not: null }
      },
      select: {
        id: true,
        name: true,
        coordinates: true
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
