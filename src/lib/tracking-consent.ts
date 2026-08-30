export const MARKETING_CONSENT_STORAGE_KEY = 'oliveiq:marketing-consent'
export const MARKETING_CONSENT_CHANGED_EVENT = 'oliveiq:marketing-consent-changed'

export type MarketingConsent = 'granted' | 'denied'

export function getMarketingConsent(): MarketingConsent | null {
  if (typeof window === 'undefined') return null

  const value = window.localStorage.getItem(MARKETING_CONSENT_STORAGE_KEY)
  return value === 'granted' || value === 'denied' ? value : null
}

export function setMarketingConsent(consent: MarketingConsent) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(MARKETING_CONSENT_STORAGE_KEY, consent)
  window.dispatchEvent(new Event(MARKETING_CONSENT_CHANGED_EVENT))
}
