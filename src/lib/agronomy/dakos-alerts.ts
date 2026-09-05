/**
 * Δάκος alert pipeline: turns weather-derived pest risk into an in-app
 * recommendation plus a push notification.
 *
 * Called by the daily weather cron after fresh records are stored.
 * An alert fires when δάκος risk is HIGH/EXTREME, at most once per
 * ALERT_COOLDOWN_DAYS per farm, and only for plans with oliveFlyAlerts.
 */
import { getWeatherHistory, prisma } from '@/lib/db'
import { computePestRisk, type RiskLevel } from '@/lib/agronomy/pest-risk'
import { sendPushToUser } from '@/lib/push'

const ALERT_COOLDOWN_DAYS = 3
const ALERT_WINDOW_DAYS = 30

const LEVEL_LABELS: Record<RiskLevel, string> = {
  UNKNOWN: 'Άγνωστος',
  LOW: 'Χαμηλός',
  MODERATE: 'Μέτριος',
  HIGH: 'Υψηλός',
  EXTREME: 'Πολύ υψηλός',
}

export interface DakosAlertResult {
  farmId: string
  level: RiskLevel
  alerted: boolean
  pushed: number
}

/**
 * Evaluate δάκος risk for a farm and alert its owner if warranted.
 * Returns what happened so the cron can report it.
 */
export async function maybeSendDakosAlert(farm: {
  id: string
  name: string
  userId: string
}): Promise<DakosAlertResult> {
  const records = await getWeatherHistory(farm.id, {
    startDate: new Date(Date.now() - ALERT_WINDOW_DAYS * 24 * 60 * 60 * 1000),
    limit: ALERT_WINDOW_DAYS,
  })

  const risk = computePestRisk(records)
  const level = risk.dakos.level

  if (!risk.sufficient || (level !== 'HIGH' && level !== 'EXTREME')) {
    return { farmId: farm.id, level, alerted: false, pushed: 0 }
  }

  // Cooldown: skip if a δάκος alert for this farm fired recently.
  const recent = await prisma.smartRecommendation.findFirst({
    where: {
      farmId: farm.id,
      type: 'RISK_WARNING',
      source: 'WEATHER_ALERT',
      contextHash: 'dakos-alert',
      createdAt: { gte: new Date(Date.now() - ALERT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000) },
    },
    select: { id: true },
  })
  if (recent) {
    return { farmId: farm.id, level, alerted: false, pushed: 0 }
  }

  const title = `${LEVEL_LABELS[level]} κίνδυνος δάκου — ${farm.name}`
  const message =
    `Ο ενδεικτικός καιρικός δείκτης από ${risk.windowDays} διαθέσιμες ημέρες ιστορικού είναι αυξημένος ` +
    `(${risk.dakos.score}/100), χωρίς να επιβεβαιώνει προσβολή. Ελέγξτε τις παγίδες και συμβουλευτείτε τον γεωπόνο σας ` +
    `με τα ευρήματα πριν από επέμβαση.`

  // In-app recommendation (shows up in the farm's AI Γεωπόνος tab).
  await prisma.smartRecommendation.create({
    data: {
      type: 'RISK_WARNING',
      title,
      message,
      reasoning: risk.dakos.rationale,
      urgency: 'MEDIUM',
      actionRequired: true,
      source: 'WEATHER_ALERT',
      farmId: farm.id,
      weatherBased: true,
      contextHash: 'dakos-alert',
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  // Push notification to all the owner's devices.
  const pushed = await sendPushToUser(farm.userId, {
    title,
    body: message,
    url: `/dashboard/farms/${farm.id}`,
    tag: `dakos-${farm.id}`,
  })

  return { farmId: farm.id, level, alerted: true, pushed }
}
