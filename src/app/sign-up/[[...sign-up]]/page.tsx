import { SignUp } from '@clerk/nextjs'
import WhopSignupTracker from '@/components/analytics/WhopSignupTracker'
import Link from 'next/link'

export const metadata = {
  title: 'Εγγραφή — OliveIQ',
}

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-olive-50 to-white px-4 py-12">
      <WhopSignupTracker />
      <SignUp />
      <p className="mt-6 max-w-md text-center text-xs text-gray-500">
        Με την εγγραφή αποδέχεστε τους{' '}
        <Link href="/legal/terms" className="text-olive-700 underline">Όρους Χρήσης</Link>{' '}
        και την{' '}
        <Link href="/legal/privacy" className="text-olive-700 underline">Πολιτική Απορρήτου</Link>.
      </p>
    </main>
  )
}
