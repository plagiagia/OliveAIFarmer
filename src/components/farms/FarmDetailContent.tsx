'use client'

import {
    Activity,
    BarChart3,
    TreePine,
    Wheat
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import FarmActivities from './FarmActivities'
import FarmEditModal from './FarmEditModal'
import FarmHarvests from './FarmHarvests'
import FarmHeader from './FarmHeader'
import FarmStats from './FarmStats'
import FarmTrees from './FarmTrees'

interface FarmDetailContentProps {
  farm: any // We'll type this properly later
  user: any
}

export default function FarmDetailContent({ farm, user }: FarmDetailContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'trees' | 'activities' | 'harvests'>('overview')
  const [showEditModal, setShowEditModal] = useState(false)

  const tabs = [
    { id: 'overview', label: 'Επισκόπηση', icon: BarChart3 },
    { id: 'trees', label: 'Δέντρα', icon: TreePine },
    { id: 'activities', label: 'Δραστηριότητες', icon: Activity },
    { id: 'harvests', label: 'Συγκομιδές', icon: Wheat },
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
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' && <FarmStats farm={farm} />}
          {activeTab === 'trees' && <FarmTrees farm={farm} />}
          {activeTab === 'activities' && <FarmActivities farm={farm} />}
          {activeTab === 'harvests' && <FarmHarvests farm={farm} />}
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