'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function FarmDetailError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Farm detail error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
          {/* Error icon */}
          <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>

          {/* Error message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Σφάλμα φόρτωσης αγροκτήματος
          </h1>
          <p className="text-gray-600 mb-6">
            Δεν ήταν δυνατή η φόρτωση των στοιχείων του αγροκτήματος.
            Το αγρόκτημα ενδέχεται να μην υπάρχει ή να μην έχετε πρόσβαση.
          </p>

          {/* Error details - always show for debugging */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl text-left">
            <p className="text-xs font-mono text-gray-500 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-gray-400 mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-olive-600 text-white rounded-xl hover:bg-olive-700 transition-colors font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              Δοκιμάστε ξανά
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Πίνακας ελέγχου
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
