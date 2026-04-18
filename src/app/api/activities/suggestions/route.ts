import { prisma } from '@/lib/db'
import { fetchWeatherData, generateAlerts, generateIrrigationRecommendation } from '@/lib/weather'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface Suggestion {
  type: 'warning' | 'info' | 'success'
  icon: 'wind' | 'rain' | 'water' | 'temperature' | 'activity'
  title: string
  message: string
  farmId?: string
  farmName?: string
}

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

// POST /api/activities/suggestions
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { farmIds, activityType, date } = body

    if (!farmIds || !Array.isArray(farmIds) || farmIds.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    if (!activityType || !date) {
      return NextResponse.json({ suggestions: [] })
    }

    // Get user's farms with coordinates
    const farms = await prisma.farm.findMany({
      where: {
        id: { in: farmIds },
        user: { clerkId: userId }
      },
      include: {
        activities: {
          where: {
            date: {
              gte: new Date(new Date(date).getTime() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              lte: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { date: 'desc' }
        }
      }
    })

    if (farms.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    const suggestions: Suggestion[] = []
    const selectedDate = new Date(date)

    // Process each farm
    for (const farm of farms) {
      // Check for recent same-type activities
      const recentSameTypeActivity = farm.activities.find(
        (a: { type: string; completed: boolean }) => a.type === activityType && a.completed
      )

      if (recentSameTypeActivity) {
        const daysSince = Math.floor(
          (selectedDate.getTime() - new Date(recentSameTypeActivity.date).getTime()) /
          (1000 * 60 * 60 * 24)
        )

        if (daysSince >= 0 && daysSince <= 3) {
          suggestions.push({
            type: 'warning',
            icon: 'activity',
            title: 'Πρόσφατη δραστηριότητα',
            message: `Αυτός ο τύπος δραστηριότητας πραγματοποιήθηκε πριν ${daysSince === 0 ? 'σήμερα' : daysSince === 1 ? '1 μέρα' : `${daysSince} μέρες`}.`,
            farmId: farm.id,
            farmName: farm.name
          })
        }
      }

      // Get weather data if coordinates available
      if (farm.coordinates) {
        const coords = parseCoordinates(farm.coordinates)
        if (coords) {
          try {
            const weather = await fetchWeatherData(coords.lat, coords.lng)
            const alerts = generateAlerts(weather)

            // Activity-specific weather checks
            if (activityType === 'PEST_CONTROL' || activityType === 'FERTILIZING') {
              // Check for wind
              if (weather.current.windSpeed > 5) {
                suggestions.push({
                  type: 'warning',
                  icon: 'wind',
                  title: 'Ισχυρός άνεμος',
                  message: `Άνεμος ${Math.round(weather.current.windSpeed * 3.6)} km/h. Ο ψεκασμός δεν συνιστάται.`,
                  farmId: farm.id,
                  farmName: farm.name
                })
              }

              // Check for rain in forecast
              const rainInNext24h = weather.forecast.slice(0, 2).some(d => d.precipitationProbability > 50)
              if (rainInNext24h) {
                suggestions.push({
                  type: 'warning',
                  icon: 'rain',
                  title: 'Αναμένεται βροχή',
                  message: 'Πιθανή βροχή τις επόμενες 24 ώρες. Ο ψεκασμός μπορεί να μην είναι αποτελεσματικός.',
                  farmId: farm.id,
                  farmName: farm.name
                })
              }
            }

            if (activityType === 'WATERING') {
              // Check last watering activity
              const lastWatering = farm.activities.find(a => a.type === 'WATERING' && a.completed)
              const lastWateringDate = lastWatering ? new Date(lastWatering.date) : undefined

              const irrigationRec = generateIrrigationRecommendation(weather, lastWateringDate)

              if (!irrigationRec.shouldIrrigate) {
                suggestions.push({
                  type: 'info',
                  icon: 'water',
                  title: 'Δεν απαιτείται πότισμα',
                  message: irrigationRec.reason,
                  farmId: farm.id,
                  farmName: farm.name
                })
              }

              // Check for upcoming rain
              const expectedRainfall = weather.forecast
                .slice(0, 3)
                .reduce((sum, day) => sum + day.precipitation, 0)

              if (expectedRainfall > 10) {
                suggestions.push({
                  type: 'info',
                  icon: 'rain',
                  title: 'Αναμένεται βροχή',
                  message: `Πρόβλεψη ${Math.round(expectedRainfall)}mm τις επόμενες 3 μέρες. Ίσως να μην χρειάζεται πότισμα.`,
                  farmId: farm.id,
                  farmName: farm.name
                })
              }
            }

            // Add general weather alerts
            for (const alert of alerts) {
              if (alert.severity === 'danger' || alert.severity === 'warning') {
                suggestions.push({
                  type: 'warning',
                  icon: alert.type === 'frost' || alert.type === 'heat' ? 'temperature' : alert.type === 'wind' ? 'wind' : 'rain',
                  title: alert.title,
                  message: alert.recommendation || alert.message,
                  farmId: farm.id,
                  farmName: farm.name
                })
              }
            }

            // Activity-specific positive suggestions
            if (activityType === 'PRUNING') {
              const month = selectedDate.getMonth() + 1
              if (month >= 1 && month <= 3) {
                suggestions.push({
                  type: 'success',
                  icon: 'activity',
                  title: 'Καλή περίοδος κλαδέματος',
                  message: 'Ο χειμώνας είναι ιδανική εποχή για κλάδεμα ελιάς.',
                  farmId: farm.id,
                  farmName: farm.name
                })
              }
            }

            if (activityType === 'HARVESTING') {
              const month = selectedDate.getMonth() + 1
              if (month >= 10 || month <= 1) {
                suggestions.push({
                  type: 'success',
                  icon: 'activity',
                  title: 'Περίοδος συγκομιδής',
                  message: 'Κατάλληλη εποχή για συγκομιδή ελιάς.',
                  farmId: farm.id,
                  farmName: farm.name
                })
              }
            }

          } catch (error) {
            console.error(`Failed to fetch weather for farm ${farm.id}:`, error)
            // Continue without weather suggestions for this farm
          }
        }
      }
    }

    // Deduplicate similar suggestions
    const uniqueSuggestions = suggestions.reduce<Suggestion[]>((acc, suggestion) => {
      const key = `${suggestion.title}-${suggestion.type}`
      const existing = acc.find(s => `${s.title}-${s.type}` === key && !s.farmId)

      // If there are multiple farms with the same suggestion, combine them
      if (farms.length > 1) {
        const similarSuggestions = suggestions.filter(
          (s: Suggestion) => s.title === suggestion.title && s.type === suggestion.type
        )
        if (similarSuggestions.length === farms.length && !acc.some(s => s.title === suggestion.title && !s.farmId)) {
          acc.push({
            ...suggestion,
            farmId: undefined,
            farmName: undefined,
            message: suggestion.message + ' (όλοι οι ελαιώνες)'
          })
          return acc
        }
      }

      if (!existing) {
        acc.push(suggestion)
      }
      return acc
    }, [])

    // Sort by type (warnings first)
    uniqueSuggestions.sort((a, b) => {
      const order = { warning: 0, info: 1, success: 2 }
      return order[a.type] - order[b.type]
    })

    return NextResponse.json({ suggestions: uniqueSuggestions.slice(0, 8) })
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return NextResponse.json({ suggestions: [] })
  }
}
