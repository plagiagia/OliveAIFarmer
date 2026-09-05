import { describe, expect, it } from 'vitest'
import { summarizeWeather, evidenceFor, type FarmContext } from './context'
import { computePestRisk, type DailyWeather } from '@/lib/agronomy/pest-risk'
import { ruleBasedInsights } from './fallback'

const now = new Date('2026-09-05T12:00:00Z')
const day = (daysAgo: number): DailyWeather => ({ date: new Date(now.getTime() - daysAgo * 86400_000), tempHigh: 30, tempLow: 18, tempAvg: 24, humidity: 65, rainfall: 2 })
export const emptyContext: FarmContext = { farmId: 'farm', name: 'Ελαιώνας', location: 'Μεσσηνία', variety: 'Άγνωστη', treeCount: null, recentActivities: [], harvests: [], weatherSummary: summarizeWeather([], now), currentMonth: 9, currentSeason: 'Φθινόπωρο', asOf: '2026-09-05' }

describe('farm evidence quality', () => {
  it('represents missing measurements as unknown, never zero rain or temperature', () => {
    expect(emptyContext.weatherSummary).toMatchObject({ observedDays: 0, sufficient: false, avgTempHigh: null, totalRainfall: null })
    expect(evidenceFor(emptyContext)).not.toHaveProperty('trees')
    expect(evidenceFor(emptyContext)).not.toHaveProperty('variety')
  })
  it('deduplicates days and excludes invalid, future and old observations', () => {
    const records = [day(0), day(0), day(-1), day(31), { ...day(2), humidity: NaN }, { ...day(3), rainfall: -1 }]
    expect(summarizeWeather(records, now)).toMatchObject({ observedDays: 1, totalRainfall: 2, sufficient: false })
    expect(computePestRisk(records, now).dakos.level).toBe('UNKNOWN')
  })
  it('does not treat seven stale days as a current risk estimate', () => {
    const records = Array.from({ length: 7 }, (_, i) => day(i + 5))
    expect(summarizeWeather(records, now)).toMatchObject({ observedDays: 7, sufficient: false, fresh: false })
    expect(computePestRisk(records, now).dakos.level).toBe('UNKNOWN')
  })
  it('keeps partial coverage explicit and distinguishes planned work from completed work', () => {
    const weather = summarizeWeather(Array.from({ length: 7 }, (_, i) => day(i)), now)
    expect(weather).toMatchObject({ observedDays: 7, requestedDays: 30, sufficient: true, totalRainfall: 14 })
    const evidence = evidenceFor({ ...emptyContext, recentActivities: [{ type: 'Επιθεώρηση', title: 'Έλεγχος', date: '2026-09-06', completed: false }] })
    expect(evidence.activity_0).toContain('Προγραμματισμένη')
  })
  it('fallback only asks for observations and never invents an urgent risk', () => {
    const fallback = ruleBasedInsights(emptyContext)
    expect(fallback.every(i => i.urgency === 'LOW')).toBe(true)
    expect(fallback.every(i => i.evidenceIds.every(id => id in evidenceFor(emptyContext)))).toBe(true)
    expect(JSON.stringify(fallback)).not.toMatch(/λίτρα|σκευάσμα|δοσολογ/)
  })
})
