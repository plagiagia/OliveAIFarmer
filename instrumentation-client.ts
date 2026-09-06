import posthog from 'posthog-js'
import {
  ANALYTICS_CONSENT_CHANGED_EVENT,
  getAnalyticsConsent,
} from '@/lib/tracking-consent'

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

if (!projectToken || !host) {
  if (process.env.NODE_ENV === 'development') {
    const missingVariable = projectToken
      ? 'NEXT_PUBLIC_POSTHOG_HOST'
      : 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN'

    throw new Error(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`
    )
  }
} else {
  posthog.init(projectToken, {
    api_host: host,
    defaults: '2026-01-30',
    capture_exceptions: true,
    debug: process.env.NODE_ENV === 'development',
    opt_out_capturing_by_default: true,
    opt_out_persistence_by_default: true,
    respect_dnt: true,
  })

  const syncConsent = () => {
    if (getAnalyticsConsent() === 'granted') {
      posthog.opt_in_capturing()
    } else {
      posthog.opt_out_capturing()
    }
  }

  syncConsent()
  window.addEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, syncConsent)
}
