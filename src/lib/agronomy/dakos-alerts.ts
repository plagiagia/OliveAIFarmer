/**
 * Δάκος alert pipeline: turns weather-derived pest risk into an in-app
 * recommendation plus a push notification.
 *
 * Called by the daily weather cron after fresh records are stored.
 * An alert fires when δάκος risk is HIGH/EXTREME, at most once per
 * ALERT_COOLDOWN_DAYS per farm, and only for plans with oliveFlyAlerts.
 */
import { getTrapReadings, getWeatherHistory, prisma } from '@/lib/db'
import { computePestRisk, type RiskLevel } from '@/lib/agronomy/pest-risk'
import { computeTrapPressure, maxLevel } from '@/lib/agronomy/trap-pressure'
import { sendPushToUser } from '@/lib/push'

const ALERT_COOLDOWN_DAYS = 3
const ALERT_WINDOW_DAYS = 30

const LEVEL_LABELS: Record<RiskLevel, string> = {
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
  const since = new Date(Date.now() - ALERT_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const [records, trapReadings] = await Promise.all([
    getWeatherHistory(farm.id, { startDate: since, limit: ALERT_WINDOW_DAYS }),
    getTrapReadings(farm.id, { startDate: since, limit: ALERT_WINDOW_DAYS }),
  ])

  const risk = computePestRisk(records)
  const trapPressure = computeTrapPressure(
    trapReadings.map((t) => ({
      date: t.date,
      trapCount: t.trapCount,
      totalCatch: t.totalCatch,
      femaleCatch: t.femaleCatch,
      daysSincePrev: t.daysSincePrev,
    }))
  )

  // Alert on the more severe of weather risk and measured trap pressure.
  const level = maxLevel(risk.dakos.level, trapPressure.level)

  if (level !== 'HIGH' && level !== 'EXTREME') {
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
  const message = trapPressure.thresholdExceeded
    ? `Οι παγίδες ξεπέρασαν το όριο επέμβασης (${trapPressure.fliesPerTrapPerDay} συλλήψεις/παγίδα/ημέρα). ` +
      `Προγραμματίστε δολωματικό ψεκασμό και συμβουλευτείτε τον γεωπόνο σας για το χρονικό παράθυρο.`
    : `Οι καιρικές συνθήκες των τελευταίων ${ALERT_WINDOW_DAYS} ημερών ευνοούν τον δάκο ` +
      `(σκορ ${risk.dakos.score}/100). Ελέγξτε τις παγίδες και συμβουλευτείτε τον γεωπόνο σας ` +
      `για το χρονικό παράθυρο ψεκασμού.`

  const reasoning = trapPressure.fliesPerTrapPerDay != null
    ? `${risk.dakos.rationale} ${trapPressure.rationale}`
    : risk.dakos.rationale

  // In-app recommendation (shows up in the farm's AI Γεωπόνος tab).
  await prisma.smartRecommendation.create({
    data: {
      type: 'RISK_WARNING',
      title,
      message,
      reasoning,
      urgency: level === 'EXTREME' ? 'CRITICAL' : 'HIGH',
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
