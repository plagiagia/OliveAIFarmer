'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CalendarActivityModal from '@/components/calendar/CalendarActivityModal'
import GroveWeatherBrief from '@/components/dashboard/GroveWeatherBrief'
import { trackProductEvent } from '@/lib/product-events'

interface Props {
  farm: {
    id: string
    name: string
    location: string
    coordinates: string | null
    treeCount: number | null
  }
}

export default function GroveWelcome({ farm }: Props) {
  const router = useRouter()
  const [date, setDate] = useState<Date | null>(null)
  const [saved, setSaved] = useState(false)
  return (
    <div className="mb-8">
      <section className="mb-5 rounded-2xl border border-olive-200 bg-olive-50 p-5 sm:p-7">
        <p className="text-sm font-semibold text-olive-700">Ο ΕΛΑΙΩΝΑΣ ΣΑΣ ΕΙΝΑΙ ΕΤΟΙΜΟΣ</p>
        <h2 className="mt-2 text-2xl font-bold text-olive-900">
          Ας οργανώσουμε την επόμενη επίσκεψη.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
          Δείτε τον καιρό και σημειώστε την εργασία που θέλετε να κάνετε. Θα τη βρείτε στο
          εβδομαδιαίο πρόγραμμά σας την επόμενη φορά που θα συνδεθείτε.
        </p>
        {saved ? (
          <p role="status" className="mt-5 font-semibold text-olive-800">
            Η εργασία αποθηκεύτηκε. Δείτε τη στο εβδομαδιαίο πρόγραμμά σας.
          </p>
        ) : (
          <button
            onClick={() => setDate(new Date())}
            className="mt-5 min-h-[44px] rounded-xl bg-olive-700 px-5 py-3 font-semibold text-white hover:bg-olive-800"
          >
            Προσθήκη πρώτης εργασίας
          </button>
        )}
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-3 block min-h-[44px] py-2 text-sm font-semibold text-olive-700 underline"
        >
          Μετάβαση στο εβδομαδιαίο πρόγραμμα
        </button>
      </section>
      <GroveWeatherBrief farm={farm} />
      {date && (
        <CalendarActivityModal
          isOpen
          selectedDate={date}
          farms={[farm]}
          onClose={() => setDate(null)}
          onSuccess={() => {
            setDate(null)
            setSaved(true)
            trackProductEvent('TaskSaved', { surface: 'welcome' })
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
