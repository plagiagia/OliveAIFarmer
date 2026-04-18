import { describe, expect, it } from 'vitest'
import { computePestRisk, type DailyWeather } from './pest-risk'

function mkDay(over: Partial<DailyWeather> = {}): DailyWeather {
  return {
    date: new Date(),
    tempHigh: 20,
    tempLow: 12,
    tempAvg: 16,
    humidity: 60,
    rainfall: 0,
    ...over,
  }
}

describe('computePestRisk', () => {
  it('returns LOW δάκος risk on cool/dry weeks', () => {
    const records = Array.from({ length: 30 }, () =>
      mkDay({ tempHigh: 14, tempLow: 6, tempAvg: 10, humidity: 40, rainfall: 0 })
    )
    const report = computePestRisk(records)
    expect(report.dakos.level).toBe('LOW')
    expect(report.dakos.cumulativeGDD).toBe(0)
  })

  it('returns elevated δάκος risk on warm humid weeks', () => {
    const records = Array.from({ length: 30 }, () =>
      mkDay({ tempHigh: 30, tempLow: 18, tempAvg: 24, humidity: 65, rainfall: 0 })
    )
    const report = computePestRisk(records)
    expect(report.dakos.cumulativeGDD).toBeGreaterThan(300)
    expect(['MODERATE', 'HIGH', 'EXTREME']).toContain(report.dakos.level)
  })

  it('suppresses δάκος score under extreme heat', () => {
    const hot = Array.from({ length: 30 }, () =>
      mkDay({ tempHigh: 40, tempLow: 22, tempAvg: 30, humidity: 30, rainfall: 0 })
    )
    const moderate = Array.from({ length: 30 }, () =>
      mkDay({ tempHigh: 28, tempLow: 18, tempAvg: 23, humidity: 60, rainfall: 0 })
    )
    expect(computePestRisk(hot).dakos.score).toBeLessThan(
      computePestRisk(moderate).dakos.score
    )
  })

  it('flags peacock-spot risk on wet humid mild weeks', () => {
    const records = Array.from({ length: 30 }, (_, i) =>
      mkDay({ tempHigh: 20, tempLow: 12, tempAvg: 16, humidity: 90, rainfall: i % 2 ? 5 : 0 })
    )
    const report = computePestRisk(records)
    expect(['MODERATE', 'HIGH', 'EXTREME']).toContain(report.peacockSpot.level)
  })

  it('returns LOW peacock-spot risk in hot dry summer', () => {
    const records = Array.from({ length: 30 }, () =>
      mkDay({ tempHigh: 35, tempLow: 22, tempAvg: 30, humidity: 30, rainfall: 0 })
    )
    expect(computePestRisk(records).peacockSpot.level).toBe('LOW')
  })

  it('handles empty input gracefully', () => {
    const report = computePestRisk([])
    expect(report.dakos.score).toBe(0)
    expect(report.peacockSpot.score).toBe(0)
    expect(report.windowDays).toBe(0)
  })
})
