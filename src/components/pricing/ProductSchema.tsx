import { PLANS } from '@/lib/plans'
export default function ProductSchema() {
 const data = { '@context': 'https://schema.org', '@graph': [
  { '@type': 'Organization', name: 'OliveIQ', url: 'https://oliveiq.gr' },
  { '@type': 'SoftwareApplication', name: 'OliveIQ', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', url: 'https://oliveiq.gr', description: 'Ψηφιακό ημερολόγιο και διαχείριση ελαιώνα.', offers: [
   { '@type': 'Offer', name: 'Δωρεάν', price: 0, priceCurrency: 'EUR', url: 'https://oliveiq.gr/pricing' },
   { '@type': 'Offer', name: 'Pro ετήσιο', price: PLANS.GROWER.priceAnnual, priceCurrency: 'EUR', url: 'https://oliveiq.gr/pricing', description: 'Ετήσια χρέωση' },
  ] },
  { '@type': 'FAQPage', mainEntity: [
   { '@type': 'Question', name: 'Τι χρειάζομαι για να αξιοποιήσω το Pro;', acceptedAnswer: { '@type': 'Answer', text: 'Ορίστε τη θέση του ελαιώνα για τον καιρό και τις εκτιμήσεις κινδύνου. Ενεργοποιήστε τις ειδοποιήσεις στις ρυθμίσεις της συσκευής σας. Για το κόστος παραγωγής, καταγράψτε έξοδα και συγκομιδές.' } },
   { '@type': 'Question', name: 'Μπορώ να ξεκινήσω δωρεάν;', acceptedAnswer: { '@type': 'Answer', text: 'Ναι. Ένας ελαιώνας, καιρός, δραστηριότητες και συγκομιδές παραμένουν διαθέσιμα στο δωρεάν πλάνο, χωρίς κάρτα.' } },
  ] },
 ] }
 return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}
