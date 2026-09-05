'use client'

import { useState } from 'react'
import { trackProductEvent } from '@/lib/product-events'

const examples = [
  {
    id: 'alerts',
    label: 'Ειδοποίηση δάκου',
    title: 'Μάθετε πότε χρειάζεται έλεγχος',
    body: 'Παράδειγμα: Οι καιρικές συνθήκες ευνοούν τον δάκο. Ελέγξτε τις παγίδες και καταγράψτε τις παρατηρήσεις σας.',
    detail:
      'Η πραγματική εκτίμηση βασίζεται στο διαθέσιμο ιστορικό καιρού. Δεν επιβεβαιώνει προσβολή και δεν αντικαθιστά επιτόπιο έλεγχο.',
  },
  {
    id: 'advice',
    label: 'AI Γεωπόνος',
    title: 'Οι καταγραφές σας γίνονται αφετηρία για την επόμενη κίνηση',
    body: 'Παράδειγμα: Καταγράψατε πρόσφατα άρδευση. Πριν την επόμενη, ελέγξτε την υγρασία του εδάφους και την πρόγνωση βροχής.',
    detail:
      'Στο Pro οι προτάσεις χρησιμοποιούν τα διαθέσιμα στοιχεία του δικού σας ελαιώνα. Εδώ βλέπετε ενδεικτικό κείμενο, όχι προσωπική γεωπονική συμβουλή.',
  },
  {
    id: 'report',
    label: 'Ημερολόγιο & κόστος',
    title: 'Δείτε τι καταγράψατε και πόσο κόστισε',
    body: 'Παράδειγμα ημερολογίου: Επιθεώρηση · Άρδευση · Συγκομιδή. Οι δικές σας καταγραφές εξάγονται σε PDF για να τις μοιραστείτε.',
    detail:
      'Το κόστος ανά λίτρο χρειάζεται καταγεγραμμένα έξοδα και ποσότητα παραγόμενου ελαιολάδου. Ελλιπή στοιχεία δίνουν ελλιπή εικόνα.',
  },
] as const

export default function ProPreview() {
  const [selected, setSelected] = useState(0)
  const example = examples[selected]
  return (
    <section
      aria-label="Παραδείγματα Pro"
      className="mt-8 rounded-2xl border border-olive-200 bg-olive-50/50 p-5 sm:p-6"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-olive-700">
        ΠΑΡΑΔΕΙΓΜΑΤΑ · ΟΧΙ ΔΕΔΟΜΕΝΑ ΤΟΥ ΕΛΑΙΩΝΑ ΣΑΣ
      </p>
      <h3 className="mt-2 text-xl font-semibold text-gray-900">
        Δείτε τι προσθέτει το Pro στην καθημερινότητά σας
      </h3>
      <div className="my-5 flex flex-wrap gap-2" aria-label="Επιλογή παραδείγματος">
        {examples.map((item, index) => (
          <button
            key={item.id}
            aria-pressed={selected === index}
            onClick={() => {
              setSelected(index)
              trackProductEvent('ProPreviewViewed', { example: item.id })
            }}
            className={`min-h-[44px] rounded-xl border px-3 py-2 text-sm font-semibold ${selected === index ? 'border-olive-700 bg-olive-700 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-olive-400'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div aria-live="polite" className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="font-semibold text-gray-900">{example.title}</h4>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">{example.body}</p>
        <p className="mt-4 border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-500">
          {example.detail}
        </p>
      </div>
    </section>
  )
}
