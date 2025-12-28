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

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5'

// Fetch current weather and 5-day forecast from OpenWeatherMap
export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OpenWeatherMap API key is not configured')
  }

  // Fetch current weather and forecast in parallel
  const [currentRes, forecastRes] = await Promise.all([
    fetch(
      `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&lang=el&appid=${OPENWEATHER_API_KEY}`
    ),
    fetch(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&lang=el&appid=${OPENWEATHER_API_KEY}`
    )
  ])

  if (!currentRes.ok || !forecastRes.ok) {
    // Try to get error message from OpenWeatherMap
    const errorData = await currentRes.json().catch(() => ({}))
    const errorMessage = errorData.message || 'Failed to fetch weather data'
    console.error('OpenWeatherMap API error:', errorMessage, 'Status:', currentRes.status)
    throw new Error(`Weather API: ${errorMessage}`)
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
    updatedAt: new Date()
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
    const dateKey = date.toISOString().split('T')[0]

    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, [])
    }
    dailyMap.get(dateKey)!.push(forecast)
  }

  const dailyForecasts: WeatherForecastDay[] = []

  for (const [dateKey, dayForecasts] of dailyMap) {
    // Skip today, start from tomorrow
    const forecastDate = new Date(dateKey)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (forecastDate <= today) continue
    if (dailyForecasts.length >= 5) break

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
      recommendation: 'Προστατέψτε τα νεαρά δέντρα με κάλυμμα. Αποφύγετε το πότισμα μέχρι να ανέβει η θερμοκρασία.'
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
      recommendation: 'Αυξήστε τη συχνότητα ποτίσματος. Αποφύγετε εργασίες τις μεσημεριανές ώρες (11:00-17:00).'
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
        recommendation: 'Προγραμματίστε επιπλέον πότισμα και αποφύγετε ψεκασμούς.',
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
      message: `Αναμενόμενη βροχόπτωση: ${Math.round(todayRain)}mm`,
      recommendation: 'Αναβάλετε τους ψεκασμούς. Καλή ευκαιρία για αποφυγή ποτίσματος.'
    })
  }

  return alerts
}

// Generate irrigation recommendation
export function generateIrrigationRecommendation(
  weather: WeatherData,
  lastWateringDate?: Date
): IrrigationRecommendation {
  const { current, forecast } = weather

  // Calculate expected rainfall in next 3 days
  const expectedRainfall = forecast
    .slice(0, 3)
    .reduce((sum, day) => sum + day.precipitation, 0)

  // High temperature increases water needs
  const isHot = current.temperature > 32 || forecast.some(d => d.tempMax > 35)

  // Check humidity - low humidity means more evaporation
  const isLowHumidity = current.humidity < 40

  // Days since last watering
  const daysSinceWatering = lastWateringDate
    ? Math.floor((Date.now() - lastWateringDate.getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Decision logic
  if (expectedRainfall > 15) {
    return {
      shouldIrrigate: false,
      reason: `Αναμένεται βροχή (${Math.round(expectedRainfall)}mm) τις επόμενες 3 μέρες. Δεν χρειάζεται πότισμα.`,
      nextIrrigationDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
    }
  }

  if (current.temperature <= 2) {
    return {
      shouldIrrigate: false,
      reason: 'Χαμηλή θερμοκρασία. Αποφύγετε το πότισμα για να μην παγώσουν οι ρίζες.',
      nextIrrigationDate: forecast.find(d => d.tempMin > 5)?.date
    }
  }

  const currentMonth = new Date().getMonth() + 1 // 1-12
  const isSummer = currentMonth >= 6 && currentMonth <= 8
  const isWinter = currentMonth === 12 || currentMonth <= 2

  if (isWinter && !isHot) {
    return {
      shouldIrrigate: false,
      reason: 'Χειμερινή περίοδος με χαμηλές ανάγκες σε νερό. Συνήθως επαρκεί η φυσική βροχόπτωση.',
      nextIrrigationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  }

  if (isSummer && isHot && isLowHumidity) {
    return {
      shouldIrrigate: true,
      reason: `Υψηλή θερμοκρασία (${current.temperature}°C) και χαμηλή υγρασία (${current.humidity}%). Συνιστάται πότισμα σήμερα.`,
      waterAmount: '40-60 λίτρα/δέντρο',
      nextIrrigationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    }
  }

  if (isSummer && (daysSinceWatering === null || daysSinceWatering >= 5)) {
    return {
      shouldIrrigate: true,
      reason: daysSinceWatering
        ? `Έχουν περάσει ${daysSinceWatering} μέρες από το τελευταίο πότισμα. Ώρα για επόμενο.`
        : 'Καλοκαιρινή περίοδος με αυξημένες ανάγκες. Συνιστάται τακτικό πότισμα.',
      waterAmount: '30-50 λίτρα/δέντρο',
      nextIrrigationDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
    }
  }

  // Default - no urgent need
  return {
    shouldIrrigate: false,
    reason: 'Οι συνθήκες είναι ικανοποιητικές. Δεν απαιτείται άμεσο πότισμα.',
    nextIrrigationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  }
}

// Assess disease risks based on weather conditions
export function assessDiseaseRisks(weather: WeatherData): DiseaseRisk[] {
  const risks: DiseaseRisk[] = []
  const { current, forecast } = weather

  // Average humidity over forecast period
  const avgHumidity = (current.humidity + forecast.reduce((sum, d) => sum + d.humidity, 0)) / (forecast.length + 1)

  // Check for conditions favorable to diseases
  const isHighHumidity = avgHumidity > 70
  const isWarm = current.temperature >= 15 && current.temperature <= 25
  const isHot = current.temperature > 25
  const hasRecentRain = forecast.slice(0, 2).some(d => d.precipitation > 5)

  // Peacock Spot (Cycloconium oleaginum) - High humidity + mild temps
  if (isHighHumidity && isWarm) {
    const riskLevel = avgHumidity > 85 ? 'high' : avgHumidity > 75 ? 'medium' : 'low'
    const riskPercentage = Math.min(95, Math.round((avgHumidity - 50) * 1.5 + (hasRecentRain ? 15 : 0)))

    risks.push({
      disease: 'Peacock Spot',
      greekName: 'Κυκλοκόνιο (Μάτι Παγωνιού)',
      riskLevel,
      riskPercentage,
      conditions: `Υγρασία ${Math.round(avgHumidity)}%, θερμοκρασία ${current.temperature}°C`,
      prevention: 'Προληπτικός ψεκασμός με χαλκούχο σκεύασμα. Βελτίωση αερισμού με κλάδεμα.'
    })
  }

  // Olive Anthracnose - Warm and wet conditions
  if (isWarm && hasRecentRain && current.humidity > 65) {
    const riskPercentage = Math.min(90, Math.round(current.humidity * 0.8 + (hasRecentRain ? 20 : 0)))

    risks.push({
      disease: 'Anthracnose',
      greekName: 'Ανθράκωση (Γλοιοσπόριο)',
      riskLevel: riskPercentage > 70 ? 'high' : riskPercentage > 50 ? 'medium' : 'low',
      riskPercentage,
      conditions: `Βροχοπτώσεις + υγρασία ${Math.round(current.humidity)}%`,
      prevention: 'Αφαίρεση προσβεβλημένων καρπών. Ψεκασμός με χαλκούχα πριν τη συγκομιδή.'
    })
  }

  // Olive Fruit Fly (Bactrocera oleae) - Summer heat
  const currentMonth = new Date().getMonth() + 1
  if (isHot && currentMonth >= 6 && currentMonth <= 10) {
    const riskPercentage = Math.min(85, Math.round((current.temperature - 20) * 3 + (current.humidity > 60 ? 15 : 0)))

    risks.push({
      disease: 'Olive Fruit Fly',
      greekName: 'Δάκος της Ελιάς',
      riskLevel: riskPercentage > 65 ? 'high' : riskPercentage > 45 ? 'medium' : 'low',
      riskPercentage,
      conditions: `Θερμοκρασία ${current.temperature}°C, καλοκαιρινή περίοδος`,
      prevention: 'Τοποθέτηση παγίδων McPhail. Παρακολούθηση πληθυσμού και έγκαιρος ψεκασμός.'
    })
  }

  // Verticillium Wilt - wet soil conditions
  if (hasRecentRain && forecast.reduce((sum, d) => sum + d.precipitation, 0) > 30) {
    risks.push({
      disease: 'Verticillium Wilt',
      greekName: 'Βερτισιλλίωση',
      riskLevel: 'medium',
      riskPercentage: 45,
      conditions: 'Υπερβολική υγρασία εδάφους από έντονες βροχοπτώσεις',
      prevention: 'Αποφύγετε το πότισμα. Βεβαιωθείτε ότι υπάρχει καλή αποστράγγιση.'
    })
  }

  // Sort by risk level
  const riskOrder = { high: 0, medium: 1, low: 2 }
  risks.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel])

  return risks
}

// Main function to get complete weather intelligence
export async function getWeatherIntelligence(
  lat: number,
  lon: number,
  lastWateringDate?: Date
): Promise<WeatherIntelligence> {
  const weather = await fetchWeatherData(lat, lon)
  const alerts = generateAlerts(weather)
  const irrigation = generateIrrigationRecommendation(weather, lastWateringDate)
  const diseaseRisks = assessDiseaseRisks(weather)

  return {
    weather,
    alerts,
    irrigation,
    diseaseRisks,
    lastUpdated: new Date()
  }
}
