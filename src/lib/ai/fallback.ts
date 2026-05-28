/**
 * Rule-based fallback insights.
 *
 * Triggered when OpenAI is unavailable (no key, rate limited upstream,
 * persistent errors after retry). Returns a small, sensible set of
 * insights derived purely from the farm context so the UI is never empty.
 */
import type {
  FarmContext,
  AIInsight,
  DashboardPortfolioContext,
  DashboardAIInsight,
  DashboardAIResponse,
} from '@/lib/openai'

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

function portfolioSummaryFromInsights(
  insights: DashboardAIInsight[],
  ctx: DashboardPortfolioContext
) {
  const hasCritical = insights.some((i) => i.urgency === 'CRITICAL')
  const hasHigh = insights.some((i) => i.urgency === 'HIGH')
  const stressedFarms = ctx.farms.filter(
    (f) => f.satelliteHealth?.stressLevel && f.satelliteHealth.stressLevel !== 'HEALTHY'
  ).length

  let overallHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' = 'GOOD'
  if (hasCritical || stressedFarms >= Math.max(1, Math.ceil(ctx.totalFarms / 2))) {
    overallHealth = 'POOR'
  } else if (hasHigh || stressedFarms > 0) {
    overallHealth = 'FAIR'
  } else if (insights.length === 0) {
    overallHealth = 'GOOD'
  } else {
    overallHealth = 'EXCELLENT'
  }

  return {
    overallHealth,
    urgentActions: insights.filter(
      (i) => (i.urgency === 'HIGH' || i.urgency === 'CRITICAL') && i.actionRequired
    ).length,
    opportunitiesCount: insights.filter((i) =>
      ['OPTIMIZATION', 'SEASONAL_TIP', 'CARE_SUGGESTION'].includes(i.type)
    ).length,
  }
}

/** Portfolio-level rule-based insights when OpenAI is unavailable. */
export function ruleBasedDashboardInsights(
  ctx: DashboardPortfolioContext
): DashboardAIResponse {
  const out: DashboardAIInsight[] = []
  const month = ctx.currentMonth

  for (const farm of ctx.farms) {
    if (farm.satelliteHealth?.stressLevel && farm.satelliteHealth.stressLevel !== 'HEALTHY') {
      out.push({
        type: 'RISK_WARNING',
        title: `Δορυφορικό στρες: ${farm.name}`,
        message: `Στον ελαιώνα «${farm.name}» τα δεδομένα Sentinel δείχνουν στρες «${farm.satelliteHealth.stressLevel}» (NDVI ${farm.satelliteHealth.ndvi?.toFixed(2) ?? 'n/a'}). Προτεραιότητα επίσκεψης και ελέγχου υγρασίας.`,
        urgency: farm.satelliteHealth.stressLevel === 'SEVERE_STRESS' ? 'CRITICAL' : 'HIGH',
        actionRequired: true,
        reasoning: 'Δορυφορική ένδειξη στρες σε συγκεκριμένο ελαιώνα του χαρτοφυλακίου.',
        farmId: farm.id,
        farmName: farm.name,
      })
    }

    if (farm.harvestTrend === 'declining') {
      out.push({
        type: 'OPTIMIZATION',
        title: `Πτώση απόδοσης: ${farm.name}`,
        message: `Η απόδοση στον «${farm.name}» δείχνει πτωτική τάση σε σχέση με την προηγούμενη συγκομιδή. Εξετάστε λίπανση, άρδευση και ιστορικό φυτοπροστασίας.`,
        urgency: 'MEDIUM',
        actionRequired: false,
        reasoning: 'Σύγκριση τελευταίων δύο ετών συγκομιδής.',
        farmId: farm.id,
        farmName: farm.name,
      })
    }

    if (farm.recentActivities.length === 0) {
      out.push({
        type: 'TASK_REMINDER',
        title: `Καμία δραστηριότητα: ${farm.name}`,
        message: `Δεν έχουν καταγραφεί δραστηριότητες τις τελευταίες 30 ημέρες στον «${farm.name}». Καταγράψτε ποτίσματα και φροντίδες για καλύτερες συστάσεις.`,
        urgency: 'LOW',
        actionRequired: false,
        reasoning: 'Ατελές ιστορικό δραστηριοτήτων μειώνει την ακρίβεια της ανάλυσης.',
        farmId: farm.id,
        farmName: farm.name,
      })
    }
  }

  if (month >= 4 && month <= 6) {
    out.push({
      type: 'SEASONAL_TIP',
      title: 'Άνθηση / καρπόδεση (χαρτοφυλάκιο)',
      message:
        'Κρίσιμη περίοδος για όλους τους ελαιώνες: παρακολουθήστε άνθηση, αποφύγετε υδατικό στρες και ελέγξτε παράσιτα ανθέων ανά ελαιώνα.',
      urgency: 'MEDIUM',
      actionRequired: false,
      reasoning: 'Εποχική στρατηγική συμβουλή για όλο το χαρτοφυλάκιο (Άνοιξη–αρχές καλοκαιριού).',
      farmId: null,
      farmName: 'Όλοι',
    })
  }

  if (month >= 6 && month <= 9) {
    out.push({
      type: 'RISK_WARNING',
      title: 'Παρακολούθηση δάκου (χαρτοφυλάκιο)',
      message:
        'Ιούνιος–Σεπτέμβριος: τοποθετήστε παγίδες δάκου και ελέγχετε εβδομαδιαίως σε κάθε ελαιώνα με ιστορικό προσβολών.',
      urgency: 'HIGH',
      actionRequired: true,
      reasoning: 'Καλοκαιρινή περίοδος δραστηριότητας Bactrocera oleae.',
      farmId: null,
      farmName: 'Όλοι',
    })
  }

  if (out.length === 0) {
    out.push({
      type: 'CARE_SUGGESTION',
      title: 'Συνεχίστε την καταγραφή δεδομένων',
      message: `Το χαρτοφυλάκιό σας (${ctx.totalFarms} ελαιώνες, ${ctx.totalTrees} δέντρα) δεν εμφανίζει επείγουσες ενδείξεις από τα διαθέσιμα δεδομένα. Συμπληρώστε δραστηριότητες και συγκομιδές για πλουσιότερη AI ανάλυση.`,
      urgency: 'LOW',
      actionRequired: false,
      reasoning: 'Καμία ισχυρή ενδειξη από δορυφόρο, συγκομιδές ή δραστηριότητες.',
      farmId: null,
      farmName: 'Όλοι',
    })
  }

  const insights = out.slice(0, 10)
  return {
    insights,
    portfolioSummary: portfolioSummaryFromInsights(insights, ctx),
    meta: {
      model: 'rule-based',
      promptVersion: 'fallback-dashboard-v1.0',
      requestId: null,
      generatedAt: new Date().toISOString(),
      usage: null,
    },
  }
}
