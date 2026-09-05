import type { WeatherData } from '@/types/weather'

export function greekDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Athens', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

/** Never substitute current conditions for a past or out-of-range planned date. */
export function weatherForActivity(weather: WeatherData, date: Date, now = new Date()) {
  const key = greekDate(date)
  if (key < greekDate(now)) return null
  const forecast = weather.forecast.find(day => greekDate(new Date(day.date)) === key)
  if (key === greekDate(now)) return {
    windSpeed: weather.current.windSpeed, tempMin: weather.current.temperature, tempMax: weather.current.temperature,
    precipitationProbability: forecast?.precipitationProbability ?? null, precipitation: forecast?.precipitation ?? null,
    label: 'Τρέχουσες συνθήκες',
  }
  return forecast ? { ...forecast, label: `Πρόγνωση για ${date.toLocaleDateString('el-GR', { timeZone: 'Europe/Athens' })}` } : null
}

export function activityWeatherWarnings(activityType: string, day: NonNullable<ReturnType<typeof weatherForActivity>>) {
  const result: { type: 'warning' | 'info'; icon: 'wind' | 'rain' | 'water' | 'temperature'; title: string; message: string }[] = []
  if (['PEST_CONTROL', 'FERTILIZING'].includes(activityType)) {
    if (day.windSpeed > 5) result.push({ type: 'warning', icon: 'wind', title: 'Έλεγχος ανέμου', message: `${day.label}: ${Math.round(day.windSpeed * 3.6)} km/h. Επανελέγξτε τις συνθήκες και τις οδηγίες εφαρμογής με τον γεωπόνο πριν από εργασία.` })
    if (day.precipitationProbability != null && day.precipitationProbability >= 0.5) result.push({ type: 'warning', icon: 'rain', title: 'Πιθανή βροχή', message: `${day.label}: αυξημένη πιθανότητα βροχής. Ελέγξτε ξανά την πρόγνωση πριν από την εργασία.` })
  }
  if (activityType === 'WATERING') result.push({ type: 'info', icon: 'water', title: 'Έλεγχος πριν την άρδευση', message: `${day.label}${day.precipitation != null ? `: εκτιμώμενη βροχή ${Math.round(day.precipitation)} mm` : ''}. Ελέγξτε υγρασία εδάφους, αρδευτικό σύστημα και στάδιο ανάπτυξης. Ο καιρός μόνος του δεν καθορίζει ποσότητα ή ανάγκη ποτίσματος.` })
  if (day.tempMin <= 2 || day.tempMax >= 38) result.push({ type: 'warning', icon: 'temperature', title: 'Ακραία θερμοκρασία', message: `${day.label}: ${day.tempMin}–${day.tempMax}°C. Επανεξετάστε την ώρα εργασίας και ελέγξτε την κατάσταση των δέντρων.` })
  return result
}
