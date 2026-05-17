import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-olive-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Επιστροφή
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/legal/privacy" className="text-gray-600 hover:text-olive-700">Απόρρητο</Link>
            <Link href="/legal/terms" className="text-gray-600 hover:text-olive-700">Όροι</Link>
            <Link href="/legal/imprint" className="text-gray-600 hover:text-olive-700">Επικοινωνία</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <article className="space-y-6 text-gray-700 leading-relaxed">
          {children}
        </article>
      </main>
    </div>
  )
}
