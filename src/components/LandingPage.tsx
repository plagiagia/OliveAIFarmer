'use client'

import type { Plan, PlanConfig } from '@/lib/plans'
import { PLANS, VIEWER_SEAT_PRICE_MONTHLY } from '@/lib/plans'
import { Check, ChevronRight, Globe, Leaf, Satellite, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, type MouseEvent } from 'react'
import OliveIcon from '@/components/ui/OliveIcon'

function scrollToPricing() {
  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function handlePricingClick(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault()
  scrollToPricing()
  window.history.replaceState(null, '', '#pricing')
}

const PLAN_ORDER = ['FREE', 'GROWER', 'PRODUCER'] as const satisfies readonly Plan[]
type LandingPlan = (typeof PLAN_ORDER)[number]

const FEATURE_LABELS: Record<string, string> = {
  aiGeoponos: 'AI Γεωπόνος (GPT-4)',
  satellite: 'Δορυφορικό NDVI (Sentinel-2)',
  oliveFlyAlerts: 'Ειδοποιήσεις Δάκου',
  costPerLiter: 'Ανάλυση Κόστους/Λίτρο',
  multiGrove: 'Απεριόριστοι ελαιώνες',
  agronomistSharing: 'Κοινή Πρόσβαση Γεωπόνου',
  exportPdf: 'Εξαγωγή PDF',
  viewerSeats: `Θέσεις Απόδημου Θεατή (+€${VIEWER_SEAT_PRICE_MONTHLY}/θέση)`,
}

/** Features shown on landing pricing cards. */
const LANDING_FEATURE_KEYS: Array<keyof PlanConfig['features']> = [
  'aiGeoponos',
  'satellite',
  'oliveFlyAlerts',
  'costPerLiter',
  'multiGrove',
  'agronomistSharing',
  'exportPdf',
  'viewerSeats',
]

const PLAN_HIGHLIGHTS: Record<LandingPlan, string[]> = {
  FREE: ['1 ελαιώνας', 'Ψηφιακό ημερολόγιο', 'Καταγραφή δραστηριοτήτων'],
  GROWER: ['έως 3 ελαιώνες', 'Ειδοποιήσεις Δάκου', 'AI Γεωπόνος', 'Εξαγωγή PDF'],
  PRODUCER: ['Απεριόριστοι ελαιώνες', 'NDVI Sentinel-2', 'Κόστος ανά λίτρο', 'Θέσεις Απόδημου', 'Κοινή πρόσβαση γεωπόνου'],
}

export default function LandingPage() {
  const pathname = usePathname()

  useEffect(() => {
    if (window.location.hash === '#pricing' || pathname === '/pricing') {
      requestAnimationFrame(() => scrollToPricing())
    }
  }, [pathname])

  return (
    <div className="min-h-screen bg-white">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-olive-700" />
            <span className="text-xl font-bold text-olive-800">OliveIQ</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="#pricing"
              onClick={handlePricingClick}
              className="hidden text-sm text-gray-600 hover:text-olive-700 sm:block"
            >
              Τιμολόγηση
            </Link>
            <Link
              href="/sign-in"
              className="rounded-xl border border-olive-200 px-4 py-2 text-sm font-medium text-olive-700 hover:bg-olive-50 transition-colors"
            >
              Σύνδεση
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl bg-olive-700 px-4 py-2 text-sm font-medium text-white hover:bg-olive-800 transition-colors"
            >
              Ξεκινήστε Δωρεάν
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-olive-200 bg-olive-50 px-4 py-1.5 text-sm text-olive-700">
          <OliveIcon size="sm" className="shrink-0 text-olive-700" aria-hidden />
          <span>Για Έλληνες ελαιοπαραγωγούς & απόδημους ιδιοκτήτες</span>
        </div>
        <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
          Ο ελαιώνας σας,{' '}
          <span className="text-olive-700">πάντα υπό έλεγχο</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-600">
          Παρακολουθήστε λιπάνσεις, ψεκασμούς, συγκομιδή και κόστος ελαιολάδου σε ένα
          μέρος. AI γεωπόνος, δορυφορικός χάρτης NDVI, ειδοποιήσεις δάκου — από οπουδήποτε.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/sign-up"
            className="flex items-center gap-2 rounded-2xl bg-olive-700 px-7 py-4 text-lg font-semibold text-white shadow-lg hover:bg-olive-800 transition-colors"
          >
            Ξεκινήστε Δωρεάν
            <ChevronRight className="h-5 w-5" />
          </Link>
          <Link
            href="#pricing"
            onClick={handlePricingClick}
            className="rounded-2xl border-2 border-olive-200 px-7 py-4 text-lg font-semibold text-olive-700 hover:bg-olive-50 transition-colors"
          >
            Δείτε τιμές
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-500">Δεν απαιτείται πιστωτική κάρτα · Δωρεάν για πάντα · 1 ελαιώνας</p>
      </section>

      {/* ── VALUE PROPS ── */}
      <section className="bg-olive-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Γιατί οι παραγωγοί επιλέγουν το OliveIQ
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Zap className="h-7 w-7 text-amber-600" />,
                title: 'Ειδοποιήσεις Δάκου σε πραγματικό χρόνο',
                desc: 'Καιρικά δεδομένα + ιστορικό μολύνσεων → ειδοποίηση πριν ο δάκος καταστρέψει την παραγωγή σας.',
              },
              {
                icon: <Satellite className="h-7 w-7 text-blue-600" />,
                title: 'Δορυφορικός χάρτης NDVI',
                desc: 'Sentinel-2 κάθε 5 ημέρες. Δείτε ποια τμήματα του ελαιώνα "πονούν" χωρίς να πάτε επί τόπου.',
              },
              {
                icon: <Globe className="h-7 w-7 text-olive-700" />,
                title: 'Πρόσβαση απόδημων ιδιοκτητών',
                desc: 'Προσκαλέστε τον γεωπόνο ή τον αδερφό σας στο εξωτερικό. Πλήρης ορατότητα, χωρίς τηλεφωνήματα.',
              },
              {
                icon: <Leaf className="h-7 w-7 text-green-700" />,
                title: 'AI Γεωπόνος 24/7',
                desc: 'Βασισμένος στις οδηγίες του ΥΠΑΑΤ και στη βιβλιογραφία Olea europaea. Ρωτήστε οτιδήποτε.',
              },
              {
                icon: <Check className="h-7 w-7 text-olive-700" />,
                title: 'Ψηφιακό Ημερολόγιο Αγροτεμαχίου',
                desc: 'Αντικαταστήστε το χαρτάκι. Ψεκασμοί, πότισμα, λίπανση, κλάδεμα — όλα καταγεγραμμένα.',
              },
              {
                icon: <Zap className="h-7 w-7 text-purple-600" />,
                title: 'Κόστος ανά λίτρο ελαιολάδου',
                desc: 'Αυτόματη ανάλυση: εισροές + συγκομιδή + ελαιοτριβείο = κέρδος ανά λίτρο. ESPA-ready εκθέσεις.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-3">{item.icon}</div>
                <h3 className="mb-2 font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Τιμολόγηση</h2>
            <p className="text-gray-600">Ξεκινήστε δωρεάν · Αναβαθμίστε όταν μεγαλώσετε</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PLAN_ORDER.map((plan) => {
              const cfg = PLANS[plan]
              const isPopular = plan === 'PRODUCER'
              return (
                <div
                  key={plan}
                  className={`relative flex flex-col rounded-2xl border-2 p-6 ${
                    isPopular
                      ? 'border-olive-600 shadow-xl'
                      : 'border-gray-200'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-olive-700 px-3 py-0.5 text-xs font-bold text-white">
                      Πιο Δημοφιλές
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{cfg.nameEl}</h3>
                    <div className="mt-2 flex items-end gap-1">
                      <span className="text-4xl font-extrabold text-gray-900">
                        {cfg.priceMonthly === 0 ? 'Δωρεάν' : `€${cfg.priceMonthly}`}
                      </span>
                      {cfg.priceMonthly > 0 && (
                        <span className="mb-1 text-gray-500">/μήνα</span>
                      )}
                    </div>
                  </div>

                  {/* Included features only for Free; highlights + comparison for paid */}
                  <ul className={`space-y-2 ${plan === 'FREE' ? 'mb-8 flex-1' : 'mb-6'}`}>
                    {PLAN_HIGHLIGHTS[plan].map((h) => (
                      <li key={h} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-olive-600" />
                        {h}
                      </li>
                    ))}
                  </ul>

                  {plan !== 'FREE' && (
                    <ul className="mb-8 space-y-2 border-t pt-4">
                      {LANDING_FEATURE_KEYS.map((f) => (
                        <li key={f} className={`flex items-start gap-2 text-xs ${cfg.features[f] ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                          {cfg.features[f]
                            ? <Check className="mt-0.5 h-3 w-3 shrink-0 text-olive-600" />
                            : <span className="mt-0.5 h-3 w-3 shrink-0">–</span>
                          }
                          {FEATURE_LABELS[f] ?? f}
                        </li>
                      ))}
                    </ul>
                  )}

                  <Link
                    href={cfg.priceMonthly === 0 ? '/sign-up' : '/sign-up'}
                    className={`mt-auto rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                      isPopular
                        ? 'bg-olive-700 text-white hover:bg-olive-800'
                        : 'border-2 border-olive-200 text-olive-700 hover:bg-olive-50'
                    }`}
                  >
                    {cfg.priceMonthly === 0 ? 'Ξεκινήστε Δωρεάν' : 'Επιλογή Πλάνου'}
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Viewer seat add-on callout */}
          <div className="mt-10 rounded-2xl border border-dashed border-olive-300 bg-olive-50 p-6 text-center">
            <p className="font-semibold text-olive-800">
              🌍 Θέση Απόδημου Θεατή — +€{VIEWER_SEAT_PRICE_MONTHLY}/μήνα ανά πρόσκληση
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Δώστε read-only πρόσβαση σε συγγενή ή γεωπόνο στο εξωτερικό. Διαθέσιμο στο πλάνο Παραγωγός.
            </p>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="mb-10 text-lg text-gray-600">
            Χτισμένο από παραγωγό Χαλκιδικής · Σχεδιασμένο για τους{' '}
            <strong>450.000 ελαιοπαραγωγούς</strong> της Ελλάδας
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { stat: '120M', label: 'Ελαιόδεντρα στην Ελλάδα' },
              { stat: '450K', label: 'Οικογένειες που εξαρτώνται από το ελαιόλαδο' },
              { stat: '62K', label: 'Παραγωγοί μόνο στη Χαλκιδική' },
            ].map((s) => (
              <div key={s.stat} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="text-4xl font-extrabold text-olive-700">{s.stat}</div>
                <div className="mt-1 text-sm text-gray-600">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-olive-700 py-20 text-center text-white">
        <h2 className="mb-4 text-3xl font-bold">Έτοιμοι να ψηφιοποιήσετε τον ελαιώνα σας;</h2>
        <p className="mb-8 text-olive-100">
          Δωρεάν για πάντα για μικρούς ελαιώνες. Χωρίς πιστωτική κάρτα.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-olive-800 shadow-lg hover:bg-olive-50 transition-colors"
        >
          Ξεκινήστε Τώρα <ChevronRight className="h-5 w-5" />
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} OliveIQ · Χαλκιδική, Ελλάδα</p>
        <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/sign-in" className="hover:text-olive-700">Σύνδεση</Link>
          <Link href="/sign-up" className="hover:text-olive-700">Εγγραφή</Link>
          <Link href="/legal/privacy" className="hover:text-olive-700">Πολιτική Απορρήτου</Link>
          <Link href="/legal/terms" className="hover:text-olive-700">Όροι Χρήσης</Link>
          <Link href="/legal/imprint" className="hover:text-olive-700">Επικοινωνία</Link>
        </div>
      </footer>
    </div>
  )
}
