import { prisma } from '@/lib/db'
import { fetchWeatherData } from '@/lib/weather'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Helper to parse coordinates
function parseCoordinates(coordString: string): { lat: number; lng: number } | null {
  try {
    const [lat, lng] = coordString.split(',').map(s => parseFloat(s.trim()))
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng }
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

// Helper to format weather string
async function getWeatherString(coordinates: string | null): Promise<string | undefined> {
  if (!coordinates) return undefined

  const coords = parseCoordinates(coordinates)
  if (!coords) return undefined

  try {
    const weather = await fetchWeatherData(coords.lat, coords.lng)
    const current = weather.current
    return `${current.description}, ${current.temperature}°C, Υγρασία ${current.humidity}%, Άνεμος ${current.windSpeed.toFixed(1)} m/s`
  } catch (error) {
    console.error('Failed to fetch weather:', error)
    return undefined
  }
}

// POST /api/activities/bulk
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      farmIds,
      type,
      title,
      description,
      date,
      duration,
      cost,
      notes,
      completed
    } = body

    // Validate required fields
    if (!farmIds || !Array.isArray(farmIds) || farmIds.length === 0) {
      return NextResponse.json({ error: 'At least one farm is required' }, { status: 400 })
    }

    if (!type || !title || !date) {
      return NextResponse.json({ error: 'Type, title, and date are required' }, { status: 400 })
    }

    // Verify user owns all the farms
    const farms = await prisma.farm.findMany({
      where: {
        id: { in: farmIds },
        user: { clerkId: userId }
      }
    })

    if (farms.length !== farmIds.length) {
      return NextResponse.json({ error: 'Some farms not found or access denied' }, { status: 404 })
    }

    // Calculate cost distribution by tree count when multiple farms selected
    const costPerFarm: Map<string, number | null> = new Map()

    if (cost && farms.length > 1) {
      // Calculate total trees across all selected farms
      const totalTrees = farms.reduce((sum, farm) => sum + (farm.treeCount || 0), 0)

      if (totalTrees > 0) {
        // Distribute cost proportionally by tree count
        for (const farm of farms) {
          const farmTrees = farm.treeCount || 0
          if (farmTrees > 0) {
            const proportion = farmTrees / totalTrees
            const farmCost = Math.round(cost * proportion * 100) / 100 // Round to 2 decimal places
            costPerFarm.set(farm.id, farmCost)
          } else {
            // Farm has no trees, assign 0 cost
            costPerFarm.set(farm.id, 0)
          }
        }
      } else {
        // No farms have tree counts, distribute equally
        const equalCost = Math.round((cost / farms.length) * 100) / 100
        for (const farm of farms) {
          costPerFarm.set(farm.id, equalCost)
        }
      }
    } else {
      // Single farm or no cost - use the provided cost as-is
      for (const farm of farms) {
        costPerFarm.set(farm.id, cost || null)
      }
    }

    // Create activities for each farm
    const activityDate = new Date(date)
    const createdActivities = []

    for (const farm of farms) {
      // Get weather for each farm if it has coordinates
      const weather = await getWeatherString(farm.coordinates)
      const farmCost = costPerFarm.get(farm.id)

      const activity = await prisma.activity.create({
        data: {
          farmId: farm.id,
          type,
          title,
          description: description || null,
          date: activityDate,
          duration: duration || null,
          cost: farmCost ?? null,
          weather: weather || null,
          notes: notes || null,
          completed: completed || false
        }
      })

      createdActivities.push({
        ...activity,
        farmName: farm.name,
        treeCount: farm.treeCount
      })
    }

    return NextResponse.json({
      success: true,
      count: createdActivities.length,
      activities: createdActivities,
      costDistributed: cost && farms.length > 1
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating bulk activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
