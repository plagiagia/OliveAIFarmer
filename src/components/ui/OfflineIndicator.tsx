'use client'

import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50">
      <div className="bg-amber-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
        <WifiOff className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-sm">Χωρίς σύνδεση</p>
          <p className="text-xs text-amber-100">Ορισμένες λειτουργίες ενδέχεται να μην είναι διαθέσιμες</p>
        </div>
      </div>
    </div>
  )
}
