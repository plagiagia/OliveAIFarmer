import PricingPageContent from '@/components/pricing/PricingPageContent'
import ProductSchema from '@/components/pricing/ProductSchema'

const title = 'Τιμές για τη φροντίδα των ελαιώνων — OliveIQ'
const description = 'Δείτε το δωρεάν ημερολόγιο για έναν ελαιώνα και το Pro με ειδοποιήσεις δάκου, AI γεωπόνο και εξαγωγή ημερολογίου σε PDF.'

export const metadata = {
  alternates: { canonical: '/pricing' },
  title,
  description,
  openGraph: {
    title,
    description,
    url: 'https://www.oliveiq.gr/pricing',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/opengraph-image'],
  },
}

export default function PricingPage() {
  return <><ProductSchema /><PricingPageContent /></>
}
