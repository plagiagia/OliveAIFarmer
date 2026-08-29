import { Bug, Mail, MessageSquare } from 'lucide-react'

const CONTACT_EMAIL = 'hello@oliveiq.gr'

const SUPPORT_OPTIONS = [
  {
    icon: Mail,
    title: 'Χρειάζομαι βοήθεια',
    description: 'Ρωτήστε μας για οτιδήποτε σχετικά με τη χρήση του OliveIQ.',
    subject: 'Βοήθεια με το OliveIQ',
    body: 'Γεια σας,\n\nΧρειάζομαι βοήθεια με:\n\n',
  },
  {
    icon: Bug,
    title: 'Αναφορά προβλήματος',
    description: 'Πείτε μας τι συνέβη και σε ποιο σημείο της εφαρμογής.',
    subject: 'Αναφορά προβλήματος στο OliveIQ',
    body: 'Γεια σας,\n\nΘέλω να αναφέρω το εξής πρόβλημα:\n\nΒήματα για αναπαραγωγή:\n\n',
  },
  {
    icon: MessageSquare,
    title: 'Στείλτε feedback',
    description: 'Μοιραστείτε μια ιδέα ή πρόταση για να γίνει το OliveIQ καλύτερο.',
    subject: 'Feedback για το OliveIQ',
    body: 'Γεια σας,\n\nΗ πρότασή μου για το OliveIQ είναι:\n\n',
  },
]

function createMailto(subject: string, body: string) {
  const params = new URLSearchParams({ subject, body })
  return `mailto:${CONTACT_EMAIL}?${params.toString()}`
}

export default function SupportSection() {
  return (
    <section className="mb-10 rounded-2xl border border-olive-100 bg-olive-50/40 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 h-6 w-6 shrink-0 text-olive-700" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-gray-900">Βοήθεια &amp; Επικοινωνία</h2>
          <p className="mt-1 text-sm text-gray-600">
            Είμαστε εδώ για ερωτήσεις, αναφορές προβλημάτων και προτάσεις.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {SUPPORT_OPTIONS.map(({ icon: Icon, title, description, subject, body }) => (
              <a
                key={title}
                href={createMailto(subject, body)}
                className="group rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-olive-300 hover:bg-olive-50 focus:outline-none focus:ring-2 focus:ring-olive-500 focus:ring-offset-2"
              >
                <Icon className="h-5 w-5 text-olive-700" aria-hidden="true" />
                <span className="mt-3 block text-sm font-semibold text-gray-900 group-hover:text-olive-800">
                  {title}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-gray-600">{description}</span>
              </a>
            ))}
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Ανοίγει το email σας προς{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-olive-700 underline underline-offset-2 hover:text-olive-900"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
