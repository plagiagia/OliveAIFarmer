import { getMarketingConsent } from '@/lib/tracking-consent'

type MetaPixelFunction = (...args: unknown[]) => void

declare global {
  interface Window {
    fbq?: MetaPixelFunction
  }
}

const FIRST_GROVE_EVENT_KEY = 'oliveiq:meta:first-grove-registration-sent'
const REGISTRATION_EVENT_KEY = 'oliveiq:meta:registration-sent'
const META_PIXEL_READY_EVENT = 'oliveiq:meta-pixel-ready'

function trackOnce(
  eventType: 'track' | 'trackCustom',
  eventName: string,
  storageKey: string,
) {
  if (typeof window === 'undefined') return
  if (getMarketingConsent() !== 'granted') return
  if (window.localStorage.getItem(storageKey) === '1') return

  const send = () => {
    if (typeof window.fbq !== 'function') return
    if (window.localStorage.getItem(storageKey) === '1') return

    window.fbq(eventType, eventName)
    window.localStorage.setItem(storageKey, '1')
  }

  if (typeof window.fbq === 'function') {
    send()
    return
  }

  window.addEventListener(META_PIXEL_READY_EVENT, send, { once: true })
}

/** A new account reached the authenticated dashboard. */
export function trackCompleteRegistration() {
  trackOnce('track', 'CompleteRegistration', REGISTRATION_EVENT_KEY)
}

/** A registered user finished the first meaningful onboarding milestone. */
export function trackFirstGroveCreated() {
  trackOnce('trackCustom', 'FirstGroveCreated', FIRST_GROVE_EVENT_KEY)
}
