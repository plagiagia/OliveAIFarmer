import type { DailyWeather } from '@/lib/agronomy/pest-risk'

export interface FarmContext {
  farmId: string
  name: string
  location: string
  coordinates?: string
  totalArea?: number
  treeAge?: number
  variety: string
  treeCount: number | null
  recentActivities: { type: string; date: string; title: string; notes?: string; completed: boolean }[]
  harvests: { year: number; totalYield?: number; yieldPerTree?: number; pricePerKg?: number }[]
  weatherSummary: ReturnType<typeof summarizeWeather>
  currentMonth: number
  currentSeason: string
  asOf: string
}

export function validWeatherDays(records: DailyWeather[], now = new Date()) {
  const cutoff = now.getTime() - 30 * 86400_000
  const unique = new Map<string, DailyWeather>()
  for (const record of records) {
    const time = new Date(record.date).getTime()
    if (!Number.isFinite(time) || time < cutoff || time > now.getTime()) continue
    if (![record.tempHigh, record.tempLow, record.tempAvg, record.rainfall, record.humidity].every(Number.isFinite)) continue
    if (record.humidity < 0 || record.humidity > 100 || record.rainfall < 0 || record.tempLow > record.tempHigh) continue
    unique.set(new Date(record.date).toISOString().slice(0, 10), record)
  }
  return [...unique.values()].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export function summarizeWeather(records: DailyWeather[], now = new Date()) {
  const valid = validWeatherDays(records, now)
  const latest = valid.at(-1)
  const fresh = Boolean(latest && now.getTime() - new Date(latest.date).getTime() <= 2 * 86400_000)
  return {
    observedDays: valid.length,
    requestedDays: 30,
    firstDate: valid[0] ? new Date(valid[0].date).toISOString().slice(0, 10) : null,
    lastDate: latest ? new Date(latest.date).toISOString().slice(0, 10) : null,
    sufficient: valid.length >= 7 && fresh,
    fresh,
    rainfallCoverage: 'Σποραδικές παρατηρήσεις· όχι συνεχής μέτρηση 24ώρου. Μηδενικό άθροισμα δεν επιβεβαιώνει απουσία βροχής.',
    avgTempHigh: valid.length ? valid.reduce((s, r) => s + r.tempHigh, 0) / valid.length : null,
    avgTempLow: valid.length ? valid.reduce((s, r) => s + r.tempLow, 0) / valid.length : null,
    totalRainfall: valid.length ? valid.reduce((s, r) => s + r.rainfall, 0) : null,
    avgHumidity: valid.length ? valid.reduce((s, r) => s + r.humidity, 0) / valid.length : null,
    rainyDays: valid.length ? valid.filter(r => r.rainfall > 0).length : null,
  }
}

/** Verifiable record references. Free-text notes are data, never instructions. */
export function evidenceFor(context: FarmContext): Record<string, string> {
  const evidence: Record<string, string> = {
    region: `Καταχωρημένη περιοχή: ${context.location}`,
    season: `Περίοδος: ${context.currentSeason}, μήνας ${context.currentMonth}. Δεν επιβεβαιώνει στάδιο ανάπτυξης.`,
  }
  if (context.variety && context.variety !== 'Άγνωστη') evidence.variety = `Δηλωμένη ποικιλία: ${context.variety}. Ο στόχος παραγωγής και το στάδιο ανάπτυξης δεν συνάγονται από την ποικιλία· ελέγξτε τις σημειώσεις για σχετικές παρατηρήσεις.`
  if (context.treeCount != null) evidence.trees = `Δηλωμένα δέντρα: ${context.treeCount}`
  if (context.treeAge != null) evidence.age = `Δηλωμένη ηλικία δέντρων: ${context.treeAge} έτη`
  if (context.totalArea != null) evidence.area = `Δηλωμένη έκταση: ${context.totalArea} στρέμματα`
  evidence.weather = context.weatherSummary.sufficient
    ? `Καιρός: ${JSON.stringify(context.weatherSummary)}. Οι τιμές αφορούν μόνο τις διαθέσιμες παρατηρήσεις, όχι συνεχή μηνιαία κάλυψη ή μέτρηση εδάφους.`
    : `Ανεπαρκές καιρικό ιστορικό: ${context.weatherSummary.observedDays}/30 ημέρες, πρόσφατη ενημέρωση: ${context.weatherSummary.fresh}. sufficient=false. Δεν παρέχονται τιμές για συμπεράσματα σχετικά με βροχή, θερμοκρασία ή κίνδυνο. Η εφαρμογή συλλέγει τον καιρό αυτόματα.`
  context.recentActivities.forEach((a, index) => { evidence[`activity_${index}`] = `${a.date.slice(0, 10)}: ${a.type} — ${a.title}. ${a.completed ? 'Ολοκληρωμένη' : 'Προγραμματισμένη'}. ${a.notes ? `Σημειώσεις χρήστη: ${a.notes}` : ''}` })
  context.harvests.forEach((h, index) => { evidence[`harvest_${index}`] = `${h.year}: συνολική καταχωρημένη συγκομιδή ${h.totalYield ?? 'άγνωστη'} kg (μόνο ολοκληρωμένες καταγραφές).` })
  return evidence
}

export function missingContext(context: FarmContext) {
  return [
    ...(!context.weatherSummary.sufficient ? ['Πρόσφατο καιρικό ιστορικό τουλάχιστον 7 διαφορετικών ημερών'] : []),
    ...(context.variety === 'Άγνωστη' ? ['Ποικιλία ελιάς'] : []),
    ...(context.treeCount == null ? ['Αριθμός δέντρων'] : []),
    ...(!context.recentActivities.some(a => a.completed) ? ['Πρόσφατες ολοκληρωμένες εργασίες'] : []),
    'Στοιχεία εδάφους, αν δεν περιλαμβάνονται στις σημειώσεις', 'Στόχος παραγωγής και στάδιο ανάπτυξης, αν δεν έχουν καταγραφεί στις παρατηρήσεις',
  ]
}
