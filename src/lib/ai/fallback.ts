/**
 * Rule-based fallback insights.
 *
 * Triggered when OpenAI is unavailable (no key, rate limited upstream,
 * persistent errors after retry). Returns a small, sensible set of
 * insights derived purely from the farm context so the UI is never empty.
 */
import type { FarmContext, AIInsight } from '@/lib/openai'

export function ruleBasedInsights(ctx: FarmContext): AIInsight[] {
  const out: AIInsight[] = []
  const month = ctx.currentMonth

  // 1. Drought warning from weather
  if (ctx.weatherSummary.totalRainfall < 10 && ctx.weatherSummary.avgTempHigh > 28) {
    out.push({
      type: 'WEATHER_ALERT',
      title: 'Πιθανή ξηρασία',
      message: `Τις τελευταίες 30 ημέρες καταγράφηκαν μόνο ${ctx.weatherSummary.totalRainfall.toFixed(1)}mm βροχής με μέση μέγιστη θερμοκρασία ${ctx.weatherSummary.avgTempHigh.toFixed(1)}°C. Εξετάστε ενίσχυση της άρδευσης, ιδιαίτερα σε νέα δέντρα.`,
      urgency: 'HIGH',
      actionRequired: true,
      reasoning: 'Χαμηλή βροχόπτωση + υψηλές θερμοκρασίες = αυξημένο υδατικό στρες.',
    })
  }

  // 2. Satellite stress
  if (ctx.satelliteData?.stressLevel && ctx.satelliteData.stressLevel !== 'HEALTHY') {
    out.push({
      type: 'RISK_WARNING',
      title: 'Δορυφορική ένδειξη στρες',
      message: `Τα πιο πρόσφατα δεδομένα Sentinel δείχνουν επίπεδο στρες "${ctx.satelliteData.stressLevel}" (NDVI ${ctx.satelliteData.ndvi?.toFixed(2) ?? 'n/a'}). Επιθεωρήστε τον ελαιώνα για συμπτώματα και ελέγξτε υγρασία εδάφους.`,
      urgency: ctx.satelliteData.stressLevel === 'SEVERE_STRESS' ? 'CRITICAL' : 'HIGH',
      actionRequired: true,
      reasoning: 'NDVI κάτω από το υγιές εύρος υποδεικνύει βιοτικό ή αβιοτικό στρες.',
    })
  }

  // 3. Seasonal tip — flowering / fruit set window (April–June for Greece)
  if (month >= 4 && month <= 6) {
    out.push({
      type: 'SEASONAL_TIP',
      title: 'Παρακολούθηση άνθησης / καρπόδεσης',
      message: 'Είναι κρίσιμη περίοδος για άνθηση και καρπόδεση. Αποφύγετε καταπόνηση από έλλειψη νερού και παρακολουθήστε για παράσιτα ανθέων.',
      urgency: 'MEDIUM',
      actionRequired: false,
      reasoning: 'Άνοιξη/αρχές καλοκαιριού: φάση που καθορίζει την παραγωγή της χρονιάς.',
    })
  }

  // 4. Pest watch in summer
  if (month >= 6 && month <= 9) {
    out.push({
      type: 'RISK_WARNING',
      title: 'Παρακολούθηση δάκου',
      message: 'Οι μήνες Ιούνιος–Σεπτέμβριος είναι περίοδος δραστηριότητας του δάκου της ελιάς (Bactrocera oleae). Τοποθετήστε παγίδες παρακολούθησης και ελέγξτε εβδομαδιαίως.',
      urgency: 'HIGH',
      actionRequired: true,
      reasoning: 'Καλοκαιρινές θερμοκρασίες ευνοούν την αναπαραγωγή του δάκου.',
    })
  }

  // 5. Missing recent activity reminder
  const hasRecentActivity = ctx.recentActivities.length > 0
  if (!hasRecentActivity) {
    out.push({
      type: 'TASK_REMINDER',
      title: 'Καμία πρόσφατη δραστηριότητα',
      message: 'Δεν έχουν καταγραφεί δραστηριότητες τις τελευταίες 30 ημέρες. Καταγράψτε ποτίσματα, λιπάνσεις και ψεκασμούς για ακριβέστερες AI συμβουλές.',
      urgency: 'LOW',
      actionRequired: false,
      reasoning: 'Η ποιότητα των AI συστάσεων εξαρτάται από την πληρότητα των δεδομένων.',
    })
  }

  return out.slice(0, 5)
}
