import { describe, expect, it } from 'vitest'
import { buildTaskCalendar } from './calendar-export'

describe('calendar export', () => {
  it('preserves the Greek farming day across midnight UTC and includes reminders and deep links', () => {
    const output = buildTaskCalendar(
      [
        {
          id: 'task-1',
          title: 'Έλεγχος',
          date: new Date('2026-09-04T22:00:00Z'),
          farmId: 'grove',
          farm: { name: 'Ελαιώνας' },
        },
      ],
      new Date('2026-09-01T12:00:00Z')
    )
    expect(output).toContain('DTSTART;VALUE=DATE:20260905\r\n')
    expect(output).toContain('UID:task-1@oliveiq.gr')
    expect(output).toContain('TRIGGER:-P1D')
    expect(output.replace(/\r\n /g, '')).toContain('/dashboard/farms/grove?tab=activities')
  })
  it('escapes embedded event delimiters and folds Greek text by UTF-8 bytes', () => {
    const title = 'Επιθεώρηση, νότιος; ελαιώνας '.repeat(10) + '\r\nEND:VEVENT'
    const output = buildTaskCalendar([
      { id: 'task', title, date: new Date(), farmId: 'grove', farm: { name: 'Κτήμα' } },
    ])
    expect(output.split('\r\n').filter((line) => line === 'END:VEVENT')).toHaveLength(1)
    expect(output.replace(/\r\n /g, '')).toContain('\\nEND:VEVENT')
    expect(output.split('\r\n').every((line) => new TextEncoder().encode(line).length <= 75)).toBe(
      true
    )
  })
})
