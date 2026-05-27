'use client'

import { UserButton } from '@clerk/nextjs'
import { CreditCard, Settings } from 'lucide-react'

export default function UserMenuButton() {
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
