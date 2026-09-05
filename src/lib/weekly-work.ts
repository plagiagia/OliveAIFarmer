import { addDays, startOfDay } from 'date-fns'

export interface ScheduledWork {
  id: string
  title: string
  date: Date | string
  completed: boolean
  farmId: string
  farmName?: string
}

/** Calendar days in the user's timezone, including today and the next six days. */
export function getWeeklyWork<T extends ScheduledWork>(activities: T[], now = new Date()) {
  const today = startOfDay(now)
  const end = addDays(today, 7)
  const pending = activities
    .filter((a) => !a.completed && Number.isFinite(new Date(a.date).getTime()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return {
    overdue: pending.filter((a) => new Date(a.date) < today),
    upcoming: pending.filter((a) => new Date(a.date) >= today && new Date(a.date) < end),
    completed: activities.filter(
      (a) =>
        a.completed &&
        new Date(a.date) >= addDays(today, -6) &&
        new Date(a.date) < addDays(today, 1)
    ).length,
  }
}
