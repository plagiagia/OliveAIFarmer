import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
} 