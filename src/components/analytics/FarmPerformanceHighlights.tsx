'use client'

import { Trophy, TrendingDown, Zap, MapPin } from 'lucide-react'
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

export function FarmPerformanceHighlights({ data, title = 'Απόδοση Ελαιώνων' }: FarmPerformanceHighlightsProps) {
  if (!data.best && !data.worst && !data.mostEfficient) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Δεν υπάρχουν αρκετά δεδομένα για σύγκριση
        </div>
      </div>
    )
  }

  const FarmCard = ({
    farm,
    type,
    icon: Icon,
    colorClass,
    label
  }: {
    farm: FarmPerformance
    type: string
    icon: React.ElementType
    colorClass: string
    label: string
  }) => (
    <Link
      href={`/dashboard/farms/${farm.farmId}`}
      className="block bg-white border-2 rounded-xl p-5 hover:shadow-lg transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`${colorClass} p-3 rounded-xl`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-xs font-medium px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
          {label}
        </span>
      </div>

      <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-olive-700 transition-colors flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        {farm.farmName}
      </h4>

      <div className="grid grid-cols-2 gap-3 mt-4">
        {type === 'best' && (
          <>
            <div>
              <p className="text-xs text-gray-500">ROI</p>
              <p className="text-lg font-bold text-green-600">{farm.roi.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Κέρδος</p>
              <p className="text-lg font-bold text-green-600">€{farm.profit.toLocaleString('el-GR')}</p>
            </div>
          </>
        )}

        {type === 'worst' && (
          <>
            <div>
              <p className="text-xs text-gray-500">ROI</p>
              <p className="text-lg font-bold text-red-600">{farm.roi.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Κέρδος</p>
              <p className="text-lg font-bold text-red-600">€{farm.profit.toLocaleString('el-GR')}</p>
            </div>
          </>
        )}

        {type === 'efficient' && (
          <>
            <div>
              <p className="text-xs text-gray-500">Απόδοση/Στρ.</p>
              <p className="text-lg font-bold text-blue-600">{farm.yieldPerStremma.toFixed(1)} kg</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Απόδοση/Δέντρο</p>
              <p className="text-lg font-bold text-blue-600">{farm.yieldPerTree.toFixed(1)} kg</p>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="text-gray-500">Παραγωγή</p>
            <p className="font-semibold text-gray-700">{farm.totalYield.toLocaleString('el-GR')} kg</p>
          </div>
          <div>
            <p className="text-gray-500">Έσοδα</p>
            <p className="font-semibold text-gray-700">€{farm.revenue.toLocaleString('el-GR')}</p>
          </div>
          <div>
            <p className="text-gray-500">Κόστος</p>
            <p className="font-semibold text-gray-700">€{farm.costs.toLocaleString('el-GR')}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 flex items-center justify-center gap-1">
        <span>Κλικ για λεπτομέρειες</span>
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </Link>
  )

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.best && (
          <FarmCard
            farm={data.best}
            type="best"
            icon={Trophy}
            colorClass="bg-gradient-to-br from-yellow-400 to-yellow-500"
            label="Καλύτερος ROI"
          />
        )}

        {data.mostEfficient && (
          <FarmCard
            farm={data.mostEfficient}
            type="efficient"
            icon={Zap}
            colorClass="bg-gradient-to-br from-blue-500 to-blue-600"
            label="Πιο Αποδοτικός"
          />
        )}

        {data.worst && data.worst.farmId !== data.best?.farmId && (
          <FarmCard
            farm={data.worst}
            type="worst"
            icon={TrendingDown}
            colorClass="bg-gradient-to-br from-orange-500 to-red-500"
            label="Χρειάζεται Προσοχή"
          />
        )}
      </div>

      {/* Tips Section */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900 font-medium mb-2">💡 Συμβουλή</p>
          <p className="text-xs text-blue-700">
            Συγκρίνετε τις πρακτικές μεταξύ των ελαιώνων σας για να βελτιώσετε τη συνολική απόδοση.
            {data.best && data.worst && data.best.farmId !== data.worst.farmId && (
              <span> Εξετάστε τι κάνει διαφορετικά ο ελαιώνας «{data.best.farmName}» από τον «{data.worst.farmName}».</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
