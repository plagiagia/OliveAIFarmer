'use client'

import PricingComparison from '@/components/pricing/PricingComparison'
import BrandLogo from '@/components/ui/BrandLogo'
import OliveIcon from '@/components/ui/OliveIcon'
import {
  BarChart3,
  BellRing,
  BookOpen,
  ChevronRight,
  ClipboardList,
  CloudSun,
  FileText,
  MapPin,
  Sparkles,
  TrendingUp,
  Wheat,
} from 'lucide-react'
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

const FEATURES = [
  {
    icon: BellRing,
    chip: 'bg-amber-100 text-amber-700',
    title: 'Ειδοποιήσεις Δάκου σε πραγματικό χρόνο',
    desc: 'Καιρικά δεδομένα + ιστορικό μολύνσεων → ειδοποίηση πριν ο δάκος καταστρέψει την παραγωγή σας.',
  },
  {
    icon: Wheat,
    chip: 'bg-earth-200 text-earth-800',
    title: 'Συγκομιδές & έσοδα με μια ματιά',
    desc: 'Κάθε παράδοση στο ελαιοτριβείο καταγεγραμμένη: κιλά, τιμή, αξία. Σύγκριση με πέρσι, χωρίς τετράδια.',
  },
  {
    icon: FileText,
    chip: 'bg-blue-100 text-blue-700',
    title: 'PDF ημερολόγιο για ΟΣΔΕ & λογιστή',
    desc: 'Εξαγωγή του ημερολογίου αγρού έτοιμη για επιδοτήσεις, ελέγχους και φορολογικά — με ένα κλικ.',
  },
  {
    icon: Sparkles,
    chip: 'bg-green-100 text-green-700',
    title: 'AI Γεωπόνος',
    desc: 'Προτάσεις για τον δικό σας ελαιώνα από τα δικά σας δεδομένα: καιρός, εργασίες, συγκομιδές.',
  },
  {
    icon: BookOpen,
    chip: 'bg-olive-100 text-olive-800',
    title: 'Ψηφιακό Ημερολόγιο Αγροτεμαχίου',
    desc: 'Αντικαταστήστε το χαρτάκι. Ψεκασμοί, πότισμα, λίπανση, κλάδεμα — όλα καταγεγραμμένα.',
  },
  {
    icon: BarChart3,
    chip: 'bg-purple-100 text-purple-700',
    title: 'Κόστος ανά λίτρο ελαιολάδου',
    desc: 'Αυτόματη ανάλυση: εισροές + συγκομιδή + ελαιοτριβείο = κέρδος ανά λίτρο. ESPA-ready εκθέσεις.',
  },
]

const STEPS = [
  {
    icon: MapPin,
    title: 'Προσθέστε τον ελαιώνα σας',
    desc: 'Τοποθεσία, δέντρα, ποικιλία — έτοιμο σε 2 λεπτά.',
  },
  {
    icon: ClipboardList,
    title: 'Καταγράψτε τις εργασίες',
    desc: 'Ψεκασμοί, λίπανση, συγκομιδή — από το κινητό, μέσα στο χωράφι.',
  },
  {
    icon: TrendingUp,
    title: 'Δείτε καθαρή εικόνα',
    desc: 'Κόστος, έσοδα, ειδοποιήσεις δάκου και προτάσεις από τον AI γεωπόνο.',
  },
]

/** Stylized product preview — a mini dashboard rendered with CSS/SVG. */
function AppPreview() {
  const bars = [34, 48, 40, 58, 52, 78]
  return (
    <div className="relative mx-auto mt-14 max-w-3xl px-2 sm:mt-16">
      {/* Floating AI suggestion card */}
      <div className="absolute -top-6 z-20 hidden w-60 animate-float rounded-2xl border border-green-100 bg-white p-4 text-left shadow-xl xl:-right-52 xl:block">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100">
            <Sparkles className="h-4 w-4 text-green-700" />
          </span>
          <span className="text-sm font-semibold text-gray-900">AI Γεωπόνος</span>
        </div>
        <p className="text-xs leading-relaxed text-gray-600">
          Με βάση τη βροχόπτωση της εβδομάδας, αναβάλετε το πότισμα έως την Πέμπτη.
        </p>
      </div>

      {/* Floating weather chip */}
      <div className="absolute top-28 z-20 hidden animate-float items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-xl [animation-delay:1.5s] xl:-left-36 xl:flex">
        <CloudSun className="h-6 w-6 text-amber-500" />
        <div className="text-left">
          <div className="text-sm font-semibold text-gray-900">24°C</div>
          <div className="text-[11px] text-gray-500">Χαλκιδική</div>
        </div>
      </div>

      {/* Browser frame */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-2xl shadow-olive-900/10">
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
          <span className="ml-3 hidden rounded-md bg-white px-3 py-0.5 text-xs text-gray-400 sm:block">
            oliveiq.app/dashboard
          </span>
        </div>

        <div className="p-4 sm:p-6">
          {/* Greeting + farm badge */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-gray-900 sm:text-base">
                Καλημέρα, Δημήτρη 👋
              </div>
              <div className="text-xs text-gray-500">Δευτέρα, 12 Οκτωβρίου</div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-olive-50 px-3 py-1 text-xs font-medium text-olive-800">
              <MapPin className="h-3.5 w-3.5" />
              Ελαιώνας Χαλκιδικής · 240 δέντρα
            </span>
          </div>

          {/* Dakos alert */}
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <div className="text-xs font-semibold text-amber-900 sm:text-sm">
                Προειδοποίηση δάκου
              </div>
              <div className="text-[11px] text-amber-800 sm:text-xs">
                Ευνοϊκές συνθήκες τις επόμενες 3 ημέρες — προγραμματίστε δολωματικό ψεκασμό.
              </div>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'Συγκομιδή', value: '3.240 kg', delta: '+12%' },
              { label: 'Έσοδα', value: '4.870 €', delta: '+8%' },
              { label: 'Κόστος / λίτρο', value: '3,15 €', delta: '−5%' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 sm:p-3">
                <div className="text-[10px] text-gray-500 sm:text-xs">{s.label}</div>
                <div className="text-sm font-bold text-gray-900 sm:text-lg">{s.value}</div>
                <div className="text-[10px] font-medium text-olive-700 sm:text-xs">
                  {s.delta} από πέρσι
                </div>
              </div>
            ))}
          </div>

          {/* Production bar chart */}
          <div className="rounded-xl border border-gray-100 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 sm:text-sm">
                Παραγωγή ανά έτος
              </span>
              <span className="text-[10px] text-gray-400 sm:text-xs">2020 – 2025</span>
            </div>
            <div className="flex h-20 items-end gap-2 sm:h-24 sm:gap-3">
              {bars.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`flex-1 rounded-t-md ${
                    i === bars.length - 1 ? 'bg-olive-600' : 'bg-olive-600/25'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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
      <section className="relative overflow-hidden bg-gradient-to-b from-earth-50 via-white to-olive-50/60">
        {/* Soft decorative glows */}
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[44rem] -translate-x-1/2 rounded-full bg-olive-500/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-32 top-40 h-72 w-72 rounded-full bg-earth-400/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[min(52vw,420px)] opacity-60 sm:h-[min(48vw,480px)]"
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

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:pb-28 sm:pt-20">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-olive-200 bg-white/90 px-4 py-1.5 text-sm text-olive-700 shadow-sm backdrop-blur-sm">
            <OliveIcon size="sm" className="shrink-0 text-olive-700" aria-hidden />
            <span>Για Έλληνες ελαιοπαραγωγούς</span>
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Ο ελαιώνας σας,{' '}
            <span className="bg-gradient-to-r from-olive-700 to-olive-500 bg-clip-text text-transparent">
              πάντα υπό έλεγχο
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-600">
            Παρακολουθήστε λιπάνσεις, ψεκασμούς, συγκομιδή και κόστος ελαιολάδου σε ένα
            μέρος. Ειδοποιήσεις δάκου, ψηφιακό ημερολόγιο αγρού, AI γεωπόνος — από οπουδήποτε.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/sign-up"
              className="flex items-center gap-2 rounded-2xl bg-olive-700 px-7 py-4 text-lg font-semibold text-white shadow-lg shadow-olive-700/25 hover:bg-olive-800 hover:shadow-xl hover:shadow-olive-700/30 transition-all"
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

          <AppPreview />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-3 text-center text-3xl font-bold text-gray-900">
            Απλό σαν τρία βήματα
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-gray-600">
            Φτιαγμένο για το χωράφι, όχι για το γραφείο. Χωρίς εκπαίδευση, χωρίς εγχειρίδια.
          </p>
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div
                    className="absolute left-[calc(50%+3rem)] top-8 hidden h-px w-[calc(100%-6rem)] border-t-2 border-dashed border-olive-200 sm:block"
                    aria-hidden
                  />
                )}
                <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-olive-50 ring-1 ring-olive-200">
                  <step.icon className="h-7 w-7 text-olive-700" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-olive-700 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mb-1.5 font-semibold text-gray-900">{step.title}</h3>
                <p className="mx-auto max-w-xs text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUE PROPS ── */}
      <section className="bg-gradient-to-b from-olive-50 to-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-3 text-center text-3xl font-bold text-gray-900">
            Γιατί οι παραγωγοί επιλέγουν το OliveIQ
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-gray-600">
            Όλα όσα χρειάζεται ο ελαιώνας σας — σε μία εφαρμογή.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-olive-200 hover:shadow-lg"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${item.chip} transition-transform group-hover:scale-110`}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <PricingComparison className="py-24" />

      {/* ── SOCIAL PROOF ── */}
      <section className="relative overflow-hidden bg-gray-50 py-20">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-olive-500/5 blur-2xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
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
              <div
                key={s.stat}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="bg-gradient-to-br from-olive-700 to-olive-500 bg-clip-text text-4xl font-extrabold text-transparent">
                  {s.stat}
                </div>
                <div className="mt-1 text-sm text-gray-600">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-olive-800 via-olive-700 to-olive-900 py-20 text-center text-white">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/5 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-olive-500/15 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-2xl px-4">
          <OliveIcon size="lg" className="mx-auto mb-6 text-olive-100/80" aria-hidden />
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Έτοιμοι να ψηφιοποιήσετε τον ελαιώνα σας;
          </h2>
          <p className="mb-8 text-olive-100">
            Δωρεάν για πάντα για μικρούς ελαιώνες. Χωρίς πιστωτική κάρτα.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-olive-800 shadow-lg hover:bg-olive-50 transition-colors"
          >
            Ξεκινήστε Τώρα <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t py-10 text-center text-sm text-gray-500">
        <div className="mb-4 flex items-center justify-center gap-2">
          <BrandLogo size="sm" />
          <span className="font-semibold text-gray-700">OliveIQ</span>
        </div>
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
