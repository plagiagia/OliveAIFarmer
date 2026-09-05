import Link from 'next/link'
import ProPreview from '@/components/pricing/ProPreview'

export const metadata = {
  title: 'Δείτε το OliveIQ στην πράξη',
  description: 'Ένα ενδεικτικό εβδομαδιαίο πρόγραμμα ελαιώνα και παραδείγματα του OliveIQ Pro.',
}

export default function DemoPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 pb-28 sm:py-12">
      <Link
        href="/dashboard"
        className="inline-block min-h-[44px] py-2 text-sm font-semibold text-olive-700"
      >
        Επιστροφή στον λογαριασμό σας →
      </Link>
      <p className="mt-6 text-xs font-bold uppercase tracking-wide text-olive-700">
        ΔΟΚΙΜΑΣΤΙΚΗ ΠΕΡΙΗΓΗΣΗ · ΕΝΔΕΙΚΤΙΚΑ ΣΤΟΙΧΕΙΑ
      </p>
      <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Η επόμενη επίσκεψη στον ελαιώνα, οργανωμένη.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
        Ένα παράδειγμα του τρόπου που μπορείτε να οργανώσετε τη δουλειά σας. Τίποτα από αυτή τη
        σελίδα δεν αποθηκεύεται στον λογαριασμό σας.
      </p>
      <section className="mt-8 overflow-hidden rounded-2xl border border-olive-200 bg-white">
        <div className="grid md:grid-cols-[1fr_1.5fr]">
          <div className="bg-olive-50 p-6">
            <p className="text-sm font-semibold text-olive-700">
              Ελαιώνας στη Μεσσηνία · Παράδειγμα
            </p>
            <h2 className="mt-2 text-2xl font-bold text-olive-900">Η εβδομάδα σας</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Οι προγραμματισμένες εργασίες και οι καταγραφές συγκεντρώνονται σε ένα μέρος.
            </p>
          </div>
          <ul className="divide-y divide-gray-100 px-6">
            <li className="py-5">
              <p className="text-xs font-semibold text-olive-700">ΠΡΟΓΡΑΜΜΑΤΙΣΜΕΝΗ · ΤΡΙΤΗ</p>
              <h3 className="mt-1 font-semibold text-gray-900">Επιθεώρηση ελαιώνα</h3>
              <p className="mt-1 text-sm text-gray-500">Καταγραφή παρατηρήσεων από την επίσκεψη</p>
            </li>
            <li className="py-5">
              <p className="text-xs font-semibold text-olive-700">ΟΛΟΚΛΗΡΩΜΕΝΗ · ΔΕΥΤΕΡΑ</p>
              <h3 className="mt-1 font-semibold text-gray-900">Έλεγχος αρδευτικού δικτύου</h3>
              <p className="mt-1 text-sm text-gray-500">
                Το ιστορικό παραμένει διαθέσιμο για την επόμενη σεζόν
              </p>
            </li>
          </ul>
        </div>
      </section>
      <ProPreview />
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/dashboard/farms/new"
          className="min-h-[44px] rounded-xl bg-olive-700 px-5 py-3 font-semibold text-white hover:bg-olive-800"
        >
          Προσθέστε τον δικό σας ελαιώνα
        </Link>
        <Link
          href="/pricing"
          className="min-h-[44px] rounded-xl border border-olive-200 px-5 py-3 font-semibold text-olive-700 hover:bg-olive-50"
        >
          Σύγκριση δωρεάν & Pro
        </Link>
      </div>
    </main>
  )
}
