'use client'

import PricingComparison from '@/components/pricing/PricingComparison'
import { X } from 'lucide-react'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
}

export default function PricingModal({
  isOpen,
  onClose,
  title = 'Αναβαθμίστε το πλάνο σας',
}: PricingModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-modal-title"
    >
      <div
        className="relative flex w-full max-w-6xl max-h-[92vh] sm:max-h-[90vh] flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile bottom sheet) */}
        <div className="sm:hidden shrink-0 pt-3 flex justify-center" aria-hidden="true">
          <div className="h-1.5 w-12 rounded-full bg-gray-300" />
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 py-3 sm:py-4 sm:px-6">
          <h2 id="pricing-modal-title" className="text-lg font-bold text-gray-900 sm:text-xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="touch-target flex items-center justify-center rounded-lg p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Κλείσιμο"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain py-4 pb-safe-4 sm:py-6">
          <PricingComparison showHeader={false} />
        </div>
      </div>
    </div>
  )
}
