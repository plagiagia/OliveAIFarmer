'use client'

import type { DakosRisk, PestRiskReport, RiskLevel } from '@/lib/agronomy/pest-risk'
import type { TrapPressure } from '@/lib/agronomy/trap-pressure'
import type { SprayWindowDay, SprayWindowPlan, SprayWindowRating } from '@/lib/agronomy/spray-window'
import { AlertTriangle, Bug, CalendarCheck, Plus, RefreshCw, SprayCan, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface DakosAlertsPanelProps {
  farmId: string
}

interface PestRiskResponse {
  report: PestRiskReport
  trapPressure: TrapPressure
  combinedLevel: RiskLevel
  sprayWindow: SprayWindowPlan | null
}

const LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: 'Χαμηλός',
  MODERATE: 'Μέτριος',
  HIGH: 'Υψηλός',
  EXTREME: 'Ακραίος',
}

const LEVEL_STYLES: Record<RiskLevel, string> = {
  LOW: 'bg-green-100 text-green-800 border-green-200',
  MODERATE: 'bg-amber-100 text-amber-800 border-amber-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  EXTREME: 'bg-red-100 text-red-800 border-red-200',
}

const LEVEL_ALERT_STYLES: Record<RiskLevel, string> = {
  LOW: 'bg-green-50 border-green-200',
  MODERATE: 'bg-amber-50 border-amber-200',
  HIGH: 'bg-orange-50 border-orange-300',
  EXTREME: 'bg-red-50 border-red-300',
}

const SPRAY_RATING_LABELS: Record<SprayWindowRating, string> = {
  GOOD: 'Κατάλληλη',
  MARGINAL: 'Οριακή',
  UNSUITABLE: 'Ακατάλληλη',
}

const SPRAY_RATING_STYLES: Record<SprayWindowRating, string> = {
  GOOD: 'bg-green-100 text-green-800 border-green-200',
  MARGINAL: 'bg-amber-100 text-amber-800 border-amber-200',
  UNSUITABLE: 'bg-gray-100 text-gray-600 border-gray-200',
}

function preventionAdvice(level: RiskLevel): string {
  if (level === 'LOW') {
    return 'Συνεχίστε την εβδομαδιαία παρακολούθηση με παγίδες McPhail. Καταγράψτε συλλήψεις και ψεκασμούς.'
  }
  if (level === 'MODERATE') {
    return 'Ελέγξτε τις παγίδες 2–3 φορές την εβδομάδα. Εξετάστε δολωματικό ψεκασμό αν αυξηθούν οι συλλήψεις.'
  }
  if (level === 'HIGH') {
    return 'Προγραμματίστε δολωματικό ψεκασμό (π.χ. spinosad) εντός 5–7 ημερών. Αυξήστε τη συχνότητα ελέγχου παγίδων.'
  }
  return 'Άμεση δράση: δολωματικός ψεκασμός και επανέλεγχος παγίδων σε 3–5 ημέρες. Επικοινωνήστε με γεωπόνο αν η πίεση παραμένει.'
}

function alertTitle(level: RiskLevel): string {
  if (level === 'EXTREME') return 'Κρίσιμος κίνδυνος δάκου'
  if (level === 'HIGH') return 'Αυξημένος κίνδυνος δάκου'
  if (level === 'MODERATE') return 'Μέτριος κίνδυνος δάκου'
  return 'Χαμηλός κίνδυνος δάκου'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('el-GR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function DakosAlertsPanel({ farmId }: DakosAlertsPanelProps) {
  const [data, setData] = useState<PestRiskResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTrapForm, setShowTrapForm] = useState(false)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/farms/${farmId}/pest-risk`)
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Αποτυχία φόρτωσης ειδοποιήσεων δάκου')
      }
      setData(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία φόρτωσης')
    } finally {
      setLoading(false)
    }
  }, [farmId])

  // Data updates once a day from the weather cron, so we refetch on mount and
  // when the user returns to the tab — no fixed polling interval.
  useEffect(() => {
    fetchReport()
    const onFocus = () => fetchReport()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchReport])

  if (loading && !data) {
    return <DakosAlertsSkeleton />
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bug className="w-5 h-5 text-amber-600" />
            Ειδοποιήσεις Δάκου
          </h3>
        </div>
        <p className="text-sm text-gray-600">{error}</p>
        <button
          onClick={fetchReport}
          className="mt-4 text-sm text-olive-700 hover:text-olive-800 inline-flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Δοκιμάστε ξανά
        </button>
      </div>
    )
  }

  if (!data) return null

  const { report, trapPressure, combinedLevel, sprayWindow } = data
  const { dakos } = report
  const hasEnoughHistory = report.windowDays >= 7
  const showAlert = combinedLevel !== 'LOW' && (hasEnoughHistory || trapPressure.fliesPerTrapPerDay != null)
  const showSprayWindow = sprayWindow != null && sprayWindow.days.length > 0 && combinedLevel !== 'LOW'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bug className="w-5 h-5 text-amber-600" />
            Ειδοποιήσεις Δάκου
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Καιρός {report.windowDays} ημερών + συλλήψεις παγίδων · καθημερινή ενημέρωση
          </p>
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Ανανέωση"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-6 space-y-4">
        {showAlert && (
          <div className={`rounded-xl border p-4 ${LEVEL_ALERT_STYLES[combinedLevel]}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-current opacity-80" />
              <div>
                <h4 className="font-semibold text-gray-900">{alertTitle(combinedLevel)}</h4>
                <p className="text-sm text-gray-700 mt-1">{preventionAdvice(combinedLevel)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Spray window planner */}
        {showSprayWindow && (
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <SprayCan className="w-4 h-4 text-olive-700" />
              <span className="font-medium text-gray-900">Παράθυρο ψεκασμού</span>
            </div>
            <p className="text-sm text-gray-700 mb-3">{sprayWindow!.summary}</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {sprayWindow!.days.map((day) => (
                <SprayDayCard key={day.date} day={day} />
              ))}
            </div>
          </div>
        )}

        {/* Trap monitoring */}
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <span className="font-medium text-gray-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-gray-500" />
              Παρακολούθηση παγίδων
            </span>
            {trapPressure.fliesPerTrapPerDay != null ? (
              <span className={`text-xs px-3 py-1 rounded-full border font-medium ${LEVEL_STYLES[trapPressure.level]}`}>
                {trapPressure.fliesPerTrapPerDay} συλλ./παγίδα/ημέρα
              </span>
            ) : (
              <span className="text-xs px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-500">
                Χωρίς καταγραφές
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">{trapPressure.rationale}</p>
          {showTrapForm ? (
            <TrapForm
              farmId={farmId}
              onClose={() => setShowTrapForm(false)}
              onSaved={() => {
                setShowTrapForm(false)
                fetchReport()
              }}
            />
          ) : (
            <button
              onClick={() => setShowTrapForm(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-olive-700 hover:text-olive-800"
            >
              <Plus className="w-4 h-4" />
              Καταγραφή συλλήψεων
            </button>
          )}
        </div>

        {/* Weather-derived risk detail */}
        {!hasEnoughHistory ? (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
            Συλλέγουμε καιρικά δεδομένα για τον ελαιώνα σας. Το καιρικό σκορ θα εμφανιστεί μόλις
            υπάρχουν τουλάχιστον 7 ημέρες ιστορικού. Στο μεταξύ, καταγράψτε τις συλλήψεις των παγίδων σας.
          </div>
        ) : (
          <WeatherRiskDetail dakos={dakos} />
        )}
      </div>
    </div>
  )
}

function WeatherRiskDetail({ dakos }: { dakos: DakosRisk }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <span className="font-medium text-gray-900">Καιρικό σκορ (Bactrocera oleae)</span>
        <span className={`text-xs px-3 py-1 rounded-full border font-medium ${LEVEL_STYLES[dakos.level]}`}>
          {LEVEL_LABELS[dakos.level]} · {dakos.score}/100
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm text-gray-600">
        <div>
          <dt className="text-gray-500">Σωρευτικοί βαθμοημέρες</dt>
          <dd className="font-medium text-gray-900">{dakos.cumulativeGDD}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Ημέρες &gt;35°C</dt>
          <dd className="font-medium text-gray-900">{dakos.hotDaysOver35}</dd>
        </div>
      </dl>
    </div>
  )
}

function SprayDayCard({ day }: { day: SprayWindowDay }) {
  return (
    <div className={`rounded-lg border p-2 text-center ${SPRAY_RATING_STYLES[day.rating]}`} title={day.reasons.join(' · ')}>
      <div className="text-xs font-medium">{formatDate(day.date)}</div>
      <div className="text-[11px] mt-0.5">{SPRAY_RATING_LABELS[day.rating]}</div>
      <div className="text-[11px] mt-0.5 opacity-80">
        {Math.round(day.tempMax)}°C · {Math.round(day.windSpeed * 3.6)}km/h
      </div>
    </div>
  )
}

function TrapForm({
  farmId,
  onClose,
  onSaved,
}: {
  farmId: string
  onClose: () => void
  onSaved: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [trapType, setTrapType] = useState('MCPHAIL')
  const [trapCount, setTrapCount] = useState('1')
  const [totalCatch, setTotalCatch] = useState('')
  const [femaleCatch, setFemaleCatch] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const submit = async () => {
    setSaving(true)
    setFormError(null)
    try {
      const response = await fetch(`/api/farms/${farmId}/trap-readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          trapType,
          trapCount: Number(trapCount) || 1,
          totalCatch: Number(totalCatch),
          femaleCatch: femaleCatch === '' ? null : Number(femaleCatch),
          notes,
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Αποτυχία καταγραφής')
      }
      onSaved()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Αποτυχία καταγραφής')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">Νέα καταγραφή παγίδων</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" title="Κλείσιμο">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-gray-600">
          Ημερομηνία ελέγχου
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-gray-600">
          Τύπος παγίδας
          <select
            value={trapType}
            onChange={(e) => setTrapType(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="MCPHAIL">McPhail</option>
            <option value="YELLOW_STICKY">Κίτρινη κολλητική</option>
            <option value="DACUS_TRAP">Φερομονική (Dacus)</option>
            <option value="OTHER">Άλλο</option>
          </select>
        </label>
        <label className="text-xs text-gray-600">
          Αριθμός παγίδων
          <input
            type="number"
            min={1}
            value={trapCount}
            onChange={(e) => setTrapCount(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-gray-600">
          Σύνολο συλλήψεων
          <input
            type="number"
            min={0}
            value={totalCatch}
            onChange={(e) => setTotalCatch(e.target.value)}
            placeholder="π.χ. 12"
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-gray-600 col-span-2">
          Θηλυκά (προαιρετικό)
          <input
            type="number"
            min={0}
            value={femaleCatch}
            onChange={(e) => setFemaleCatch(e.target.value)}
            placeholder="πόσα από τα παραπάνω ήταν θηλυκά"
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-gray-600 col-span-2">
          Σημειώσεις (προαιρετικό)
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
        >
          Άκυρο
        </button>
        <button
          onClick={submit}
          disabled={saving || totalCatch === ''}
          className="px-4 py-1.5 text-sm font-medium rounded-md bg-olive-700 text-white hover:bg-olive-800 disabled:opacity-50"
        >
          {saving ? 'Αποθήκευση…' : 'Αποθήκευση'}
        </button>
      </div>
    </div>
  )
}

function DakosAlertsSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-24 bg-gray-100 rounded-xl" />
    </div>
  )
}
