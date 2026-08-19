'use client'

import { usePlan } from '@/hooks/usePlan'
import { Bell, BellOff, BellRing, Loader2, Lock } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return buffer
}

type Status = 'loading' | 'unsupported' | 'denied' | 'off' | 'on' | 'busy'

/**
 * Settings card to enable/disable δάκος push alerts on this device.
 * The actual alert sends are gated server-side to paid plans; here we
 * show a lock hint to FREE users.
 */
export default function PushNotificationSection() {
  const { isLoading: isPlanLoading, can } = usePlan()
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)

  const canReceiveAlerts = !isPlanLoading && can('oliveFlyAlerts')
  const pushAvailable = Boolean(VAPID_PUBLIC_KEY)

  const refresh = useCallback(async () => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window)
    ) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setStatus(subscription ? 'on' : 'off')
    } catch {
      setStatus('off')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const enable = async () => {
    if (!VAPID_PUBLIC_KEY) return
    setError(null)
    setStatus('busy')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'off')
        return
      }
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY),
      })
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })
      if (!res.ok) throw new Error('subscribe failed')
      setStatus('on')
    } catch {
      setError('Δεν ήταν δυνατή η ενεργοποίηση ειδοποιήσεων. Δοκιμάστε ξανά.')
      setStatus('off')
    }
  }

  const disable = async () => {
    setError(null)
    setStatus('busy')
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }
      setStatus('off')
    } catch {
      setError('Δεν ήταν δυνατή η απενεργοποίηση. Δοκιμάστε ξανά.')
      setStatus('on')
    }
  }

  return (
    <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <BellRing className="mt-0.5 h-6 w-6 shrink-0 text-olive-700" />
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900">Ειδοποιήσεις Δάκου</h2>
          <p className="mt-1 text-sm text-gray-600">
            Λάβετε ειδοποίηση στη συσκευή σας όταν οι καιρικές συνθήκες δείχνουν υψηλό
            κίνδυνο δάκου στον ελαιώνα σας — πριν χαθεί το παράθυρο ψεκασμού.
          </p>

          <div className="mt-4">
            {!pushAvailable || status === 'unsupported' ? (
              <p className="text-sm text-gray-500">
                Οι ειδοποιήσεις δεν υποστηρίζονται σε αυτή τη συσκευή/πρόγραμμα περιήγησης.
                {!pushAvailable && ' (Δεν έχουν ρυθμιστεί κλειδιά push στον διακομιστή.)'}
              </p>
            ) : !canReceiveAlerts && !isPlanLoading ? (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-olive-300 bg-white px-4 py-2 text-sm font-semibold text-olive-800 hover:bg-olive-50 transition-colors"
              >
                <Lock className="h-4 w-4" />
                Διαθέσιμο στο πλάνο Pro — δείτε τιμές
              </Link>
            ) : status === 'denied' ? (
              <p className="text-sm text-amber-700">
                Έχετε αποκλείσει τις ειδοποιήσεις για αυτή την εφαρμογή. Ενεργοποιήστε τις
                από τις ρυθμίσεις του προγράμματος περιήγησης και ανανεώστε τη σελίδα.
              </p>
            ) : status === 'on' ? (
              <button
                onClick={disable}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <BellOff className="h-4 w-4" />
                Απενεργοποίηση σε αυτή τη συσκευή
              </button>
            ) : status === 'busy' || status === 'loading' ? (
              <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Παρακαλώ περιμένετε…
              </span>
            ) : (
              <button
                onClick={enable}
                className="inline-flex items-center gap-2 rounded-xl bg-olive-700 px-4 py-2 text-sm font-semibold text-white hover:bg-olive-800 transition-colors"
              >
                <Bell className="h-4 w-4" />
                Ενεργοποίηση ειδοποιήσεων
              </button>
            )}
          </div>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </section>
  )
}
