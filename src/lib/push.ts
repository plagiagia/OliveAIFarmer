/**
 * Web Push delivery for δάκος (olive fly) risk alerts.
 *
 * Requires VAPID keys (generate once with `npx web-push generate-vapid-keys`):
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY — also used by the client to subscribe
 *   VAPID_PRIVATE_KEY
 *   VAPID_SUBJECT — mailto: or https: contact (defaults to the app domain)
 *
 * When keys are missing every send is a silent no-op, so the feature can
 * ship before the keys are configured.
 */
import { prisma } from '@/lib/db'
import webpush from 'web-push'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? 'https://oliveiq.gr'

let configured = false

export function isPushConfigured(): boolean {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false
  if (!configured) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
    configured = true
  }
  return true
}

export interface PushPayload {
  title: string
  body: string
  /** Path to open when the notification is clicked (defaults to /dashboard). */
  url?: string
  tag?: string
}

/**
 * Send a push notification to every registered device of a user.
 * Dead subscriptions (endpoint gone: 404/410) are pruned automatically.
 * Returns the number of successful deliveries.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!isPushConfigured()) return 0

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } })
  if (subscriptions.length === 0) return 0

  const body = JSON.stringify(payload)
  let delivered = 0

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        body
      )
      delivered++
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode
      if (statusCode === 404 || statusCode === 410) {
        // Subscription expired or unsubscribed — clean it up.
        await prisma.pushSubscription
          .delete({ where: { id: sub.id } })
          .catch(() => undefined)
      } else {
        console.error('[push] delivery failed', { endpoint: sub.endpoint, statusCode })
      }
    }
  }

  return delivered
}
