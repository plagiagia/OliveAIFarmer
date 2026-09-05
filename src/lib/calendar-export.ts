export interface CalendarTask {
  id: string
  title: string
  date: Date
  farmId: string
  farm: { name: string }
}

function escapeText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

/** RFC 5545 uses a 75-octet limit, not a character limit (Greek is multibyte). */
function foldLine(line: string) {
  const lines: string[] = []
  let current = ''
  let bytes = 0
  for (const char of line) {
    const length = new TextEncoder().encode(char).length
    if (bytes + length > 75) {
      lines.push(current)
      current = ' '
      bytes = 1
    }
    current += char
    bytes += length
  }
  lines.push(current)
  return lines.join('\r\n')
}

export function buildTaskCalendar(tasks: CalendarTask[], now = new Date()) {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OliveIQ//Grove tasks//EL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]
  for (const task of tasks) {
    // Farm work is scheduled by day. Render the stored instant in the farming timezone.
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Athens',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(task.date)
      .replace(/-/g, '')
    lines.push(
      'BEGIN:VEVENT',
      `UID:${escapeText(task.id)}@oliveiq.gr`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${date}`,
      `SUMMARY:${escapeText(task.title)}`,
      `DESCRIPTION:${escapeText(`${task.farm.name}\nΑνοίξτε το OliveIQ για ενημέρωση της εργασίας.`)}`,
      `URL:https://oliveiq.gr/dashboard/farms/${encodeURIComponent(task.farmId)}?tab=activities`,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(task.title)}`,
      'END:VALARM',
      'END:VEVENT'
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
