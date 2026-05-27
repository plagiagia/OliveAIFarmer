'use client'

import PricingComparison from '@/components/pricing/PricingComparison'
import { SignedIn, SignedOut } from '@clerk/nextjs'
import { ArrowLeft, Leaf } from 'lucide-react'
import Link from 'next/link'

export default function PricingPageContent() {
  return (
    <div className="min-h-screen bg-white">
      <SignedOut>
        <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-olive-800 hover:text-olive-900">
              <Leaf className="h-6 w-6 text-olive-700" />
              <span className="text-xl font-bold">OliveIQ</span>
            </Link>
            <div className="flex items-center gap-3">
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
      </SignedOut>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <SignedIn>
          <Link
            href="/dashboard/settings#subscription"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-olive-700 hover:text-olive-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Επιστροφή στις ρυθμίσεις
          </Link>
        </SignedIn>

        <SignedOut>
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-olive-700 hover:text-olive-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Επιστροφή στην αρχική
          </Link>
        </SignedOut>

        <PricingComparison />
      </div>
    </div>
  )
}
