import { describe, expect, it } from 'vitest'
import { aggregateWeatherObservations } from './weather-aggregation'

const observation = (overrides: Partial<Parameters<typeof aggregateWeatherObservations>[0][number]> = {}) => ({
  observedAt: new Date('2026-08-30T12:00:00.000Z'),
  temperature: 25,
  humidity: 60,
  rainfall: 0,
  windSpeed: 3,
  windGust: null,
  windDirection: 180,
  pressure: 1012,
  clouds: 20,
  condition: 'clear sky',
  icon: '01d',
  source: 'CRON_INTRADAY',
  ...overrides
})

describe('aggregateWeatherObservations', () => {
  it('calculates daily values from multiple samples', () => {
    const result = aggregateWeatherObservations([
      observation({
        observedAt: new Date('2026-08-30T06:00:00.000Z'),
        temperature: 20,
        humidity: 70,
        rainfall: 1.2,
        windSpeed: 2,
        windGust: 5,
        pressure: 1010,
        clouds: 40,
        condition: 'few clouds',
        icon: '02d'
      }),
      observation({
        observedAt: new Date('2026-08-30T12:00:00.000Z'),
        temperature: 30,
        humidity: 50,
        rainfall: 0.8,
        windSpeed: 4,
        windGust: 8,
        pressure: 1014,
        clouds: 10
      }),
      observation({
        observedAt: new Date('2026-08-30T18:00:00.000Z'),
        temperature: 24,
        humidity: 60,
        windSpeed: 3,
        pressure: null,
        clouds: null
      })
    ])

    expect(result.tempHigh).toBe(30)
    expect(result.tempLow).toBe(20)
    expect(result.tempAvg).toBeCloseTo(24.67, 2)
    expect(result.humidity).toBe(60)
    expect(result.rainfall).toBeCloseTo(2)
    expect(result.windSpeed).toBeCloseTo(3)
    expect(result.windGust).toBe(8)
    expect(result.pressure).toBe(1012)
    expect(result.clouds).toBe(25)
    expect(result.condition).toBe('clear sky')
    expect(result.source).toBe('CRON_DAILY')
  })

  it('rejects an empty observation set', () => {
    expect(() => aggregateWeatherObservations([])).toThrow(
      'Cannot aggregate an empty observation set'
    )
  })
})
