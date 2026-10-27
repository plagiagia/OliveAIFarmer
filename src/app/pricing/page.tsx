import PricingPageContent from '@/components/pricing/PricingPageContent'
import ProductSchema from '@/components/pricing/ProductSchema'

export const metadata = {
  title: 'Τιμολόγηση — OliveIQ',
  description: 'Δωρεάν για 1 ελαιώνα. Pro €49/έτος — ειδοποιήσεις δάκου, AI γεωπόνος, PDF ημερολόγιο.',
}

export default function PricingPage() {
  return <><ProductSchema /><PricingPageContent /></>
}
