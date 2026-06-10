/**
 * Trap-based δάκος pressure.
 *
 * Olive fruit fly spray decisions are driven first by *trap catches*, not by
 * weather alone. The standard field metric is flies/trap/day (συλλήψεις ανά
 * παγίδα ανά ημέρα). We turn a farmer's logged trap inspections into that
 * metric and map it to an action level using the commonly used economic
 * threshold of ~5 flies/trap/day for oil olives (lower pressures still warrant
 * closer monitoring).
 *
 * This is deliberately transparent: same categorical levels as the weather
 * model so the UI and alert pipeline can blend the two without re-implementing.
 */
import type { RiskLevel } from '@/lib/agronomy/pest-risk'

export interface TrapReadingInput {
  date: Date | string
  trapCount: number
  totalCatch: number
  femaleCatch?: number | null
  daysSincePrev?: number | null
}

export interface TrapPressure {
  level: RiskLevel
  /** Flies per trap per day from the most recent inspection. */
  fliesPerTrapPerDay: number | null
  /** True once the economic threshold (~5 flies/trap/day) is reached. */
  thresholdExceeded: boolean
  /** % females in the latest catch, when reported (drives oviposition risk). */
  femaleShare: number | null
  latestDate: string | null
  /** 7-day trend vs the previous inspection: rising / falling / steady / null. */
  trend: 'rising' | 'falling' | 'steady' | null
  rationale: string
}

/** flies/trap/day economic threshold for oil-olive groves. */
export const DAKOS_TRAP_THRESHOLD = 5

function levelFromRate(rate: number): RiskLevel {
  if (rate >= 2 * DAKOS_TRAP_THRESHOLD) return 'EXTREME' // ≥10
  if (rate >= DAKOS_TRAP_THRESHOLD) return 'HIGH' // ≥5
  if (rate >= 1) return 'MODERATE'
  return 'LOW'
}

/**
 * Flies/trap/day for one reading. Uses the explicit inspection interval when
 * given, otherwise the gap to the previous reading, otherwise assumes 7 days
 * (a typical weekly check) so a lone reading still yields a usable rate.
 */
function ratePerTrapDay(reading: TrapReadingInput, prevDate: Date | null): number | null {
  const traps = reading.trapCount > 0 ? reading.trapCount : 1
  let days = reading.daysSincePrev ?? null
  if ((days == null || days <= 0) && prevDate) {
    const ms = new Date(reading.date).getTime() - prevDate.getTime()
    days = Math.round(ms / (24 * 60 * 60 * 1000))
  }
  if (days == null || days <= 0) days = 7
  return reading.totalCatch / traps / days
}

/**
 * Evaluate trap pressure from a farm's readings (any order). Returns the latest
 * reading's flies/trap/day, its level, and the short-term trend.
 */
export function computeTrapPressure(readings: TrapReadingInput[]): TrapPressure {
  if (!readings.length) {
    return {
      level: 'LOW',
      fliesPerTrapPerDay: null,
      thresholdExceeded: false,
      femaleShare: null,
      latestDate: null,
      trend: null,
      rationale: 'Δεν έχουν καταγραφεί συλλήψεις παγίδων.',
    }
  }

  const sorted = [...readings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const latest = sorted[sorted.length - 1]
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null
  const prevDate = prev ? new Date(prev.date) : null

  const rate = ratePerTrapDay(latest, prevDate)
  const level = rate == null ? 'LOW' : levelFromRate(rate)

  const femaleShare =
    latest.femaleCatch != null && latest.totalCatch > 0
      ? Math.round((latest.femaleCatch / latest.totalCatch) * 100)
      : null

  let trend: TrapPressure['trend'] = null
  if (prev) {
    const prevRate = ratePerTrapDay(prev, null)
    if (rate != null && prevRate != null) {
      const delta = rate - prevRate
      trend = Math.abs(delta) < 0.5 ? 'steady' : delta > 0 ? 'rising' : 'falling'
    }
  }

  const rounded = rate == null ? null : Math.round(rate * 10) / 10
  const parts: string[] = []
  if (rounded != null) parts.push(`${rounded} συλλήψεις/παγίδα/ημέρα`)
  if (femaleShare != null) parts.push(`θηλυκά ${femaleShare}%`)
  if (trend === 'rising') parts.push('τάση ανοδική')
  else if (trend === 'falling') parts.push('τάση καθοδική')

  return {
    level,
    fliesPerTrapPerDay: rounded,
    thresholdExceeded: rate != null && rate >= DAKOS_TRAP_THRESHOLD,
    femaleShare,
    latestDate: new Date(latest.date).toISOString(),
    trend,
    rationale: parts.length
      ? `${parts.join(' · ')} (όριο επέμβασης ${DAKOS_TRAP_THRESHOLD}/παγίδα/ημέρα).`
      : 'Καταγράφηκε έλεγχος παγίδων.',
  }
}

/** The more severe of two risk levels — used to blend weather + trap evidence. */
const LEVEL_RANK: Record<RiskLevel, number> = {
  LOW: 0,
  MODERATE: 1,
  HIGH: 2,
  EXTREME: 3,
}

export function maxLevel(a: RiskLevel, b: RiskLevel): RiskLevel {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b
}
