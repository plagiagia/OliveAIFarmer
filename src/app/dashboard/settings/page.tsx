import DeleteAccountSection from '@/components/settings/DeleteAccountSection'
import PushNotificationSection from '@/components/settings/PushNotificationSection'
import SubscriptionSection from '@/components/settings/SubscriptionSection'
import { UserProfile } from '@clerk/nextjs'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Ρυθμίσεις — OliveIQ',
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-olive-700 hover:text-olive-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Επιστροφή στο Dashboard
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ρυθμίσεις Λογαριασμού</h1>
        <p className="mt-1 text-sm text-gray-600">
          Διαχειριστείτε τη συνδρομή σας, τα στοιχεία σύνδεσης, την ασφάλεια και τον λογαριασμό σας.
        </p>
      </header>

      <SubscriptionSection />

      <PushNotificationSection />

      <UserProfile
        routing="hash"
        appearance={{
          elements: {
            rootBox: 'w-full',
            cardBox: 'w-full shadow-sm border border-gray-200',
          },
        }}
      />

      <DeleteAccountSection />
    </div>
  )
}
