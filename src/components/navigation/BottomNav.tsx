'use client'

import { BarChart3, Home, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Αρχική', icon: Home },
  { href: '/dashboard/analytics', label: 'Αναλύσεις', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Ρυθμίσεις', icon: Settings },
]

function isItemActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') {
    // Farm pages are reached from the dashboard, so keep "home" highlighted there
    return pathname === '/dashboard' || pathname.startsWith('/dashboard/farms')
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function BottomNav() {
  const pathname = usePathname()

  if (!pathname?.startsWith('/dashboard')) return null

  return (
    <>
      {/* Spacer so page content is not hidden behind the fixed nav */}
      <div className="h-16 md:hidden" aria-hidden="true" />
      <nav
        aria-label="Κύρια πλοήγηση"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur pb-safe md:hidden"
      >
        <div className="grid grid-cols-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = isItemActive(href, pathname)
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors active:scale-95 ${
                  isActive ? 'text-olive-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.25]' : ''}`} />
                <span className="truncate">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
