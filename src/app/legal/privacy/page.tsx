export const metadata = {
  title: 'Πολιτική Απορρήτου — OliveIQ',
  description: 'Πώς συλλέγουμε, χρησιμοποιούμε και προστατεύουμε τα προσωπικά σας δεδομένα.',
}

export default function PrivacyPage() {
  return (
    <>
      <header className="border-b border-gray-100 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Πολιτική Απορρήτου</h1>
        <p className="mt-2 text-sm text-gray-500">Τελευταία ενημέρωση: 17 Μαΐου 2026</p>
      </header>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Η υπηρεσία OliveIQ βρίσκεται σε <strong>πιλοτική (beta) φάση</strong>. Παρακαλούμε
        να αποφεύγετε την καταχώρηση ευαίσθητων προσωπικών δεδομένων που δεν είναι
        απαραίτητα για τη χρήση της εφαρμογής.
      </div>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">1. Ποιοι είμαστε</h2>
        <p>
          Η εφαρμογή OliveIQ (εφεξής «η Υπηρεσία») αναπτύσσεται και λειτουργεί από
          ιδιώτη προγραμματιστή. Δείτε τη σελίδα{' '}
          <a href="/legal/imprint" className="text-olive-700 underline">Στοιχεία Επικοινωνίας</a>{' '}
          για πλήρη ταυτοποίηση και τρόπους επικοινωνίας.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">2. Τι δεδομένα συλλέγουμε</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Στοιχεία λογαριασμού:</strong> όνομα, επώνυμο, διεύθυνση email (μέσω της υπηρεσίας Clerk).</li>
          <li><strong>Δεδομένα ελαιώνα:</strong> όνομα, τοποθεσία, γεωγραφικές συντεταγμένες, αριθμός δέντρων, ποικιλία, εκτάσεις, που εισάγετε εσείς.</li>
          <li><strong>Καταγραφές δραστηριοτήτων & συγκομιδής:</strong> ημερομηνίες, τύπος εργασίας, κόστος, σημειώσεις.</li>
          <li><strong>Πληρωμές:</strong> τα στοιχεία της κάρτας σας δεν αποθηκεύονται από εμάς. Διαχειρίζονται αποκλειστικά από την υπηρεσία Stripe.</li>
          <li><strong>Δεδομένα AI Γεωπόνου:</strong> το σχετικό περιεχόμενο του ελαιώνα σας (εργασίες, συγκομιδές, καιρός) αποστέλλεται στην OpenAI για τη δημιουργία προτάσεων. Καταγράφουμε τη συνολική χρήση tokens για έλεγχο κόστους.</li>
          <li><strong>Τεχνικά cookies:</strong> απαραίτητα cookies σύνδεσης (από Clerk). Δεν χρησιμοποιούμε εργαλεία αναλυτικών στοιχείων ή tracking τρίτων.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">3. Νομική βάση επεξεργασίας</h2>
        <p>Επεξεργαζόμαστε τα δεδομένα σας βάσει:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Εκτέλεσης της σύμβασης</strong> για να σας παρέχουμε την Υπηρεσία (άρθρο 6.1.β GDPR).</li>
          <li><strong>Έννομου συμφέροντος</strong> για ασφάλεια, αποτροπή κατάχρησης, και βελτίωση της Υπηρεσίας (άρθρο 6.1.στ GDPR).</li>
          <li><strong>Συγκατάθεσης</strong> όπου απαιτείται (π.χ. προαιρετικές λειτουργίες).</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">4. Πού αποθηκεύονται τα δεδομένα</h2>
        <p>
          Η κύρια βάση δεδομένων μας φιλοξενείται στην <strong>Φρανκφούρτη της Γερμανίας
          (ΕΕ)</strong> από την Neon. Τα δεδομένα σας παραμένουν εντός Ευρωπαϊκής Ένωσης.
          Ορισμένοι υπεργολάβοι (Clerk, OpenAI, Stripe, Mapbox) έχουν έδρα τις ΗΠΑ και
          λειτουργούν με τυποποιημένες συμβατικές ρήτρες (SCCs) σύμφωνα με το GDPR.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">5. Υπεργολάβοι επεξεργασίας</h2>
        <p>Μοιραζόμαστε τα ελάχιστα αναγκαία δεδομένα με τους ακόλουθους παρόχους:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Clerk Inc.</strong> (ΗΠΑ) — αυθεντικοποίηση χρηστών.</li>
          <li><strong>Neon Inc.</strong> (φιλοξενία EU) — βάση δεδομένων PostgreSQL.</li>
          <li><strong>Stripe Inc.</strong> (ΗΠΑ/Ιρλανδία) — διαχείριση συνδρομών και πληρωμών.</li>
          <li><strong>OpenAI L.L.C.</strong> (ΗΠΑ) — επεξεργασία AI Γεωπόνου. Δεν χρησιμοποιούνται τα δεδομένα σας για εκπαίδευση μοντέλων.</li>
          <li><strong>OpenWeatherMap</strong> — δέχεται μόνο γεωγραφικές συντεταγμένες, χωρίς προσωπικά δεδομένα.</li>
          <li><strong>Mapbox</strong> (ΗΠΑ) — εμφάνιση χαρτών.</li>
          <li><strong>Vercel Inc.</strong> (ΗΠΑ, φιλοξενία EU region) — φιλοξενία εφαρμογής.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">6. Χρόνος διατήρησης</h2>
        <p>
          Διατηρούμε τα δεδομένα σας για όσο διάστημα έχετε ενεργό λογαριασμό. Σε
          περίπτωση διαγραφής λογαριασμού, διαγράφονται οριστικά εντός 30 ημερών,
          εκτός όπου η νομοθεσία απαιτεί διατήρηση (π.χ. φορολογικά παραστατικά
          συνδρομών για 5 έτη).
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">7. Τα δικαιώματά σας (GDPR)</h2>
        <p>Έχετε δικαίωμα:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Πρόσβασης</strong> στα δεδομένα σας.</li>
          <li><strong>Διόρθωσης</strong> ανακριβών στοιχείων.</li>
          <li><strong>Διαγραφής</strong> («δικαίωμα στη λήθη»).</li>
          <li><strong>Φορητότητας</strong> — εξαγωγή σε μορφή CSV από το dashboard.</li>
          <li><strong>Εναντίωσης</strong> στην επεξεργασία.</li>
          <li><strong>Καταγγελίας</strong> στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (<a href="https://www.dpa.gr" className="text-olive-700 underline" target="_blank" rel="noopener noreferrer">dpa.gr</a>).</li>
        </ul>
        <p>
          Για να ασκήσετε οποιοδήποτε δικαίωμα, επικοινωνήστε μαζί μας στο{' '}
          <a href="mailto:hello@oliveiq.gr" className="text-olive-700 underline">hello@oliveiq.gr</a>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">8. Παιδιά</h2>
        <p>
          Η Υπηρεσία απευθύνεται σε ενηλίκους ελαιοπαραγωγούς. Δεν συλλέγουμε εν
          γνώσει μας δεδομένα ατόμων κάτω των 18 ετών.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">9. Αλλαγές στην πολιτική</h2>
        <p>
          Ενδέχεται να επικαιροποιήσουμε την παρούσα πολιτική. Σημαντικές αλλαγές
          θα ανακοινωθούν μέσω email ή ειδοποίησης εντός της εφαρμογής.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">10. Επικοινωνία</h2>
        <p>
          Για ερωτήσεις σχετικά με την παρούσα πολιτική:{' '}
          <a href="mailto:hello@oliveiq.gr" className="text-olive-700 underline">hello@oliveiq.gr</a>.
        </p>
      </section>
    </>
  )
}
