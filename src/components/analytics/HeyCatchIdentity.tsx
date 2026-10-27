'use client'

import { useUser } from '@clerk/nextjs'
import { analytics } from '@heycatch/sdk'
import { useEffect } from 'react'

export default function HeyCatchIdentity() {
  const { isLoaded, isSignedIn, user } = useUser()
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || !user) {
      if (localStorage.getItem('heycatch-signed-in')) {
        analytics.resetIdentity()
        localStorage.removeItem('heycatch-signed-in')
      }
      return
    }

    localStorage.setItem('heycatch-signed-in', '1')
    analytics.setIdentity(
      user.id,
      { email: user.primaryEmailAddress?.emailAddress, name: user.fullName ?? undefined },
      { signup_date: user.createdAt?.toISOString() },
    )
  }, [isLoaded, isSignedIn, user])

  return null
}
