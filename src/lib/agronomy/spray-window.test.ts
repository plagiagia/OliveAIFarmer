import { describe, expect, it } from 'vitest'
import { computeSprayWindow, type SprayForecastDay } from './spray-window'

const mkDay = (offset: number, over: Partial<SprayForecastDay> = {}): SprayForecastDay => ({
  date: new Date(Date.now() + offset * 24 * 60 * 60 * 1000),
  tempMax: 28,
  precipitation: 0,
  precipitationProbability: 0.1,
  windSpeed: 3,
  ...over,
})

describe('computeSprayWindow', () => {
  it('returns empty plan for no forecast', () => {
    const plan = computeSprayWindow([])
    expect(plan.days).toHaveLength(0)
    expect(plan.bestDate).toBeNull()
  })

  it('rates calm dry mild days as GOOD', () => {
    const plan = computeSprayWindow([mkDay(1)])
    expect(plan.days[0].rating).toBe('GOOD')
    expect(plan.bestDate).toBe(plan.days[0].date)
  })

  it('marks strong wind as UNSUITABLE', () => {
    const plan = computeSprayWindow([mkDay(1, { windSpeed: 10 })])
    expect(plan.days[0].rating).toBe('UNSUITABLE')
    expect(plan.bestDate).toBeNull()
  })

  it('marks high rain probability as UNSUITABLE', () => {
    const plan = computeSprayWindow([mkDay(1, { precipitationProbability: 0.8 })])
    expect(plan.days[0].rating).toBe('UNSUITABLE')
  })

  it('marks extreme heat as UNSUITABLE', () => {
    const plan = computeSprayWindow([mkDay(1, { tempMax: 38 })])
    expect(plan.days[0].rating).toBe('UNSUITABLE')
  })

  it('marks moderate wind as MARGINAL', () => {
    const plan = computeSprayWindow([mkDay(1, { windSpeed: 6 })])
    expect(plan.days[0].rating).toBe('MARGINAL')
  })

  it('picks the first GOOD day as best across a mixed forecast', () => {
    const plan = computeSprayWindow([
      mkDay(1, { windSpeed: 10 }), // unsuitable
      mkDay(2, { tempMax: 33 }), // marginal
      mkDay(3), // good
    ])
    expect(plan.bestDate).toBe(plan.days[2].date)
  })

  it('limits the horizon to 5 days', () => {
    const plan = computeSprayWindow(Array.from({ length: 7 }, (_, i) => mkDay(i + 1)))
    expect(plan.days).toHaveLength(5)
  })
})
