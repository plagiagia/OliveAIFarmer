'use client'

import PricingModal from '@/components/pricing/PricingModal'
import { usePlan } from '@/hooks/usePlan'
import {
  logbookYears,
  printFieldLogbook,
  type LogbookActivity,
  type LogbookFarm,
  type LogbookHarvest,
} from '@/lib/export/logbook'
import { FileText, Lock } from 'lucide-react'
import { useState } from 'react'

interface LogbookExportButtonProps {
  farm: LogbookFarm
  activities: LogbookActivity[]
  harvests: LogbookHarvest[]
  className?: string
}

/**
 * "Εξαγωγή PDF Ημερολογίου" — prints the OPEKEPE-style field logbook for a
 * selected year. Paid (Pro) feature; locked state opens the pricing modal.
 */
export default function LogbookExportButton({
  farm,
  activities,
  harvests,
  className = '',
}: LogbookExportButtonProps) {
  const { isLoading, can } = usePlan()
  const [showYears, setShowYears] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)

  const canExport = !isLoading && can('exportPdf')
  const years = logbookYears(activities, harvests)
  if (years.length === 0) return null

  const handleClick = () => {
    if (!canExport) {
      setShowPricingModal(true)
      return
    }
    if (years.length === 1) {
      printFieldLogbook(farm, activities, harvests, years[0])
      return
    }
    setShowYears((open) => !open)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        title={canExport ? 'Ημερολόγιο αγρού σε PDF για ΟΣΔΕ/λογιστή' : 'Διαθέσιμο στο πλάνο Pro'}
        className={`flex items-center space-x-2 rounded-lg border px-4 py-2 transition-colors ${
          canExport
            ? 'border-gray-200 bg-white text-gray-700 hover:border-olive-300 hover:text-olive-700'
            : 'border-gray-200 bg-gray-100 text-gray-500 opacity-75 hover:opacity-90'
        }`}
      >
        {canExport ? <FileText className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        <span>Ημερολόγιο PDF</span>
      </button>

      {showYears && canExport && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowYears(false)} />
          <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
            {years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => {
                  setShowYears(false)
                  printFieldLogbook(farm, activities, harvests, year)
                }}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <FileText className="h-4 w-4 text-gray-400" />
                Περίοδος {year}
              </button>
            ))}
          </div>
        </>
      )}

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        title="Το PDF ημερολόγιο είναι διαθέσιμο στο Pro"
      />
    </div>
  )
}
