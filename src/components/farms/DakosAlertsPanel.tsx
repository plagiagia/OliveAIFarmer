'use client'

import type { DakosRisk, PestRiskReport, RiskLevel } from '@/lib/agronomy/pest-risk'
import { AlertTriangle, Bug, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface DakosAlertsPanelProps {
  farmId: string
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

function preventionAdvice(level: RiskLevel): string {
  if (level === 'LOW') {
    return 'Συνεχίστε την εβδομαδιαία παρακολούθηση με παγίδες McPhail. Καταγράψτε ψεκασμούς στο ημερολόγιο.'
  }
  if (level === 'MODERATE') {
    return 'Ελέγξτε τις παγίδες 2–3 φορές την εβδομάδα. Εξετάστε δολωματικό ψεκασμό αν ανιχνευθούν captures.'
  }
  if (level === 'HIGH') {
    return 'Προγραμματίστε δολωματικό ψεκασμό (π.χ. spinosad) εντός 5–7 ημερών. Αυξήστε τη συχνότητα ελέγχου παγίδων.'
  }
  return 'Άμεση δράση: δολωματικός ψεκασμός και επανέλεγχος παγίδων σε 3–5 ημέρες. Επικοινωνήστε με γεωπόνο αν η πίεση παραμένει.'
}

function alertTitle(dakos: DakosRisk): string {
  if (dakos.level === 'EXTREME') return 'Κρίσιμος κίνδυνος δάκου'
  if (dakos.level === 'HIGH') return 'Αυξημένος κίνδυνος δάκου'
  if (dakos.level === 'MODERATE') return 'Μέτριος κίνδυνος δάκου'
  return 'Χαμηλός κίνδυνος δάκου'
}

export default function DakosAlertsPanel({ farmId }: DakosAlertsPanelProps) {
  const [report, setReport] = useState<PestRiskReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/farms/${farmId}/pest-risk`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Αποτυχία φόρτωσης ειδοποιήσεων δάκου')
      }
      setReport(data.report)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία φόρτωσης')
    } finally {
      setLoading(false)
    }
  }, [farmId])

  useEffect(() => {
    fetchReport()
    const interval = setInterval(fetchReport, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchReport])

  if (loading && !report) {
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

  if (!report) return null

  const { dakos } = report
  const hasEnoughHistory = report.windowDays >= 7
  const showAlert = hasEnoughHistory && dakos.level !== 'LOW'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bug className="w-5 h-5 text-amber-600" />
            Ειδοποιήσεις Δάκου
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Βασισμένο σε {report.windowDays} ημέρες καιρικού ιστορικού · ενημέρωση κάθε 30 λεπτά
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
        {!hasEnoughHistory ? (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
            Συλλέγουμε καιρικά δεδομένα για τον ελαιώνα σας. Οι ειδοποιήσεις δάκου θα εμφανιστούν
            μόλις υπάρχουν τουλάχιστον 7 ημέρες ιστορικού (αυτόματα από το σύστημα).
          </div>
        ) : (
          <>
            {showAlert && (
              <div className={`rounded-xl border p-4 ${LEVEL_ALERT_STYLES[dakos.level]}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-current opacity-80" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{alertTitle(dakos)}</h4>
                    <p className="text-sm text-gray-700 mt-1">{dakos.rationale}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <span className="font-medium text-gray-900">Bactrocera oleae (Δάκος της ελιάς)</span>
                <span className={`text-xs px-3 py-1 rounded-full border font-medium ${LEVEL_STYLES[dakos.level]}`}>
                  {LEVEL_LABELS[dakos.level]} · {dakos.score}/100
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                <div>
                  <dt className="text-gray-500">Σωρευτικοί βαθμοημέρες</dt>
                  <dd className="font-medium text-gray-900">{dakos.cumulativeGDD}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Ημέρες &gt;35°C</dt>
                  <dd className="font-medium text-gray-900">{dakos.hotDaysOver35}</dd>
                </div>
              </dl>
              <p className="text-sm text-gray-700">
                <strong>Σύσταση:</strong> {preventionAdvice(dakos.level)}
              </p>
            </div>
          </>
        )}
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
