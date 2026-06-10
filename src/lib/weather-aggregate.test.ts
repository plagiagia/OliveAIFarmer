import { describe, expect, it } from 'vitest'
import { foldWeatherSample, type WeatherDayAggregate, type WeatherRecordInput } from './db'

const baseDay: WeatherDayAggregate = {
  tempHigh: 26,
  tempLow: 18,
  tempAvg: 20,
  sampleCount: 1,
  humidity: 60,
  rainfall: 0,
  windSpeed: 3,
  windGust: 5,
  windDirection: 180,
  pressure: 1012,
  clouds: 20,
  uvIndex: 4,
  icon: '01d',
  source: 'CRON_DAILY',
}

const sample = (over: Partial<WeatherRecordInput> = {}): WeatherRecordInput => ({
  farmId: 'farm-1',
  date: new Date(),
  tempHigh: 30,
  tempLow: 19,
  tempAvg: 28,
  humidity: 50,
  rainfall: 0,
  windSpeed: 5,
  condition: 'Αίθριος',
  ...over,
})

describe('foldWeatherSample', () => {
  it('keeps a running mean for tempAvg as samples accumulate', () => {
    // First day held one sample at 20°C; fold in a 28°C reading.
    const folded = foldWeatherSample(baseDay, sample({ tempAvg: 28 }))
    expect(folded.tempAvg).toBe(24) // (20 + 28) / 2
    expect(folded.sampleCount).toBe(2)

    // Fold a third reading at 30°C into the running mean.
    const next = foldWeatherSample(
      { ...baseDay, tempAvg: folded.tempAvg, sampleCount: folded.sampleCount },
      sample({ tempAvg: 30 })
    )
    expect(next.tempAvg).toBe(26) // (24*2 + 30) / 3
    expect(next.sampleCount).toBe(3)
  })

  it('widens the observed range from sample extremes and instantaneous temp', () => {
    const folded = foldWeatherSample(baseDay, sample({ tempHigh: 33, tempLow: 15, tempAvg: 34 }))
    expect(folded.tempHigh).toBe(34) // instantaneous reading exceeded forecast high
    expect(folded.tempLow).toBe(15)
  })

  it('averages humidity and wind speed', () => {
    const folded = foldWeatherSample(baseDay, sample({ humidity: 80, windSpeed: 7 }))
    expect(folded.humidity).toBe(70) // (60 + 80) / 2
    expect(folded.windSpeed).toBe(5) // (3 + 7) / 2
  })

  it('keeps the largest rainfall total and peak gust/UV', () => {
    const folded = foldWeatherSample(
      { ...baseDay, rainfall: 4, windGust: 8, uvIndex: 6 },
      sample({ rainfall: 1, windGust: 12, uvIndex: 3 })
    )
    expect(folded.rainfall).toBe(4) // existing total preserved, not summed
    expect(folded.windGust).toBe(12)
    expect(folded.uvIndex).toBe(6)
  })

  it('handles missing optional fields without producing NaN', () => {
    const sparse: WeatherDayAggregate = {
      tempHigh: 24,
      tempLow: 16,
      tempAvg: 20,
      sampleCount: 1,
      humidity: 55,
      rainfall: 0,
      windSpeed: 2,
    }
    const folded = foldWeatherSample(sparse, sample({ pressure: 1008, clouds: 40 }))
    expect(folded.pressure).toBe(1008) // seeded from first reading that has it
    expect(folded.clouds).toBe(40)
    expect(Number.isNaN(folded.tempAvg)).toBe(false)
  })
})
