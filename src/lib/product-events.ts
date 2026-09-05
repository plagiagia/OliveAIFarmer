'use client'

import { track } from '@vercel/analytics'
import { getMarketingConsent } from '@/lib/tracking-consent'

type ProductEvent =
  | 'GroveSetupStarted'
  | 'GroveCreated'
  | 'WeeklyWorkViewed'
  | 'WeatherViewed'
  | 'TaskSaved'
  | 'CalendarDownloaded'
  | 'ProPreviewViewed'
  | 'UpgradeStarted'

/** No farm names, coordinates, free text, or user identifiers leave the app. */
export function trackProductEvent(
  event: ProductEvent,
  properties: Record<string, string | number | boolean> = {}
) {
  try {
    if (getMarketingConsent() !== 'granted') return
    track(event, properties)
  } catch {
    // Telemetry must never interrupt a grower's work (including blocked storage).
  }
}
