'use client'

import { markWhopRegistrationPending } from '@/lib/whop'
import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'

export default function WhopSignupTracker() {
  const { isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      markWhopRegistrationPending()
    }
  }, [isLoaded, isSignedIn])

  return null
}
