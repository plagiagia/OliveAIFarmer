import { PostHog } from 'posthog-node'
import { env } from '@/env'

let posthogClient: PostHog | null | undefined

function getPostHogClient(): PostHog | null {
  if (posthogClient !== undefined) return posthogClient

  const projectToken = env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  const host = env.NEXT_PUBLIC_POSTHOG_HOST

  if (!projectToken || !host) {
    if (process.env.NODE_ENV === 'development') {
      const missingVariable = !projectToken
        ? 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN'
        : 'NEXT_PUBLIC_POSTHOG_HOST'
      throw new Error(`${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`)
    }

    posthogClient = null
    return posthogClient
  }

  posthogClient = new PostHog(projectToken, {
    host,
    enableExceptionAutocapture: true,
    flushAt: 1,
    flushInterval: 0,
  })

  return posthogClient
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: Record<string, boolean | number | string> = {},
) {
  const posthog = getPostHogClient()
  if (!posthog) return

  try {
    posthog.capture({ distinctId, event, properties })
    await posthog.flush()
  } catch (error) {
    console.error('[posthog] Failed to capture server event', error)
  }
}
