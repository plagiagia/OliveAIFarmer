'use client'

import { useClerk } from '@clerk/nextjs'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const CONFIRM_WORD = 'ΔΙΑΓΡΑΦΗ'

export default function DeleteAccountSection() {
  const router = useRouter()
  const { signOut } = useClerk()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canConfirm = typed === CONFIRM_WORD && !submitting

  const handleDelete = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Αποτυχία διαγραφής.')
      }
      try {
        await signOut()
      } catch {
        // Clerk session already invalid because we deleted the user server-side.
      }
      router.replace('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία διαγραφής.')
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-10 rounded-2xl border-2 border-red-200 bg-red-50/50 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
        <div className="flex-1">
          <h2 className="text-lg font-bold text-red-900">Διαγραφή Λογαριασμού</h2>
          <p className="mt-1 text-sm text-red-800">
            Η ενέργεια αυτή είναι μόνιμη. Διαγράφονται οριστικά: όλοι οι ελαιώνες
            σας, οι δραστηριότητες, οι συγκομιδές, τα δορυφορικά δεδομένα,
            καθώς και ο λογαριασμός σύνδεσής σας. Δεν μπορεί να αναιρεθεί.
          </p>
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
            >
              Θέλω να διαγράψω τον λογαριασμό μου
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-red-900">
                Πληκτρολογήστε <code className="rounded bg-red-100 px-1 font-mono">{CONFIRM_WORD}</code> για επιβεβαίωση:
              </label>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                className="w-full max-w-xs rounded-lg border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder={CONFIRM_WORD}
              />
              {error && (
                <p className="text-sm text-red-700">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={!canConfirm}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Οριστική Διαγραφή
                </button>
                <button
                  onClick={() => { setOpen(false); setTyped(''); setError(null) }}
                  disabled={submitting}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Άκυρο
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
