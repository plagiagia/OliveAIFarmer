'use client'

import {
  Activity,
  BarChart3,
  Satellite,
  Sparkles,
  Wheat
} from 'lucide-react'
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

export default function FarmDetailContent({ farm, user }: FarmDetailContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'harvests' | 'grove-health' | 'ai-geoponos'>('overview')
  const [showEditModal, setShowEditModal] = useState(false)
  const [unreadInsightsCount, setUnreadInsightsCount] = useState(0)

  // Fetch unread insights count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(`/api/insights/${farm.id}`)
      if (response.ok) {
        const data = await response.json()
        setUnreadInsightsCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch insights count:', error)
    }
  }, [farm.id])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Reset unread count when viewing AI tab
  useEffect(() => {
    if (activeTab === 'ai-geoponos') {
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

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100">
        {/* Farm Header */}
        <FarmHeader
          farm={farm}
          user={user}
          onEdit={() => setShowEditModal(true)}
          onBack={() => router.push('/dashboard')}
        />

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-10 shadow-sm sm:shadow-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide py-1 sm:py-0">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const badge = 'badge' in tab ? (tab.badge ?? 0) : 0
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'overview' | 'activities' | 'harvests' | 'grove-health' | 'ai-geoponos')}
                    className={`flex items-center space-x-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
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
          {activeTab === 'activities' && <FarmActivities farm={farm} />}
          {activeTab === 'harvests' && <FarmHarvests farm={farm} />}
          {activeTab === 'grove-health' && <GroveHealthTab farmId={farm.id} />}
          {activeTab === 'ai-geoponos' && <AIGeoponosTab farmId={farm.id} />}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
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