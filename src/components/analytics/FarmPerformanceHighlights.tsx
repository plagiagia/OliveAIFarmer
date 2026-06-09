'use client'

import { cn } from '@/lib/utils'
import { MapPin, TrendingDown, Trophy, Zap } from 'lucide-react'
import Link from 'next/link'

interface FarmPerformance {
  farmId: string
  farmName: string
  totalYield: number
  revenue: number
  costs: number
  profit: number
  roi: number
  yieldPerStremma: number
  yieldPerTree: number
  efficiency: number
}

interface FarmPerformanceData {
  best: FarmPerformance | null
  worst: FarmPerformance | null
  mostEfficient: FarmPerformance | null
}

interface FarmPerformanceHighlightsProps {
  data: FarmPerformanceData
  title?: string
}

type HighlightKind = 'best' | 'worst' | 'efficient'

export function FarmPerformanceHighlights({ data, title = 'Απόδοση Ελαιώνων' }: FarmPerformanceHighlightsProps) {
  if (!data.best && !data.worst && !data.mostEfficient) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex h-48 items-center justify-center text-gray-500">
          Δεν υπάρχουν αρκετά δεδομένα για σύγκριση
        </div>
      </div>
    )
  }

  const FarmCard = ({
    farm,
    kind,
    icon: Icon,
    label
  }: {
    farm: FarmPerformance
    kind: HighlightKind
    icon: React.ElementType
    label: string
  }) => {
    const primaryMetrics =
      kind === 'efficient'
        ? [
            { label: 'Απόδοση/στρ.', value: `${farm.yieldPerStremma.toFixed(1)} kg` },
            { label: 'Απόδοση/δέντρο', value: `${farm.yieldPerTree.toFixed(1)} kg` }
          ]
        : [
            { label: 'ROI', value: `${farm.roi.toFixed(1)}%` },
            {
              label: 'Κέρδος',
              value: `€${farm.profit.toLocaleString('el-GR')}`,
              emphasize: farm.profit < 0
            }
          ]

    return (
      <Link
        href={`/dashboard/farms/${farm.farmId}`}
        className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:border-olive-300 hover:shadow-md"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <span className="rounded-full bg-olive-50 px-2.5 py-1 text-xs font-medium text-olive-800">
            {label}
          </span>
        </div>

        <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-olive-800">
          <MapPin className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          <span className="truncate">{farm.farmName}</span>
        </h4>

        <div className="grid grid-cols-2 gap-3">
          {primaryMetrics.map((m) => (
            <div key={m.label}>
              <p className="text-xs text-gray-500">{m.label}</p>
              <p
                className={cn(
                  'text-lg font-semibold tabular-nums',
                  'emphasize' in m && m.emphasize ? 'text-red-700' : 'text-gray-900'
                )}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-center text-xs">
          <div>
            <p className="text-gray-500">Παραγωγή</p>
            <p className="font-medium text-gray-800">{farm.totalYield.toLocaleString('el-GR')} kg</p>
          </div>
          <div>
            <p className="text-gray-500">Έσοδα</p>
            <p className="font-medium text-gray-800">€{farm.revenue.toLocaleString('el-GR')}</p>
          </div>
          <div>
            <p className="text-gray-500">Κόστος</p>
            <p className="font-medium text-gray-800">€{farm.costs.toLocaleString('el-GR')}</p>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-gray-500">
          Λεπτομέρειες ελαιώνα
          <span className="inline-block transition-transform group-hover:translate-x-0.5" aria-hidden>
            {' '}
            →
          </span>
        </p>
      </Link>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mb-6 text-sm text-gray-500">Σύγκριση μεταξύ ελαιώνων σας</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {data.best && (
          <FarmCard farm={data.best} kind="best" icon={Trophy} label="Καλύτερος ROI" />
        )}
        {data.mostEfficient && (
          <FarmCard
            farm={data.mostEfficient}
            kind="efficient"
            icon={Zap}
            label="Πιο αποδοτικός"
          />
        )}
        {data.worst && data.worst.farmId !== data.best?.farmId && (
          <FarmCard
            farm={data.worst}
            kind="worst"
            icon={TrendingDown}
            label="Χρειάζεται προσοχή"
          />
        )}
      </div>

      {data.best && data.worst && data.best.farmId !== data.worst.farmId && (
        <p className="mt-6 border-t border-gray-100 pt-4 text-sm text-gray-600">
          Συγκρίνετε τις πρακτικές μεταξύ «{data.best.farmName}» και «{data.worst.farmName}» για
          να βελτιώσετε τη συνολική απόδοση.
        </p>
      )}
    </div>
  )
}
