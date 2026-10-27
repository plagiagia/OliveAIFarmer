import TrackingConsentSettings from '@/components/analytics/TrackingConsentSettings'

export const metadata = {
  title: 'Ρυθμίσεις Απορρήτου — OliveIQ',
  description: 'Διαχειριστείτε τις προαιρετικές ρυθμίσεις διαφημιστικών cookies.',
}

export default function PrivacySettingsPage() {
  return (
    <>
      <header className="border-b border-gray-100 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ρυθμίσεις Απορρήτου</h1>
        <p className="mt-2 text-sm text-gray-500">Διαχειριστείτε τις προαιρετικές ρυθμίσεις παρακολούθησης.</p>
      </header>

      <p>
        Τα απαραίτητα cookies και οι λειτουργίες της εφαρμογής παραμένουν ενεργά. Από εδώ μπορείτε να αλλάξετε
        οποτεδήποτε τη συγκατάθεσή σας για τα διαφημιστικά cookies.
      </p>

      <TrackingConsentSettings />

      <p className="text-sm text-gray-500">
        Για περισσότερες πληροφορίες σχετικά με τα δεδομένα που συλλέγουμε, δείτε την{' '}
        <a href="/legal/privacy" className="text-olive-700 underline">Πολιτική Απορρήτου</a>.
      </p>
    </>
  )
}
