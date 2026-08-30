const PENDING_REGISTRATION_KEY = 'whop_pending_registration'
const PENDING_REGISTRATION_TTL_MS = 10 * 60 * 1000

export function trackWhopEvent(eventName: string) {
  if (typeof window !== 'undefined') {
    window.whop?.track(eventName)
  }
}

export function markWhopRegistrationPending() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(PENDING_REGISTRATION_KEY, String(Date.now()))
  }
}

export function clearWhopRegistrationPending() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(PENDING_REGISTRATION_KEY)
  }
}

export function trackPendingWhopRegistration() {
  if (typeof window === 'undefined') return

  const startedAt = Number(window.sessionStorage.getItem(PENDING_REGISTRATION_KEY))
  window.sessionStorage.removeItem(PENDING_REGISTRATION_KEY)

  if (!Number.isFinite(startedAt) || Date.now() - startedAt > PENDING_REGISTRATION_TTL_MS) return

  trackWhopEvent('complete_registration')
}
