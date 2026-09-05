import { missingContext, type FarmContext } from './context'
import type { AIInsightParsed } from './schemas'

export function ruleBasedInsights(ctx: FarmContext): AIInsightParsed[] {
  const missing = missingContext(ctx)
  const out: AIInsightParsed[] = [{
    type: 'TASK_REMINDER', title: 'Η επόμενη χρήσιμη καταγραφή',
    message: ctx.recentActivities.some(a => a.completed) ? `Για τον ελαιώνα στην περιοχή ${ctx.location}, καταγράψτε τις παρατηρήσεις της επόμενης επίσκεψης μαζί με την εργασία που έγινε.` : 'Προσθέστε την τελευταία εργασία που πραγματοποιήσατε και τυχόν παρατηρήσεις. Η απουσία καταγραφών δεν σημαίνει ότι δεν έγιναν εργασίες.',
    urgency: 'LOW', actionRequired: true, reasoning: 'Οι πραγματικές παρατηρήσεις βοηθούν να διακριθούν οι ανάγκες του ελαιώνα από γενικές εποχικές υπενθυμίσεις.',
    evidenceIds: ['region'], missingData: missing.slice(0, 4), followUpQuestion: ctx.variety === 'Άγνωστη' ? 'Ποια είναι η κύρια ποικιλία ελιάς;' : 'Ποιος είναι ο στόχος σας αυτή την περίοδο: ποιότητα λαδιού, επιτραπέζιος καρπός ή μείωση κόστους;',
  }]
  if (!ctx.weatherSummary.sufficient) out.push({
    type: 'CARE_SUGGESTION', title: 'Περιορισμένα καιρικά στοιχεία', message: `Διαθέσιμες ημέρες ιστορικού: ${ctx.weatherSummary.observedDays}/30. Δεν προκύπτει αξιόπιστη εικόνα κινδύνου από αυτά τα στοιχεία.`,
    urgency: 'LOW', actionRequired: false, reasoning: 'Ελλιπή ή παλιά δεδομένα δεν ισοδυναμούν με χαμηλό κίνδυνο.', evidenceIds: ['weather'], missingData: ['Πρόσφατο καιρικό ιστορικό'], followUpQuestion: null,
  })
  return out
}
