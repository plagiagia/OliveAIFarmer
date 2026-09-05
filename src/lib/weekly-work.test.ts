import { describe, expect, it } from 'vitest'
import { getWeeklyWork } from './weekly-work'

describe('weekly work', () => {
  it('includes today, excludes day eight and completed tasks, and puts overdue work first', () => {
    const task = (id: string, date: string, completed = false) => ({
      id,
      date,
      completed,
      title: id,
      farmId: 'grove',
    })
    const result = getWeeklyWork(
      [
        task('later', '2026-09-11T12:00:00'),
        task('yesterday', '2026-09-04T12:00:00'),
        task('today', '2026-09-05T00:01:00'),
        task('outside', '2026-09-12T00:00:00'),
        task('done', '2026-09-05T10:00:00', true),
        task('invalid', 'invalid'),
      ],
      new Date('2026-09-05T18:00:00')
    )
    expect(result.overdue.map((a) => a.id)).toEqual(['yesterday'])
    expect(result.upcoming.map((a) => a.id)).toEqual(['today', 'later'])
    expect(result.completed).toBe(1)
  })
  it('does not count old or future scheduled completions as this week’s work', () => {
    const result = getWeeklyWork(
      ['2026-08-01', '2026-10-01'].map((date) => ({
        id: date,
        date,
        completed: true,
        title: '',
        farmId: 'grove',
      })),
      new Date('2026-09-05T12:00:00')
    )
    expect(result.completed).toBe(0)
  })
})
