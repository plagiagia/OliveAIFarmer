'use client'

import PricingModal from '@/components/pricing/PricingModal'
import { usePlan } from '@/hooks/usePlan'
import {
  Activity,
  BarChart3,
  Lock,
  Satellite,
  Sparkles,
  Wheat
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import AIGeoponosTab from './AIGeoponosTab'
import FarmActivities from './FarmActivities'
import FarmEditModal from './FarmEditModal'
import FarmHarvests from './FarmHarvests'
import FarmHeader from './FarmHeader'
import FarmStats from './FarmStats'
import GroveHealthTab from './GroveHealthTab'

interface FarmDetailContentProps {
  farm: any // We'll type this properly later
  user: any
}

type FarmTabId = 'overview' | 'activities' | 'harvests' | 'grove-health' | 'ai-geoponos'

const LOCKED_TAB_HINTS: Partial<Record<FarmTabId, { title: string; tooltip: string }>> = {
  'grove-health': {
    title: 'Ξεκλειδώστε την Υγεία Ελαιώνα',
    tooltip: 'Απαιτείται πλάνο Παραγωγός — αναβαθμίστε για δορυφορικό NDVI',
  },
  'ai-geoponos': {
    title: 'Ξεκλειδώστε τον AI Γεωπόνο',
    tooltip: 'Απαιτείται πλάνο Αγρότης — αναβαθμίστε για πρόσβαση',
  },
}

export default function FarmDetailContent({ farm, user }: FarmDetailContentProps) {
  const router = useRouter()
  const { isLoading: isPlanLoading, can } = usePlan()
  const [activeTab, setActiveTab] = useState<FarmTabId>('overview')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [pricingModalTitle, setPricingModalTitle] = useState('Αναβαθμίστε το πλάνο σας')
  const [unreadInsightsCount, setUnreadInsightsCount] = useState(0)

  const canUseAiGeoponos = !isPlanLoading && can('aiGeoponos')
  const canUseGroveHealth = !isPlanLoading && can('satellite')

  const isTabLocked = (tabId: FarmTabId) => {
    if (tabId === 'grove-health') return !canUseGroveHealth
    if (tabId === 'ai-geoponos') return !canUseAiGeoponos
    return false
  }

  // Fetch unread insights count
  const fetchUnreadCount = useCallback(async () => {
    if (!canUseAiGeoponos) return
    try {
      const response = await fetch(`/api/insights/${farm.id}`)
      if (response.ok) {
        const data = await response.json()
        setUnreadInsightsCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch insights count:', error)
    }
  }, [farm.id, canUseAiGeoponos])

  useEffect(() => {
    if (canUseAiGeoponos) fetchUnreadCount()
  }, [fetchUnreadCount, canUseAiGeoponos])

  useEffect(() => {
    if (
      (activeTab === 'ai-geoponos' && !canUseAiGeoponos) ||
      (activeTab === 'grove-health' && !canUseGroveHealth)
    ) {
      setActiveTab('overview')
    }
  }, [canUseAiGeoponos, canUseGroveHealth, activeTab])

  // Reset unread count when viewing AI tab
  useEffect(() => {
    if (canUseAiGeoponos && activeTab === 'ai-geoponos') {
      // Refetch after a delay to get updated count
      const timer = setTimeout(fetchUnreadCount, 2000)
      return () => clearTimeout(timer)
    }
  }, [activeTab, fetchUnreadCount])

  const tabs = [
    { id: 'overview', label: 'Επισκόπηση', icon: BarChart3 },
    { id: 'activities', label: 'Δραστηριότητες', icon: Activity },
    { id: 'harvests', label: 'Συγκομιδές', icon: Wheat },
    { id: 'grove-health', label: 'Υγεία Ελαιώνα', icon: Satellite },
    { id: 'ai-geoponos', label: 'AI Γεωπόνος', icon: Sparkles, badge: unreadInsightsCount },
  ]

  const isReadOnly = farm.isActive === false

  return (
    <>
      <div className={`min-h-screen ${isReadOnly ? 'bg-gray-100' : 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-100'}`}>
        {isReadOnly && (
          <div className="bg-gray-200 border-b border-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span>
                  Αυτός ο ελαιώνας είναι ανενεργός λόγω ορίων προγράμματος. Μπορείτε να δείτε τα δεδομένα, αλλά όχι να τα επεξεργαστείτε.
                </span>
              </div>
              <Link
                href="/dashboard/settings#subscription"
                className="text-sm font-semibold text-olive-700 hover:text-olive-800 whitespace-nowrap"
              >
                Αναβάθμιση πλάνου →
              </Link>
            </div>
          </div>
        )}

        {/* Farm Header */}
        <FarmHeader
          farm={farm}
          user={user}
          onEdit={() => setShowEditModal(true)}
          onBack={() => router.push('/dashboard')}
          readOnly={isReadOnly}
        />

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-10 shadow-sm sm:shadow-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative group">
            {/* Right scroll indicator hint for mobile */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-20 sm:hidden" />

            <div className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide py-1 sm:py-0">
              {tabs.map((tab) => {
                const tabId = tab.id as FarmTabId
                const isLocked = isTabLocked(tabId)
                const lockHint = LOCKED_TAB_HINTS[tabId]
                const Icon = isLocked ? Lock : tab.icon
                const badge = canUseAiGeoponos && 'badge' in tab ? (tab.badge ?? 0) : 0
                const isActive = !isLocked && activeTab === tabId

                return (
                  <button
                    key={tab.id}
                    type="button"
                    title={isLocked ? lockHint?.tooltip : undefined}
                    onClick={() => {
                      if (isLocked && lockHint) {
                        setPricingModalTitle(lockHint.title)
                        setShowPricingModal(true)
                        return
                      }
                      setActiveTab(tabId)
                    }}
                    className={`flex items-center space-x-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                      isLocked
                        ? 'border-transparent text-gray-400 opacity-75 cursor-pointer hover:opacity-90'
                        : isActive
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                    {badge > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] sm:text-xs font-bold bg-emerald-500 text-white rounded-full min-w-[1.25rem] text-center">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' && <FarmStats farm={farm} />}
          {activeTab === 'activities' && <FarmActivities farm={farm} readOnly={isReadOnly} />}
          {activeTab === 'harvests' && <FarmHarvests farm={farm} readOnly={isReadOnly} />}
          {canUseGroveHealth && activeTab === 'grove-health' && (
            <GroveHealthTab farmId={farm.id} readOnly={isReadOnly} />
          )}
          {canUseAiGeoponos && activeTab === 'ai-geoponos' && (
            <AIGeoponosTab farmId={farm.id} readOnly={isReadOnly} />
          )}
        </div>
      </div>

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        title={pricingModalTitle}
      />

      {/* Edit Modal */}
      {showEditModal && !isReadOnly && (
        <FarmEditModal
          farm={farm}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
} 