'use client'

import { trackPendingWhopRegistration } from '@/lib/whop'
import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'

export default function WhopRegistrationTracker() {
  const { isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      trackPendingWhopRegistration()
    }
  }, [isLoaded, isSignedIn])

  return null
}
