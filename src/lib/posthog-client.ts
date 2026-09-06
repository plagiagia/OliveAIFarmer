import posthog from 'posthog-js'
import { getAnalyticsConsent } from '@/lib/tracking-consent'

type PostHogProperties = Record<string, boolean | number | string>

export function capturePostHogEvent(event: string, properties: PostHogProperties = {}) {
  if (getAnalyticsConsent() !== 'granted') return
  posthog.capture(event, properties)
}

export function capturePostHogException(error: unknown) {
  if (getAnalyticsConsent() !== 'granted') return
  posthog.captureException(error)
}

export function identifyPostHogUser(userId: string, properties: PostHogProperties = {}) {
  if (getAnalyticsConsent() !== 'granted') return
  posthog.identify(userId, properties)
}

export function resetPostHogUser() {
  posthog.reset()
}
