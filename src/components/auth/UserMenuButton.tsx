'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import { CreditCard, Settings, ShieldCheck } from 'lucide-react'
import { identifyPostHogUser, resetPostHogUser } from '@/lib/posthog-client'
import {
  ANALYTICS_CONSENT_CHANGED_EVENT,
  getAnalyticsConsent,
  type MarketingConsent,
} from '@/lib/tracking-consent'
import { useEffect, useRef, useState } from 'react'

export default function UserMenuButton() {
  const { user } = useUser()
  const userId = user?.id
  const userRef = useRef(user)
  const identifiedUserId = useRef<string | null>(null)
  const [analyticsConsent, setAnalyticsConsent] = useState<MarketingConsent | null>(null)

  userRef.current = user

  useEffect(() => {
    const updateConsent = () => setAnalyticsConsent(getAnalyticsConsent())
    updateConsent()
    window.addEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, updateConsent)
    return () => window.removeEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, updateConsent)
  }, [])

  useEffect(() => {
    const identifiedUser = userRef.current
    if (!userId || !identifiedUser) return

    if (identifiedUserId.current && identifiedUserId.current !== userId) {
      resetPostHogUser()
    }

    identifyPostHogUser(userId, {
      ...(identifiedUser.primaryEmailAddress?.emailAddress && {
        email: identifiedUser.primaryEmailAddress.emailAddress,
      }),
      ...(identifiedUser.fullName && { name: identifiedUser.fullName }),
    })
    identifiedUserId.current = userId

    return () => {
      if (identifiedUserId.current === userId) {
        resetPostHogUser()
        identifiedUserId.current = null
      }
    }
  }, [analyticsConsent, userId])

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
        <UserButton.Link
          label="Ρυθμίσεις απορρήτου"
          labelIcon={<ShieldCheck className="h-4 w-4" />}
          href="/legal/privacy-settings"
        />
      </UserButton.MenuItems>
    </UserButton>
  )
}
