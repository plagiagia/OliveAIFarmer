'use client'

import PricingComparison from '@/components/pricing/PricingComparison'
import BrandLogo from '@/components/ui/BrandLogo'
import OliveIcon from '@/components/ui/OliveIcon'
import { Check, ChevronRight, FileText, Leaf, Wheat, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, type MouseEvent } from 'react'

function scrollToPricing() {
  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function handlePricingClick(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault()
  scrollToPricing()
  window.history.replaceState(null, '', '#pricing')
}

export default function LandingPage() {
  useEffect(() => {
    if (window.location.hash === '#pricing') {
      requestAnimationFrame(() => scrollToPricing())
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size="md" priority />
            <span className="text-xl font-bold text-olive-800">OliveIQ</span>
          </Link>
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
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[min(52vw,420px)] sm:h-[min(48vw,480px)]"
          aria-hidden
        >
          <Image
            src="/images/hero-landscape.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-bottom"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[min(52vw,420px)] bg-gradient-to-t from-white/40 via-transparent to-transparent sm:h-[min(48vw,480px)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-16 text-center sm:pb-24 sm:pt-20">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-olive-200 bg-white/90 px-4 py-1.5 text-sm text-olive-700 shadow-sm backdrop-blur-sm">
            <OliveIcon size="sm" className="shrink-0 text-olive-700" aria-hidden />
            <span>Για Έλληνες ελαιοπαραγωγούς</span>
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Ο ελαιώνας σας,{' '}
            <span className="text-olive-700">πάντα υπό έλεγχο</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-600">
            Παρακολουθήστε λιπάνσεις, ψεκασμούς, συγκομιδή και κόστος ελαιολάδου σε ένα
            μέρος. Ειδοποιήσεις δάκου, ψηφιακό ημερολόγιο αγρού, AI γεωπόνος — από οπουδήποτε.
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
              className="rounded-2xl border-2 border-olive-200 bg-white/90 px-7 py-4 text-lg font-semibold text-olive-700 shadow-sm backdrop-blur-sm hover:bg-olive-50 transition-colors"
            >
              Δείτε τιμές
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Δεν απαιτείται πιστωτική κάρτα · Δωρεάν για πάντα · 1 ελαιώνας
          </p>
        </div>
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
                icon: <Wheat className="h-7 w-7 text-amber-700" />,
                title: 'Συγκομιδές & έσοδα με μια ματιά',
                desc: 'Κάθε παράδοση στο ελαιοτριβείο καταγεγραμμένη: κιλά, τιμή, αξία. Σύγκριση με πέρσι, χωρίς τετράδια.',
              },
              {
                icon: <FileText className="h-7 w-7 text-blue-600" />,
                title: 'PDF ημερολόγιο για ΟΣΔΕ & λογιστή',
                desc: 'Εξαγωγή του ημερολογίου αγρού έτοιμη για επιδοτήσεις, ελέγχους και φορολογικά — με ένα κλικ.',
              },
              {
                icon: <Leaf className="h-7 w-7 text-green-700" />,
                title: 'AI Γεωπόνος',
                desc: 'Προτάσεις για τον δικό σας ελαιώνα από τα δικά σας δεδομένα: καιρός, εργασίες, συγκομιδές.',
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
      <PricingComparison className="py-24" />

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
