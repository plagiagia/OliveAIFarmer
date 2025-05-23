'use client'

import { X } from 'lucide-react'

interface FarmEditModalProps {
  farm: any
  onClose: () => void
  onSuccess: () => void
}

export default function FarmEditModal({ farm, onClose, onSuccess }: FarmEditModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Επεξεργασία Ελαιώνα</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 text-center">
          <p className="text-gray-600 mb-6">
            Η επεξεργασία ελαιώνα θα υλοποιηθεί σύντομα...
          </p>
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  )
} 