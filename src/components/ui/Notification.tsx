'use client'

import { clsx } from 'clsx'
import { CheckCircle, Info, X, XCircle } from 'lucide-react'
import { useEffect } from 'react'

interface NotificationProps {
  message: string
  type: 'success' | 'error' | 'info'
  show: boolean
  onClose?: () => void
}

export default function Notification({ message, type, show, onClose }: NotificationProps) {
  useEffect(() => {
    if (show && onClose) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info
  }

  const colors = {
    success: 'bg-green-500 border-green-600',
    error: 'bg-red-500 border-red-600',
    info: 'bg-blue-500 border-blue-600'
  }

  const Icon = icons[type]

  return (
    <div className={clsx(
      'fixed top-6 right-6 z-50 max-w-sm w-full transform transition-all duration-300 ease-in-out',
      show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    )}>
      <div className={clsx(
        'rounded-2xl border-l-4 text-white p-4 shadow-lg backdrop-blur-sm',
        colors[type]
      )}>
        <div className="flex items-start space-x-3">
          <Icon className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium leading-relaxed">
              {message}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 