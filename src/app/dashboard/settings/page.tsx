import DeleteAccountSection from '@/components/settings/DeleteAccountSection'
import { UserProfile } from '@clerk/nextjs'

export const metadata = {
  title: 'Ρυθμίσεις — OliveIQ',
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ρυθμίσεις Λογαριασμού</h1>
        <p className="mt-1 text-sm text-gray-600">
          Διαχειριστείτε τα στοιχεία σύνδεσής σας, την ασφάλεια και τον λογαριασμό σας.
        </p>
      </header>

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
