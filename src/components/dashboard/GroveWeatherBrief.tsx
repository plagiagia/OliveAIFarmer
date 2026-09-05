'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { parseCoordinates } from '@/lib/mapbox-utils'
import { trackProductEvent } from '@/lib/product-events'
import type { WeatherIntelligence } from '@/types/weather'

export default function GroveWeatherBrief({
  farm,
}: {
  farm: { id: string; name: string; coordinates: string | null }
}) {
  const [data, setData] = useState<WeatherIntelligence | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const coords = farm.coordinates ? parseCoordinates(farm.coordinates) : null
  const lat = coords?.lat
  const lng = coords?.lng
  useEffect(() => {
    if (lat == null || lng == null) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(false)
    setData(null)
    fetch(
      `/api/weather?${new URLSearchParams({ lat: String(lat), lon: String(lng), farmId: farm.id })}`,
      { signal: controller.signal }
    )
      .then(async (response) => {
        if (!response.ok) throw new Error()
        return response.json() as Promise<WeatherIntelligence>
      })
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result)
          trackProductEvent('WeatherViewed', { surface: 'weekly' })
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [farm.id, lat, lng, attempt])

  return (
    <section
      className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6"
      aria-label="Καιρός ελαιώνα"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-olive-700">
            ΠΡΙΝ ΤΗΝ ΕΠΟΜΕΝΗ ΕΠΙΣΚΕΨΗ
          </p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">Καιρός · {farm.name}</h2>
        </div>
        <Link
          href={`/dashboard/farms/${farm.id}`}
          className="min-h-[44px] py-2 text-sm font-semibold text-olive-700 underline"
        >
          Αναλυτική εικόνα ελαιώνα
        </Link>
      </div>
      {lat == null || lng == null ? (
        <p className="mt-3 text-sm text-gray-600">
          Ορίστε τη θέση του ελαιώνα από την επεξεργασία στοιχείων για να δείτε τον τοπικό καιρό.
        </p>
      ) : loading ? (
        <div role="status" className="mt-4 h-16 rounded-lg bg-gray-100 motion-safe:animate-pulse">
          <span className="sr-only">Φόρτωση καιρού</span>
        </div>
      ) : error || !data ? (
        <div role="alert" className="mt-3 text-sm text-gray-600">
          Ο καιρός δεν είναι διαθέσιμος αυτή τη στιγμή.{' '}
          <button
            onClick={() => setAttempt((a) => a + 1)}
            className="min-h-[44px] font-semibold text-olive-700 underline"
          >
            Δοκιμάστε ξανά
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-3xl font-semibold tabular-nums text-gray-900">
              {Math.round(data.weather.current.temperature)}°C
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {data.weather.current.description} · Άνεμος{' '}
              {data.weather.current.windSpeed.toFixed(1)} m/s
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Ενημέρωση:{' '}
              {new Date(data.lastUpdated).toLocaleString('el-GR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="border-l-2 border-olive-200 pl-4">
            <h3 className="font-semibold text-gray-900">
              {data.alerts[0]?.title ?? 'Προετοιμάστε την επίσκεψή σας'}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {data.alerts[0]?.message ??
                'Ελέγξτε την πρόγνωση πριν οργανώσετε τις εργασίες σας. Ο τρέχων καιρός δεν αποτελεί εκτίμηση της υγείας του ελαιώνα.'}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
