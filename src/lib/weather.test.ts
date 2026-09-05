import { describe, expect, it, vi } from 'vitest'
vi.mock('@/env', () => ({ env: {} }))
import { assessDiseaseRisks, generateAlerts, generateIrrigationRecommendation } from './weather'
import type { WeatherData } from '@/types/weather'

const weather = { current: { temperature: 40, humidity: 20, windSpeed: 1 }, forecast: [{ date: new Date('2026-09-06'), tempMin: 25, tempMax: 40, precipitation: 0 }] } as WeatherData
describe('weather decision boundaries', () => {
  it('does not prescribe irrigation amount or schedule without soil and system data', () => {
    const result = generateIrrigationRecommendation(weather)
    expect(result.shouldIrrigate).toBeNull()
    expect(result.waterAmount).toBeUndefined()
    expect(result.nextIrrigationDate).toBeUndefined()
    expect(result.reason).toContain('Ελέγξτε υγρασία εδάφους')
    expect(generateAlerts(weather).every(a => !a.recommendation.includes('επιπλέον πότισμα'))).toBe(true)
  })
  it('does not convert missing history into disease probabilities', () => {
    expect(assessDiseaseRisks([])).toEqual([])
  })
  it('uses the shared history index and labels it as a heuristic', () => {
    const now = new Date('2026-09-05T12:00:00Z')
    const history = Array.from({ length: 14 }, (_, i) => ({ date: new Date(now.getTime() - i * 86400_000), tempHigh: 30, tempLow: 18, tempAvg: 24, humidity: 65, rainfall: 0 }))
    const risks = assessDiseaseRisks(history, now)
    expect(risks[0].greekName).toBe('Δάκος της Ελιάς')
    expect(risks[0].prevention).toContain('όχι πιθανότητα προσβολής')
    expect(risks[0]).not.toHaveProperty('riskPercentage')
  })
})
