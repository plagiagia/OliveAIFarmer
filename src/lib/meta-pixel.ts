import { getMarketingConsent } from '@/lib/tracking-consent'

type MetaPixelFunction = (...args: unknown[]) => void

declare global {
  interface Window {
    fbq?: MetaPixelFunction
  }
}

const FIRST_GROVE_EVENT_KEY = 'oliveiq:meta:first-grove-registration-sent'

export function trackCompleteRegistration() {
  if (typeof window === 'undefined') return
  if (getMarketingConsent() !== 'granted') return
  if (typeof window.fbq !== 'function') return

  if (window.sessionStorage.getItem(FIRST_GROVE_EVENT_KEY) === '1') return

  window.fbq('track', 'CompleteRegistration')
  window.sessionStorage.setItem(FIRST_GROVE_EVENT_KEY, '1')
}
