/**
 * Forecast-based spray-window planner for δάκος bait sprays.
 *
 * Knowing the risk is high is only half the decision — the farmer also needs to
 * know *when* it is safe and effective to spray. Bait sprays (e.g. spinosad)
 * fail or wash off under the wrong conditions, so we score the next few
 * forecast days on three field constraints:
 *
 *   - Wind   — drift control; spraying above ~5 m/s drifts, above ~8 is unsafe.
 *   - Rain   — rain within hours washes the bait off; high probability is bad.
 *   - Heat   — extreme heat degrades efficacy and bait evaporates; avoid >35°C.
 *
 * Output is a short, ordered list of dated windows the UI can render directly.
 */

export type SprayWindowRating = 'GOOD' | 'MARGINAL' | 'UNSUITABLE'

export interface SprayForecastDay {
  date: Date | string
  tempMax: number
  precipitation: number // mm expected that day
  precipitationProbability: number // 0..1
  windSpeed: number // m/s
}

export interface SprayWindowDay {
  date: string // ISO
  rating: SprayWindowRating
  windSpeed: number
  tempMax: number
  precipitationProbability: number
  reasons: string[] // Greek, human-readable
}

export interface SprayWindowPlan {
  /** Per-day ratings for the forecast horizon. */
  days: SprayWindowDay[]
  /** ISO date of the first GOOD day, if any. */
  bestDate: string | null
  /** One-line Greek summary for the panel header. */
  summary: string
}

// Thresholds (m/s for wind, °C for heat).
const WIND_GOOD = 5
const WIND_MAX = 8
const HEAT_GOOD = 32
const HEAT_MAX = 35
const RAIN_PROB_GOOD = 0.3
const RAIN_PROB_MAX = 0.6
const RAIN_MM_MAX = 2

function rateDay(day: SprayForecastDay): { rating: SprayWindowRating; reasons: string[] } {
  const reasons: string[] = []
  let marginal = false
  let unsuitable = false

  // Wind
  if (day.windSpeed > WIND_MAX) {
    unsuitable = true
    reasons.push(`ισχυρός άνεμος ${Math.round(day.windSpeed * 3.6)} km/h`)
  } else if (day.windSpeed > WIND_GOOD) {
    marginal = true
    reasons.push(`μέτριος άνεμος ${Math.round(day.windSpeed * 3.6)} km/h`)
  }

  // Rain
  if (day.precipitation >= RAIN_MM_MAX || day.precipitationProbability > RAIN_PROB_MAX) {
    unsuitable = true
    reasons.push(`πιθανή βροχή ${Math.round(day.precipitationProbability * 100)}%`)
  } else if (day.precipitationProbability > RAIN_PROB_GOOD) {
    marginal = true
    reasons.push(`αυξημένη πιθανότητα βροχής ${Math.round(day.precipitationProbability * 100)}%`)
  }

  // Heat
  if (day.tempMax > HEAT_MAX) {
    unsuitable = true
    reasons.push(`υψηλή θερμοκρασία ${Math.round(day.tempMax)}°C`)
  } else if (day.tempMax > HEAT_GOOD) {
    marginal = true
    reasons.push(`ζέστη ${Math.round(day.tempMax)}°C`)
  }

  const rating: SprayWindowRating = unsuitable
    ? 'UNSUITABLE'
    : marginal
      ? 'MARGINAL'
      : 'GOOD'
  if (rating === 'GOOD') reasons.push('ευνοϊκές συνθήκες ψεκασμού')
  return { rating, reasons }
}

const WEEKDAY = new Intl.DateTimeFormat('el-GR', { weekday: 'long', day: 'numeric', month: 'long' })

/**
 * Build a spray-window plan from upcoming forecast days. Pass only future days
 * (the weather lib already excludes today).
 */
export function computeSprayWindow(forecast: SprayForecastDay[]): SprayWindowPlan {
  const days: SprayWindowDay[] = forecast.slice(0, 5).map((d) => {
    const { rating, reasons } = rateDay(d)
    return {
      date: new Date(d.date).toISOString(),
      rating,
      windSpeed: d.windSpeed,
      tempMax: d.tempMax,
      precipitationProbability: d.precipitationProbability,
      reasons,
    }
  })

  const firstGood = days.find((d) => d.rating === 'GOOD')
  const firstMarginal = days.find((d) => d.rating === 'MARGINAL')
  const bestDate = firstGood?.date ?? null

  let summary: string
  if (!days.length) {
    summary = 'Δεν υπάρχει διαθέσιμη πρόγνωση για προγραμματισμό ψεκασμού.'
  } else if (firstGood) {
    summary = `Ευνοϊκό παράθυρο ψεκασμού: ${WEEKDAY.format(new Date(firstGood.date))}.`
  } else if (firstMarginal) {
    summary = `Χωρίς ιδανικό παράθυρο τις επόμενες ημέρες· οριακά κατάλληλη η ${WEEKDAY.format(new Date(firstMarginal.date))}.`
  } else {
    summary = 'Οι καιρικές συνθήκες δεν ευνοούν ψεκασμό τις επόμενες ημέρες.'
  }

  return { days, bestDate, summary }
}
