'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import { CreditCard, Settings } from 'lucide-react'
import posthog from 'posthog-js'
import { useEffect, useRef } from 'react'

export default function UserMenuButton() {
  const { user } = useUser()
  const userId = user?.id
  const userRef = useRef(user)
  const identifiedUserId = useRef<string | null>(null)

  userRef.current = user

  useEffect(() => {
    const identifiedUser = userRef.current
    if (!userId || !identifiedUser) return

    if (identifiedUserId.current && identifiedUserId.current !== userId) {
      posthog.reset()
    }

    posthog.identify(userId, {
      ...(identifiedUser.primaryEmailAddress?.emailAddress && {
        email: identifiedUser.primaryEmailAddress.emailAddress,
      }),
      ...(identifiedUser.fullName && { name: identifiedUser.fullName }),
    })
    identifiedUserId.current = userId

    return () => {
      if (identifiedUserId.current === userId) {
        posthog.reset()
        identifiedUserId.current = null
      }
    }
  }, [userId])

  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: 'w-8 h-8 sm:w-10 sm:h-10',
          userButtonPopoverCard: 'shadow-lg',
          userButtonPopoverActionButton: 'text-olive-700 hover:bg-olive-50',
        },
      }}
      showName={false}
    >
      <UserButton.MenuItems>
        <UserButton.Link
          label="Συνδρομή"
          labelIcon={<CreditCard className="h-4 w-4" />}
          href="/dashboard/settings#subscription"
        />
        <UserButton.Link
          label="Ρυθμίσεις"
          labelIcon={<Settings className="h-4 w-4" />}
          href="/dashboard/settings"
        />
      </UserButton.MenuItems>
    </UserButton>
  )
}
