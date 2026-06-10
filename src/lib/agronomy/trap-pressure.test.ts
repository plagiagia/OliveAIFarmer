import { describe, expect, it } from 'vitest'
import { computeTrapPressure, maxLevel, DAKOS_TRAP_THRESHOLD } from './trap-pressure'

const day = (offsetDays: number) =>
  new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000)

describe('computeTrapPressure', () => {
  it('returns LOW with no readings', () => {
    const p = computeTrapPressure([])
    expect(p.level).toBe('LOW')
    expect(p.fliesPerTrapPerDay).toBeNull()
    expect(p.thresholdExceeded).toBe(false)
  })

  it('computes flies/trap/day from explicit interval', () => {
    const p = computeTrapPressure([
      { date: day(0), trapCount: 2, totalCatch: 20, daysSincePrev: 5 },
    ])
    // 20 / 2 traps / 5 days = 2.0
    expect(p.fliesPerTrapPerDay).toBe(2)
    expect(p.level).toBe('MODERATE')
  })

  it('flags HIGH when at the economic threshold', () => {
    const p = computeTrapPressure([
      { date: day(0), trapCount: 1, totalCatch: DAKOS_TRAP_THRESHOLD * 7, daysSincePrev: 7 },
    ])
    expect(p.fliesPerTrapPerDay).toBe(DAKOS_TRAP_THRESHOLD)
    expect(p.level).toBe('HIGH')
    expect(p.thresholdExceeded).toBe(true)
  })

  it('flags EXTREME at twice the threshold', () => {
    const p = computeTrapPressure([
      { date: day(0), trapCount: 1, totalCatch: 70, daysSincePrev: 7 },
    ])
    expect(p.level).toBe('EXTREME')
  })

  it('derives interval from previous reading when not given', () => {
    const p = computeTrapPressure([
      { date: day(10), trapCount: 1, totalCatch: 0 },
      { date: day(0), trapCount: 1, totalCatch: 50 },
    ])
    // latest: 50 / 1 / 10 days = 5 → HIGH
    expect(p.fliesPerTrapPerDay).toBe(5)
    expect(p.level).toBe('HIGH')
  })

  it('reports rising trend and female share', () => {
    const p = computeTrapPressure([
      { date: day(7), trapCount: 1, totalCatch: 7, daysSincePrev: 7 }, // 1/day
      { date: day(0), trapCount: 1, totalCatch: 42, femaleCatch: 21, daysSincePrev: 7 }, // 6/day
    ])
    expect(p.trend).toBe('rising')
    expect(p.femaleShare).toBe(50)
  })
})

describe('maxLevel', () => {
  it('returns the more severe level', () => {
    expect(maxLevel('LOW', 'HIGH')).toBe('HIGH')
    expect(maxLevel('EXTREME', 'MODERATE')).toBe('EXTREME')
    expect(maxLevel('MODERATE', 'MODERATE')).toBe('MODERATE')
  })
})
