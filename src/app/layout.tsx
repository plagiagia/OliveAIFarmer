import { ClerkProvider, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { OfflineIndicator } from '@/components/ui/OfflineIndicator'

const inter = Inter({ 
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'ΕλαιοLog - Ψηφιακό Ημερολόγιο Ελαιοδέντρων',
  description: 'Το ψηφιακό ημερολόγιο που βοηθάει τους Έλληνες αγρότες να διαχειριστούν τον ελαιώνα τους αποτελεσματικά.',
  keywords: ['ελαιόδεντρα', 'ελαιώνας', 'αγροτικό ημερολόγιο', 'διαχείριση καλλιέργειας', 'ελληνική γεωργία'],
  authors: [{ name: 'OliveLog Team' }],
  creator: 'OliveLog',
  publisher: 'OliveLog',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'ΕλαιοLog - Ψηφιακό Ημερολόγιο Ελαιοδέντρων',
    description: 'Το ψηφιακό ημερολόγιο που βοηθάει τους Έλληνες αγρότες να διαχειριστούν τον ελαιώνα τους αποτελεσματικά.',
    url: 'https://olivelog.gr',
    siteName: 'ΕλαιοLog',
    locale: 'el_GR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ΕλαιοLog - Ψηφιακό Ημερολόγιο Ελαιοδέντρων',
    description: 'Το ψηφιακό ημερολόγιο που βοηθάει τους Έλληνες αγρότες να διαχειριστούν τον ελαιώνα τους αποτελεσματικά.',
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
    'apple-mobile-web-app-title': 'ΕλαιοLog',
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
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        </head>
        <body className={`${inter.className} greek-font antialiased`}>
          {/* Show auth page only when signed out */}
          <SignedOut>
            {children}
          </SignedOut>
          
          {/* Show app content when signed in */}
          <SignedIn>
            <header className="bg-white border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-olive-600" viewBox="0 0 24 24" fill="currentColor">
                      <ellipse cx="12" cy="12" rx="5" ry="8" transform="rotate(-30 12 12)" />
                      <path d="M12 4 Q14 2 16 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                    </svg>
                    <h1 className="text-xl font-bold text-olive-800">ΕλαιοLog</h1>
                  </div>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10",
                        userButtonPopoverCard: "shadow-lg",
                        userButtonPopoverActionButton: "text-olive-700 hover:bg-olive-50"
                      }
                    }}
                    showName={true}
                  />
                </div>
              </div>
            </header>
            {children}
            <OfflineIndicator />
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  )
} 