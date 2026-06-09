export const metadata = {
  title: 'Επικοινωνία — OliveIQ',
  description: 'Στοιχεία επικοινωνίας και ταυτοποίησης της OliveIQ.',
}

export default function ImprintPage() {
  return (
    <>
      <header className="border-b border-gray-100 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Στοιχεία Επικοινωνίας</h1>
        <p className="mt-2 text-sm text-gray-500">Τελευταία ενημέρωση: 17 Μαΐου 2026</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">Φορέας λειτουργίας</h2>
        <p>
          Η OliveIQ αναπτύσσεται και λειτουργεί από ιδιώτη προγραμματιστή στην
          Ελλάδα, ως προσωπικό / πιλοτικό έργο. Δεν αποτελεί ακόμη εγγεγραμμένη
          εμπορική επιχείρηση.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">Υπεύθυνος</h2>
        <ul className="space-y-2">
          <li><strong>Όνομα:</strong> Δημήτριος Γιαννούλης</li>
          <li><strong>Email:</strong> <a href="mailto:hello@oliveiq.gr" className="text-olive-700 underline">hello@oliveiq.gr</a></li>
          <li><strong>Χώρα έδρας:</strong> Ελλάδα</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">Νομικά έγγραφα</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li><a href="/legal/privacy" className="text-olive-700 underline">Πολιτική Απορρήτου</a></li>
          <li><a href="/legal/terms" className="text-olive-700 underline">Όροι Χρήσης</a></li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">Καταγγελίες & δικαιώματα δεδομένων</h2>
        <p>
          Για ζητήματα προστασίας προσωπικών δεδομένων μπορείτε να απευθυνθείτε
          απευθείας στο email μας ή στην Αρχή Προστασίας Δεδομένων Προσωπικού
          Χαρακτήρα:{' '}
          <a href="https://www.dpa.gr" className="text-olive-700 underline" target="_blank" rel="noopener noreferrer">
            www.dpa.gr
          </a>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">Σχόλια & feedback</h2>
        <p>
          Η OliveIQ βρίσκεται σε ενεργή ανάπτυξη. Οποιοδήποτε feedback,
          αναφορά σφάλματος ή πρόταση είναι ευπρόσδεκτη στο email μας.
        </p>
      </section>
    </>
  )
}
