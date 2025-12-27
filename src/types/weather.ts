// Weather data types for OpenWeatherMap API integration

export interface WeatherCurrent {
  temperature: number      // Celsius
  feelsLike: number        // Celsius
  humidity: number         // Percentage (0-100)
  pressure: number         // hPa
  windSpeed: number        // m/s
  windDirection: number    // degrees
  clouds: number           // Percentage (0-100)
  visibility: number       // meters
  description: string      // Weather description
  icon: string             // Weather icon code
  sunrise: Date
  sunset: Date
  updatedAt: Date
}

export interface WeatherForecastDay {
  date: Date
  tempMin: number
  tempMax: number
  humidity: number
  precipitation: number    // mm
  precipitationProbability: number  // 0-1
  windSpeed: number
  description: string
  icon: string
}

export interface WeatherData {
  current: WeatherCurrent
  forecast: WeatherForecastDay[]
  location: {
    name: string
    country: string
    lat: number
    lon: number
  }
}

// Alert types for smart notifications
export type AlertSeverity = 'info' | 'warning' | 'danger'
export type AlertType = 'frost' | 'heat' | 'irrigation' | 'disease' | 'wind' | 'rain'

export interface WeatherAlert {
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  recommendation: string
  validUntil?: Date
}

// Irrigation recommendation
export interface IrrigationRecommendation {
  shouldIrrigate: boolean
  reason: string
  nextIrrigationDate?: Date
  waterAmount?: string  // e.g., "15-20 λίτρα/δέντρο"
}

// Disease risk assessment
export interface DiseaseRisk {
  disease: string
  greekName: string
  riskLevel: 'low' | 'medium' | 'high'
  riskPercentage: number
  conditions: string
  prevention: string
}

// Complete weather intelligence response
export interface WeatherIntelligence {
  weather: WeatherData
  alerts: WeatherAlert[]
  irrigation: IrrigationRecommendation
  diseaseRisks: DiseaseRisk[]
  lastUpdated: Date
}

// Greek translations for weather conditions
export const WEATHER_DESCRIPTIONS_EL: Record<string, string> = {
  'clear sky': 'Αίθριος',
  'few clouds': 'Λίγα σύννεφα',
  'scattered clouds': 'Αραιή νέφωση',
  'broken clouds': 'Νεφελώδης',
  'overcast clouds': 'Συννεφιασμένος',
  'shower rain': 'Ψιχάλα',
  'rain': 'Βροχή',
  'light rain': 'Ελαφριά βροχή',
  'moderate rain': 'Μέτρια βροχή',
  'heavy rain': 'Δυνατή βροχή',
  'thunderstorm': 'Καταιγίδα',
  'snow': 'Χιόνι',
  'mist': 'Ομίχλη',
  'fog': 'Πυκνή ομίχλη',
  'haze': 'Αχλύς',
  'dust': 'Σκόνη',
  'smoke': 'Καπνός'
}

// Weather icon mapping
export const WEATHER_ICONS: Record<string, string> = {
  '01d': '☀️',  // clear sky day
  '01n': '🌙',  // clear sky night
  '02d': '⛅',  // few clouds day
  '02n': '☁️',  // few clouds night
  '03d': '☁️',  // scattered clouds
  '03n': '☁️',
  '04d': '☁️',  // broken clouds
  '04n': '☁️',
  '09d': '🌧️', // shower rain
  '09n': '🌧️',
  '10d': '🌦️', // rain day
  '10n': '🌧️', // rain night
  '11d': '⛈️', // thunderstorm
  '11n': '⛈️',
  '13d': '❄️', // snow
  '13n': '❄️',
  '50d': '🌫️', // mist
  '50n': '🌫️'
}
