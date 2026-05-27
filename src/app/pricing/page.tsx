import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Τιμολόγηση — OliveIQ',
  description: 'Δωρεάν για 1 ελαιώνα. Μικρός Ελαιώνας €14, Παραγωγός €34.',
}

export default function PricingPage() {
  redirect('/#pricing')
}
