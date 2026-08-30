export function trackWhopEvent(eventName: string) {
  if (typeof window !== 'undefined') {
    window.whop?.track(eventName)
  }
}
