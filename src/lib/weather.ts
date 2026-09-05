import { env } from '@/env'
import { computePestRisk, type DailyWeather } from '@/lib/agronomy/pest-risk'
import { greekDate } from '@/lib/ai/activity-weather'
import {
  WeatherData,
  WeatherCurrent,
  WeatherForecastDay,
  WeatherAlert,
  WeatherIntelligence,
  IrrigationRecommendation,
  DiseaseRisk,
  WEATHER_DESCRIPTIONS_EL
} from '@/types/weather'

const OPENWEATHER_API_KEY = env.OPENWEATHER_API_KEY
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5'

// Fetch current weather and 5-day forecast from OpenWeatherMap
export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OpenWeatherMap API key is not configured')
  }

  // Fetch current weather and forecast in parallel
  const [currentRes, forecastRes] = await Promise.all([
    fetch(
      `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&lang=el&appid=${OPENWEATHER_API_KEY}`, { signal: AbortSignal.timeout(8000), next: { revalidate: 1800 } }
    ),
    fetch(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&lang=el&appid=${OPENWEATHER_API_KEY}`, { signal: AbortSignal.timeout(8000), next: { revalidate: 1800 } }
    )
  ]).catch(() => { throw new Error('WEATHER_PROVIDER_UNAVAILABLE') })

  if (!currentRes.ok || !forecastRes.ok) {
    console.warn('Weather provider unavailable', { currentStatus: currentRes.status, forecastStatus: forecastRes.status })
    throw new Error('WEATHER_PROVIDER_UNAVAILABLE')
  }

  const currentData = await currentRes.json()
  const forecastData = await forecastRes.json()

  // Parse current weather
  const current: WeatherCurrent = {
    temperature: Math.round(currentData.main.temp),
    feelsLike: Math.round(currentData.main.feels_like),
    humidity: currentData.main.humidity,
    pressure: currentData.main.pressure,
    windSpeed: currentData.wind.speed,
    windDirection: currentData.wind.deg || 0,
    clouds: currentData.clouds.all,
    visibility: currentData.visibility,
    description: translateWeatherDescription(currentData.weather[0].description),
    icon: currentData.weather[0].icon,
    sunrise: new Date(currentData.sys.sunrise * 1000),
    sunset: new Date(currentData.sys.sunset * 1000),
    updatedAt: new Date(currentData.dt * 1000)
  }

  // Parse forecast - group by day and get daily min/max
  const dailyForecasts = groupForecastByDay(forecastData.list)

  return {
    current,
    forecast: dailyForecasts,
    location: {
      name: currentData.name,
      country: currentData.sys.country,
      lat,
      lon
    }
  }
}

// Group 3-hour forecasts into daily summaries
function groupForecastByDay(forecasts: any[]): WeatherForecastDay[] {
  const dailyMap = new Map<string, any[]>()

  for (const forecast of forecasts) {
    const date = new Date(forecast.dt * 1000)
    const dateKey = greekDate(date)

    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, [])
    }
    dailyMap.get(dateKey)!.push(forecast)
  }

  const dailyForecasts: WeatherForecastDay[] = []

  for (const [dateKey, dayForecasts] of dailyMap) {
    if (dateKey < greekDate(new Date())) continue
    if (dailyForecasts.length >= 6) break

    const temps = dayForecasts.map((f: any) => f.main.temp)
    const humidities = dayForecasts.map((f: any) => f.main.humidity)
    const precipitations = dayForecasts.map((f: any) => f.rain?.['3h'] || 0)
    const precipProbs = dayForecasts.map((f: any) => f.pop || 0)
    const windSpeeds = dayForecasts.map((f: any) => f.wind.speed)

    // Find the most common weather condition for the day
    const middayForecast = dayForecasts.find((f: any) => {
      const hour = new Date(f.dt * 1000).getHours()
      return hour >= 11 && hour <= 14
    }) || dayForecasts[Math.floor(dayForecasts.length / 2)]

    dailyForecasts.push({
      date: new Date(dateKey),
      tempMin: Math.round(Math.min(...temps)),
      tempMax: Math.round(Math.max(...temps)),
      humidity: Math.round(humidities.reduce((a: number, b: number) => a + b, 0) / humidities.length),
      precipitation: precipitations.reduce((a: number, b: number) => a + b, 0),
      precipitationProbability: Math.max(...precipProbs),
      windSpeed: Math.max(...windSpeeds),
      description: translateWeatherDescription(middayForecast.weather[0].description),
      icon: middayForecast.weather[0].icon
    })
  }

  return dailyForecasts
}

// Translate weather description to Greek if not already
function translateWeatherDescription(description: string): string {
  const lowerDesc = description.toLowerCase()
  return WEATHER_DESCRIPTIONS_EL[lowerDesc] || description
}

// Generate weather alerts based on conditions
export function generateAlerts(weather: WeatherData): WeatherAlert[] {
  const alerts: WeatherAlert[] = []
  const { current, forecast } = weather

  // Check for frost (temperature <= 2°C)
  if (current.temperature <= 2) {
    alerts.push({
      type: 'frost',
      severity: current.temperature <= 0 ? 'danger' : 'warning',
      title: 'Κίνδυνος Παγετού',
      message: `Τρέχουσα θερμοκρασία: ${current.temperature}°C`,
      recommendation: 'Ελέγξτε τα νεαρά δέντρα και συμβουλευτείτε τον γεωπόνο για κατάλληλη προστασία.'
    })
  }

  // Check forecast for upcoming frost
  for (const day of forecast.slice(0, 3)) {
    if (day.tempMin <= 2) {
      const dateStr = day.date.toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' })
      alerts.push({
        type: 'frost',
        severity: day.tempMin <= 0 ? 'danger' : 'warning',
        title: 'Προειδοποίηση Παγετού',
        message: `Αναμένεται ${day.tempMin}°C την ${dateStr}`,
        recommendation: 'Προετοιμάστε προστατευτικά καλύμματα για τα δέντρα.',
        validUntil: day.date
      })
      break // Only show one frost warning
    }
  }

  // Check for extreme heat (>= 38°C)
  if (current.temperature >= 38) {
    alerts.push({
      type: 'heat',
      severity: current.temperature >= 42 ? 'danger' : 'warning',
      title: 'Κύμα Καύσωνα',
      message: `Τρέχουσα θερμοκρασία: ${current.temperature}°C`,
      recommendation: 'Ελέγξτε την υγρασία εδάφους και την κατάσταση των δέντρων. Αποφύγετε εργασίες τις μεσημεριανές ώρες (11:00-17:00).'
    })
  }

  // Check forecast for upcoming heatwave
  for (const day of forecast.slice(0, 3)) {
    if (day.tempMax >= 38) {
      const dateStr = day.date.toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' })
      alerts.push({
        type: 'heat',
        severity: day.tempMax >= 42 ? 'danger' : 'warning',
        title: 'Προειδοποίηση Καύσωνα',
        message: `Αναμένεται ${day.tempMax}°C την ${dateStr}`,
        recommendation: 'Ελέγξτε την υγρασία εδάφους και επανεξετάστε την ώρα εργασίας.',
        validUntil: day.date
      })
      break
    }
  }

  // Check for strong winds (> 10 m/s = 36 km/h)
  if (current.windSpeed > 10) {
    alerts.push({
      type: 'wind',
      severity: current.windSpeed > 15 ? 'danger' : 'warning',
      title: 'Ισχυροί Άνεμοι',
      message: `Ένταση ανέμου: ${Math.round(current.windSpeed * 3.6)} km/h`,
      recommendation: 'Αποφύγετε ψεκασμούς φυτοφαρμάκων. Ελέγξτε τα στηρίγματα των νεαρών δέντρων.'
    })
  }

  // Check for heavy rain
  const todayRain = forecast[0]?.precipitation || 0
  if (todayRain > 20) {
    alerts.push({
      type: 'rain',
      severity: todayRain > 50 ? 'warning' : 'info',
      title: 'Έντονες Βροχοπτώσεις',
      message: `Αναμενόμενη βροχόπτωση στις ${forecast[0].date.toLocaleDateString('el-GR')}: ${Math.round(todayRain)}mm`,
      recommendation: 'Επανεξετάστε τον προγραμματισμό εργασιών και ελέγξτε την αποστράγγιση. Η πρόγνωση δεν επιβεβαιώνει υγρασία εδάφους.'
    })
  }

  return alerts
}

// Weather is a prompt to inspect the field, never a soil-water balance.
export function generateIrrigationRecommendation(
  weather: WeatherData,
  lastWateringDate?: Date
): IrrigationRecommendation {
  const rain = weather.forecast.slice(0, 3).reduce((sum, day) => sum + day.precipitation, 0)
  return {
    shouldIrrigate: null,
    reason: `Τρέχουσα θερμοκρασία ${weather.current.temperature}°C. Εκτιμώμενη βροχή στις ${Math.min(3, weather.forecast.length)} διαθέσιμες ημέρες πρόγνωσης: ${Math.round(rain)} mm. ${lastWateringDate ? `Τελευταία καταγραφή άρδευσης: ${lastWateringDate.toLocaleDateString('el-GR')}. ` : ''}Ελέγξτε υγρασία εδάφους, στάδιο ανάπτυξης και παροχή αρδευτικού συστήματος πριν αποφασίσετε αν και πόσο θα ποτίσετε.`,
  }
}

// One shared, explicitly heuristic engine. Forecast rain is not observed rain.
export function assessDiseaseRisks(records: DailyWeather[], now = new Date()): DiseaseRisk[] {
  const report = computePestRisk(records, now)
  if (!report.sufficient) return []
  return [
    { disease: 'Olive Fruit Fly', greekName: 'Δάκος της Ελιάς', risk: report.dakos },
    { disease: 'Peacock Spot', greekName: 'Κυκλοκόνιο', risk: report.peacockSpot },
  ].map(({ disease, greekName, risk }) => ({
    disease, greekName,
    riskLevel: risk.level === 'HIGH' || risk.level === 'EXTREME' ? 'high' : risk.level === 'MODERATE' ? 'medium' : 'low',
    riskScore: risk.score,
    conditions: `${report.windowDays} διαθέσιμες ημέρες ιστορικού. ${risk.rationale}`,
    prevention: 'Ενδεικτικός καιρικός δείκτης, όχι πιθανότητα προσβολής ή διάγνωση. Καταγράψτε ευρήματα από τον ελαιώνα και ελέγξτε τα με τον γεωπόνο πριν από επέμβαση.',
  }))
}

// Main function to get complete weather intelligence
export async function getWeatherIntelligence(
  lat: number,
  lon: number,
  lastWateringDate?: Date,
  history: DailyWeather[] = []
): Promise<WeatherIntelligence> {
  const weather = await fetchWeatherData(lat, lon)
  const alerts = generateAlerts(weather)
  const irrigation = generateIrrigationRecommendation(weather, lastWateringDate)
  const diseaseRisks = assessDiseaseRisks(history)

  return {
    weather,
    alerts,
    irrigation,
    diseaseRisks,
    lastUpdated: new Date()
  }
}
