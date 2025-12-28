'use client'

import { ACTIVITY_TYPE_COLORS, ACTIVITY_TYPE_ICONS, ActivityType } from '@/types/activity'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns'
import { el } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useState, useMemo } from 'react'

interface CalendarActivity {
  id: string
  type: ActivityType
  title: string
  date: Date | string
  completed: boolean
  farmId: string
  farmName?: string
}

interface FarmCalendarProps {
  activities: CalendarActivity[]
  onDateSelect: (date: Date) => void
  onActivityClick?: (activity: CalendarActivity) => void
}

export default function FarmCalendar({ activities, onDateSelect, onActivityClick }: FarmCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Get all days to display in the calendar grid (including days from prev/next month to fill weeks)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Start week on Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  // Group activities by date
  const activitiesByDate = useMemo(() => {
    const grouped = new Map<string, CalendarActivity[]>()
    activities.forEach(activity => {
      const dateKey = format(new Date(activity.date), 'yyyy-MM-dd')
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(activity)
    })
    return grouped
  }, [activities])

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const goToToday = () => setCurrentMonth(new Date())

  const weekDays = ['ΔΕΥ', 'ΤΡΙ', 'ΤΕΤ', 'ΠΕΜ', 'ΠΑΡ', 'ΣΑΒ', 'ΚΥΡ']

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {format(currentMonth, 'MMMM yyyy', { locale: el })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm text-olive-700 hover:bg-olive-50 rounded-lg transition-colors"
          >
            Σήμερα
          </button>
          <div className="flex items-center border border-gray-200 rounded-lg">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-50 rounded-l-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-50 rounded-r-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Button */}
      <button
        onClick={() => onDateSelect(new Date())}
        className="w-full mb-4 bg-gradient-to-r from-olive-600 to-olive-500 hover:from-olive-700 hover:to-olive-600 text-white py-2.5 px-4 rounded-xl font-medium transition-all duration-200 hover:shadow-md flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Γρήγορη Προσθήκη
      </button>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-2 ${
              index >= 5 ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayActivities = activitiesByDate.get(dateKey) || []
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isDayToday = isToday(day)
          const isWeekend = day.getDay() === 0 || day.getDay() === 6

          return (
            <div
              key={dateKey}
              onClick={() => onDateSelect(day)}
              className={`
                relative min-h-[70px] p-1.5 rounded-lg cursor-pointer transition-all duration-200
                ${isCurrentMonth ? 'bg-white hover:bg-olive-50' : 'bg-gray-50'}
                ${isDayToday ? 'ring-2 ring-olive-500 ring-offset-1' : ''}
                ${!isCurrentMonth ? 'opacity-40' : ''}
                hover:shadow-sm
              `}
            >
              {/* Day Number */}
              <div className={`
                text-sm font-medium mb-1
                ${isDayToday ? 'text-olive-700' : isWeekend && isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
              `}>
                {format(day, 'd')}
              </div>

              {/* Activity Indicators */}
              <div className="space-y-0.5">
                {dayActivities.slice(0, 3).map((activity) => (
                  <div
                    key={activity.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onActivityClick?.(activity)
                    }}
                    className={`
                      text-xs px-1.5 py-0.5 rounded truncate cursor-pointer
                      ${ACTIVITY_TYPE_COLORS[activity.type]}
                      ${activity.completed ? 'opacity-60 line-through' : ''}
                      hover:opacity-80 transition-opacity
                    `}
                    title={`${activity.title}${activity.farmName ? ` - ${activity.farmName}` : ''}`}
                  >
                    <span className="mr-0.5">{ACTIVITY_TYPE_ICONS[activity.type]}</span>
                    {activity.farmName || activity.title}
                  </div>
                ))}
                {dayActivities.length > 3 && (
                  <div className="text-xs text-gray-500 px-1.5">
                    +{dayActivities.length - 3} ακόμα
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-gray-500">Τύποι:</span>
          {Object.entries(ACTIVITY_TYPE_ICONS).slice(0, 5).map(([type, icon]) => (
            <span
              key={type}
              className={`px-2 py-0.5 rounded ${ACTIVITY_TYPE_COLORS[type as ActivityType]}`}
            >
              {icon}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
