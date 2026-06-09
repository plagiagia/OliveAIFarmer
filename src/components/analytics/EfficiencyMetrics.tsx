'use client'

import { cn } from '@/lib/utils'

interface EfficiencyData {
  roi: number
  costPerKg: number
  yieldPerTree: number
  avgYieldPerStremma: number
  profitMargin: number
}

type MetricStatus = 'good' | 'fair' | 'poor'

interface EfficiencyMetricsProps {
  data: EfficiencyData
  title?: string
}

function getStatus(
  value: number,
  mode: 'higher' | 'lower',
  goodThreshold: number,
  fairThreshold: number
): MetricStatus {
  if (mode === 'higher') {
    if (value > goodThreshold) return 'good'
    if (value > fairThreshold) return 'fair'
    return 'poor'
  }
  if (value < goodThreshold) return 'good'
  if (value < fairThreshold) return 'fair'
  return 'poor'
}

const statusLabel: Record<MetricStatus, string> = {
  good: 'Εξαιρετικό',
  fair: 'Καλό',
  poor: 'Χρειάζεται βελτίωση'
}

function StatusDot({ status }: { status: MetricStatus }) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 shrink-0 rounded-full',
        status === 'good' && 'bg-olive-600',
        status === 'fair' && 'bg-amber-500',
        status === 'poor' && 'bg-red-500'
      )}
      aria-hidden
    />
  )
}

export function EfficiencyMetrics({ data, title = 'Δείκτες Απόδοσης' }: EfficiencyMetricsProps) {
  const rows: Array<{
    label: string
    value: string
    hint: string
    status: MetricStatus
  }> = [
    {
      label: 'ROI (Απόδοση Επένδυσης)',
      value: `${data.roi.toFixed(1)}%`,
      hint: 'Κέρδος σε σχέση με το κόστος',
      status: getStatus(data.roi, 'higher', 30, 15)
    },
    {
      label: 'Κόστος ανά κιλό',
      value: `€${data.costPerKg.toFixed(2)}`,
      hint: 'Μέσο κόστος παραγωγής',
      status: getStatus(data.costPerKg, 'lower', 1.5, 2.5)
    },
    {
      label: 'Απόδοση ανά δέντρο',
      value: `${data.yieldPerTree.toFixed(1)} kg`,
      hint: 'Μέση παραγωγή ανά δέντρο',
      status: getStatus(data.yieldPerTree, 'higher', 20, 10)
    },
    {
      label: 'Απόδοση ανά στρέμμα',
      value: `${data.avgYieldPerStremma.toFixed(0)} kg`,
      hint: 'Μέση παραγωγή ανά στρέμμα',
      status: getStatus(data.avgYieldPerStremma, 'higher', 150, 100)
    },
    {
      label: 'Περιθώριο κέρδους',
      value: `${data.profitMargin.toFixed(1)}%`,
      hint: 'Ποσοστό κέρδους επί των εσόδων',
      status: getStatus(data.profitMargin, 'higher', 40, 20)
    }
  ]

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">
        Σύγκριση με τυπικά όρια για ελαιοπαραγωγή στην Ελλάδα
      </p>

      {/* Mobile: stacked cards instead of a table */}
      <div className="mt-6 space-y-3 sm:hidden">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{row.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{row.hint}</p>
              </div>
              <p className="shrink-0 text-lg font-semibold tabular-nums text-gray-900">{row.value}</p>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <StatusDot status={row.status} />
              <span>{statusLabel[row.status]}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="pb-3 pr-4 font-medium">Δείκτης</th>
              <th className="pb-3 pr-4 font-medium">Τιμή</th>
              <th className="pb-3 font-medium">Κατάσταση</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.label} className="group">
                <td className="py-4 pr-4 align-top">
                  <p className="font-medium text-gray-900">{row.label}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{row.hint}</p>
                </td>
                <td className="py-4 pr-4 align-top">
                  <p className="text-lg font-semibold tabular-nums text-gray-900">{row.value}</p>
                </td>
                <td className="py-4 align-top">
                  <div className="flex items-center gap-2">
                    <StatusDot status={row.status} />
                    <span className="text-gray-600">{statusLabel[row.status]}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <StatusDot status="good" /> Εξαιρετικό
        </span>
        <span className="mx-2">·</span>
        <span className="inline-flex items-center gap-1.5">
          <StatusDot status="fair" /> Καλό
        </span>
        <span className="mx-2">·</span>
        <span className="inline-flex items-center gap-1.5">
          <StatusDot status="poor" /> Χρειάζεται βελτίωση
        </span>
      </p>
    </div>
  )
}
