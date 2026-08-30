export {}

declare global {
  interface Window {
    whop?: {
      track: (eventName: string, data?: { value?: number; currency?: string }) => void
    }
  }
}
