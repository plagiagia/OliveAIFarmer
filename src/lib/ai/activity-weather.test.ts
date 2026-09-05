import { describe, expect, it } from 'vitest'
import { activityWeatherWarnings, weatherForActivity } from './activity-weather'
import type { WeatherData } from '@/types/weather'

const now = new Date('2026-09-05T12:00:00Z')
const weather = { current: { windSpeed: 20, temperature: 40 }, forecast: [{ date: new Date('2026-09-06'), windSpeed: 1, tempMin: 18, tempMax: 25, precipitationProbability: 0.7, precipitation: 4 }] } as WeatherData
describe('selected-date weather advice', () => {
  it('uses selected-day forecast, not current heat or wind', () => {
    const day = weatherForActivity(weather, new Date('2026-09-06'), now)!
    expect(day.windSpeed).toBe(1)
    expect(activityWeatherWarnings('PEST_CONTROL', day).map(x => x.icon)).toEqual(['rain'])
  })
  it('recognizes probabilities on the 0–1 scale', () => {
    const day = weatherForActivity(weather, new Date('2026-09-06'), now)!
    expect(activityWeatherWarnings('PEST_CONTROL', { ...day, precipitationProbability: 0.5 })).toHaveLength(1)
    expect(activityWeatherWarnings('PEST_CONTROL', { ...day, precipitationProbability: 0.49 })).toHaveLength(0)
  })
  it('does not invent coverage for past or distant future dates', () => {
    expect(weatherForActivity(weather, new Date('2026-09-04'), now)).toBeNull()
    expect(weatherForActivity(weather, new Date('2026-09-20'), now)).toBeNull()
  })
  it('requests soil observations instead of a fixed watering quantity', () => {
    const result = activityWeatherWarnings('WATERING', weatherForActivity(weather, new Date('2026-09-06'), now)!)
    expect(result[0].message).toContain('υγρασία εδάφους')
    expect(result[0].message).not.toContain('λίτρα')
  })
})
