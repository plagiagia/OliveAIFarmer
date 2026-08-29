import { ClerkProvider, SignedIn, SignedOut } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { OfflineIndicator } from '@/components/ui/OfflineIndicator'
import BrandLogo from '@/components/ui/BrandLogo'
import BottomNav from '@/components/navigation/BottomNav'
import UserMenuButton from '@/components/auth/UserMenuButton'
import Link from 'next/link'

const inter = Inter({ 
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'OliveIQ — Ο ελαιώνας σας, πάντα υπό έλεγχο',
  description:
    'Παρακολουθήστε λιπάνσεις, ψεκασμούς, συγκομιδή και κόστος ελαιολάδου σε ένα μέρος. Ειδοποιήσεις δάκου, AI γεωπόνος, ημερολόγιο αγρού.',
  keywords: ['ελαιόδεντρα', 'ελαιώνας', 'αγροτικό ημερολόγιο', 'διαχείριση καλλιέργειας', 'ελληνική γεωργία'],
  authors: [{ name: 'OliveIQ' }],
  creator: 'OliveIQ',
  publisher: 'OliveIQ',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'OliveIQ — Ο ελαιώνας σας, πάντα υπό έλεγχο',
    description:
      'Παρακολουθήστε λιπάνσεις, ψεκασμούς, συγκομιδή και κόστος ελαιολάδου σε ένα μέρος. Ειδοποιήσεις δάκου, AI γεωπόνος, ημερολόγιο αγρού.',
    url: 'https://oliveiq.gr',
    siteName: 'OliveIQ',
    locale: 'el_GR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OliveIQ — Ο ελαιώνας σας, πάντα υπό έλεγχο',
    description:
      'Παρακολουθήστε λιπάνσεις, ψεκασμούς, συγκομιδή και κόστος ελαιολάδου σε ένα μέρος. Ειδοποιήσεις δάκου, AI γεωπόνος, ημερολόγιο αγρού.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'OliveIQ',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#2E7D32',
    'theme-color': '#2E7D32',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="el" className={inter.variable}>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
          <link rel="icon" href="/images/logo-monogram.png" type="image/png" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        </head>
        <body className={`${inter.className} greek-font antialiased`}>
          {/* Show auth page only when signed out */}
          <SignedOut>
            {children}
          </SignedOut>
          
          {/* Show app content when signed in */}
          <SignedIn>
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 pt-safe">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-3 text-olive-800 hover:text-olive-900 transition-colors">
                    <BrandLogo size="lg" />
                    <h1 className="text-lg sm:text-xl font-bold truncate">OliveIQ</h1>
                  </Link>
                  <UserMenuButton />
                </div>
              </div>
            </header>
            {children}
            <BottomNav />
            <OfflineIndicator />
          </SignedIn>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  )
} 
