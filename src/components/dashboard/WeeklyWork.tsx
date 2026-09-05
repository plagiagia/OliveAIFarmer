'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { getWeeklyWork, type ScheduledWork } from '@/lib/weekly-work'
import { trackProductEvent } from '@/lib/product-events'

interface Props {
  activities: ScheduledWork[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onAdd: () => void
}

export default function WeeklyWork({ activities, loading, error, onRetry, onAdd }: Props) {
  const [now, setNow] = useState<Date | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    if (!loading && !error)
      trackProductEvent('WeeklyWorkViewed', { hasTasks: activities.length > 0 })
  }, [loading, error, activities.length])

  const work = getWeeklyWork(activities, now ?? new Date(0))
  const visible = [...work.overdue, ...work.upcoming].slice(0, 5)
  const downloadCalendar = async () => {
    setDownloading(true)
    setDownloadError(null)
    try {
      const response = await fetch('/api/activities/calendar')
      if (!response.ok) throw new Error()
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = 'oliveiq-ergasies.ics'
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      trackProductEvent('CalendarDownloaded')
    } catch {
      setDownloadError('Δεν ήταν δυνατή η λήψη. Δοκιμάστε ξανά.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section
      aria-labelledby="weekly-work-title"
      className="mb-8 overflow-hidden rounded-2xl border border-olive-200 bg-white"
    >
      <div className="grid lg:grid-cols-[1fr_1.6fr]">
        <div className="bg-olive-50 p-5 sm:p-7">
          <p className="text-sm font-semibold text-olive-700">ΤΟ ΠΡΟΓΡΑΜΜΑ ΣΑΣ</p>
          <h2
            id="weekly-work-title"
            className="mt-2 text-2xl font-bold tracking-tight text-olive-900"
          >
            Η εβδομάδα στον ελαιώνα σας
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Δείτε τι εκκρεμεί και οργανώστε την επόμενη επίσκεψη. Οι εργασίες προέρχονται από το
            δικό σας ημερολόγιο.
          </p>
          <button
            onClick={onAdd}
            className="mt-5 min-h-[44px] rounded-xl bg-olive-700 px-5 py-3 font-semibold text-white hover:bg-olive-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive-700"
          >
            Προγραμματισμός εργασίας
          </button>
          {!loading && !error && now && (
            <p className="mt-4 text-sm text-olive-800">
              {work.completed} ολοκληρωμένες εργασίες τις τελευταίες 7 ημέρες
            </p>
          )}
        </div>
        <div className="p-5 sm:p-7" aria-busy={loading}>
          {loading || !now ? (
            <div role="status" className="space-y-4 motion-safe:animate-pulse">
              <span className="sr-only">Φόρτωση εργασιών</span>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : error ? (
            <div role="alert">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={onRetry}
                className="mt-3 min-h-[44px] font-semibold text-olive-700 underline"
              >
                Δοκιμάστε ξανά
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-3 text-sm">
                <span className="font-semibold text-gray-800">
                  {work.upcoming.length} εργασίες τις επόμενες 7 ημέρες
                </span>
                {work.overdue.length > 0 && (
                  <span className="font-semibold text-amber-800">
                    {work.overdue.length} παλαιότερες εκκρεμότητες
                  </span>
                )}
              </div>
              {visible.length ? (
                <ul className="divide-y divide-gray-100">
                  {visible.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/dashboard/farms/${task.farmId}?tab=activities`}
                        className="flex min-h-[64px] items-center justify-between gap-3 rounded-lg py-3 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-olive-700"
                      >
                        <div className="min-w-0">
                          <p className="break-words font-medium text-gray-900">{task.title}</p>
                          <p className="text-sm text-gray-500">{task.farmName}</p>
                        </div>
                        <span
                          className={`shrink-0 text-sm ${work.overdue.some((a) => a.id === task.id) ? 'text-amber-800' : 'text-gray-600'}`}
                        >
                          {format(new Date(task.date), 'd MMM', { locale: el })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-5">
                  <h3 className="font-semibold text-gray-900">Χώρος για την επόμενη επίσκεψη</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    Δεν έχετε προγραμματισμένες εργασίες για τις επόμενες 7 ημέρες. Προσθέστε μια
                    επιθεώρηση ή μια εργασία που έχετε ήδη αποφασίσει.
                  </p>
                </div>
              )}
              {work.upcoming.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <button
                    disabled={downloading}
                    onClick={downloadCalendar}
                    className="min-h-[44px] text-left text-sm font-semibold text-olive-700 underline disabled:opacity-50"
                  >
                    {downloading ? 'Προετοιμασία…' : 'Προσθήκη στο ημερολόγιο του κινητού'}
                  </button>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    Ανοίξτε το αρχείο .ics στο ημερολόγιό σας. Περιλαμβάνει τις προσεχείς εργασίες
                    και υπενθύμιση μία ημέρα πριν, εφόσον υποστηρίζεται. Οι αλλαγές στο OliveIQ δεν
                    συγχρονίζονται αυτόματα.
                  </p>
                  {downloadError && (
                    <p role="alert" className="mt-2 text-sm text-red-700">
                      {downloadError}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
