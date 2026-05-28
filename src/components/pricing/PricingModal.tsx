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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-modal-title"
    >
      <div
        className="relative flex w-full max-w-6xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 py-4 sm:px-6">
          <h2 id="pricing-modal-title" className="text-lg font-bold text-gray-900 sm:text-xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Κλείσιμο"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto py-4 sm:py-6">
          <PricingComparison showHeader={false} />
        </div>
      </div>
    </div>
  )
}
