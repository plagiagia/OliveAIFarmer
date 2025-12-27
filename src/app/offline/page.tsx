import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
          {/* Offline icon */}
          <div className="flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mx-auto mb-6">
            <WifiOff className="w-10 h-10 text-amber-600" />
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Χωρίς σύνδεση
          </h1>
          <p className="text-gray-600 mb-6">
            Φαίνεται ότι δεν έχετε σύνδεση στο διαδίκτυο.
            Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.
          </p>

          {/* Tips */}
          <div className="text-left bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Συμβουλές:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Ελέγξτε αν το WiFi είναι ενεργοποιημένο</li>
              <li>• Δοκιμάστε να απενεργοποιήσετε τη λειτουργία πτήσης</li>
              <li>• Μετακινηθείτε σε περιοχή με καλύτερο σήμα</li>
            </ul>
          </div>

          {/* Retry button */}
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-olive-600 text-white rounded-xl hover:bg-olive-700 transition-colors font-medium w-full"
          >
            <RefreshCw className="w-5 h-5" />
            Δοκιμάστε ξανά
          </button>
        </div>

        {/* Olive logo */}
        <div className="mt-8 text-4xl">🫒</div>
        <p className="text-sm text-gray-500 mt-2">ΕλαιοLog</p>
      </div>
    </div>
  )
}
