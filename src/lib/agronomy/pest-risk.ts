/**
 * Pest & disease risk engine for olive groves.
 *
 * Computes simple, transparent risk scores from already-stored
 * weather history. Two pests covered (the dominant ones in Greece):
 *
 *  - Bactrocera oleae (δάκος) — degree-day model with base 12.5°C.
 *    Peak adult activity correlates with cumulative GDD and high
 *    summer temps, suppressed by extreme heat (>35°C kills eggs).
 *
 *  - Spilocaea oleagina / κυκλοκόνιο (peacock spot) — humid + mild
 *    spring/autumn periods. Risk rises with rainy days + moderate
 *    temperature, falls in dry hot summer.
 *
 * Output is plain numbers + a categorical level so the UI and AI
 * can both consume it without re-implementing the logic.
 */
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME'

export interface DailyWeather {
  date: Date | string
  tempHigh: number
  tempLow: number
  tempAvg: number
  humidity: number
  rainfall: number
}

export interface DakosRisk {
  pest: 'BACTROCERA_OLEAE'
  level: RiskLevel
  score: number               // 0..100
  cumulativeGDD: number       // accumulated degree-days (base 12.5°C)
  hotDaysOver35: number       // suppression days
  rationale: string
}

export interface PeacockSpotRisk {
  pest: 'SPILOCAEA_OLEAGINA'
  level: RiskLevel
  score: number
  rainyDays: number
  avgHumidity: number
  rationale: string
}

export interface PestRiskReport {
  generatedAt: string
  windowDays: number
  dakos: DakosRisk
  peacockSpot: PeacockSpotRisk
}

const DAKOS_BASE_TEMP = 12.5

function categorize(score: number): RiskLevel {
  if (score >= 80) return 'EXTREME'
  if (score >= 60) return 'HIGH'
  if (score >= 35) return 'MODERATE'
  return 'LOW'
}

function dakosFromWeather(records: DailyWeather[]): DakosRisk {
  let gdd = 0
  let hotDays = 0
  for (const r of records) {
    const dailyGdd = Math.max(0, r.tempAvg - DAKOS_BASE_TEMP)
    gdd += dailyGdd
    if (r.tempHigh > 35) hotDays++
  }
  // Heuristic: GDD of ~250 over the window correlates with active flight.
  const gddScore = Math.min(70, (gdd / 250) * 70)
  // Suppression for extreme heat days.
  const suppression = Math.min(25, hotDays * 4)
  // Bonus if humidity is moderate (45-75% supports adults).
  const avgHum = records.length
    ? records.reduce((s, r) => s + r.humidity, 0) / records.length
    : 0
  const humBonus = avgHum >= 45 && avgHum <= 75 ? 15 : 0
  const score = Math.max(0, Math.min(100, Math.round(gddScore + humBonus - suppression)))
  return {
    pest: 'BACTROCERA_OLEAE',
    level: categorize(score),
    score,
    cumulativeGDD: Math.round(gdd),
    hotDaysOver35: hotDays,
    rationale: `Σωρευτικοί βαθμοημέρες (βάση 12.5°C) ${Math.round(gdd)}, ημέρες >35°C: ${hotDays}, μέση υγρασία ${avgHum.toFixed(0)}%.`,
  }
}

function peacockSpotFromWeather(records: DailyWeather[]): PeacockSpotRisk {
  if (!records.length) {
    return {
      pest: 'SPILOCAEA_OLEAGINA',
      level: 'LOW',
      score: 0,
      rainyDays: 0,
      avgHumidity: 0,
      rationale: 'Δεν υπάρχουν επαρκή καιρικά δεδομένα.',
    }
  }
  const rainyDays = records.filter((r) => r.rainfall >= 1).length
  const avgHumidity = records.reduce((s, r) => s + r.humidity, 0) / records.length
  const avgTemp = records.reduce((s, r) => s + r.tempAvg, 0) / records.length

  // Optimal infection band: 15-22°C with high humidity / wet leaves.
  const tempInBand = avgTemp >= 12 && avgTemp <= 24 ? 1 : 0.3
  const rainScore = Math.min(60, rainyDays * 6) * tempInBand
  const humScore = avgHumidity > 80 ? 25 : avgHumidity > 65 ? 15 : 5
  // Hot, dry summer suppresses infections.
  const heatPenalty = avgTemp > 28 ? 15 : 0
  const score = Math.max(0, Math.min(100, Math.round(rainScore + humScore - heatPenalty)))
  return {
    pest: 'SPILOCAEA_OLEAGINA',
    level: categorize(score),
    score,
    rainyDays,
    avgHumidity: Math.round(avgHumidity),
    rationale: `Ημέρες με βροχή ${rainyDays}, μέση υγρασία ${avgHumidity.toFixed(0)}%, μέση θερμοκρασία ${avgTemp.toFixed(1)}°C.`,
  }
}

export function computePestRisk(records: DailyWeather[]): PestRiskReport {
  return {
    generatedAt: new Date().toISOString(),
    windowDays: records.length,
    dakos: dakosFromWeather(records),
    peacockSpot: peacockSpotFromWeather(records),
  }
}
