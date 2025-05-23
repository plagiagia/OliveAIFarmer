'use client'

import MapPreview from '@/components/map/MapPreview'
import { parseCoordinates } from '@/lib/mapbox-utils'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import { Activity, MapPin, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Farm {
  id: string
  name: string
  location: string
  coordinates: string | null
  totalArea: number | null
  treesCount: number
  sectionsCount: number
  lastActivityDate: Date | null
  activitiesCount: number
  harvestsCount: number
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  farms: Farm[]
}

interface DashboardContentProps {
  user: User | null
  clerkUserId: string
}

export default function DashboardContent({ user, clerkUserId }: DashboardContentProps) {
  const [isLoading, setIsLoading] = useState(!user)
  const [userData, setUserData] = useState(user)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showDeleteMessage, setShowDeleteMessage] = useState(false)

  useEffect(() => {
    // If user is not in database, sync them
    if (!user) {
      syncUserWithDatabase()
    }
    
    // Check for success messages
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('created') === 'true') {
      setShowSuccessMessage(true)
      // Remove the parameter from URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      // Hide message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000)
    }
    
    if (urlParams.get('deleted') === 'true') {
      setShowDeleteMessage(true)
      // Remove the parameter from URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      // Hide message after 5 seconds
      setTimeout(() => setShowDeleteMessage(false), 5000)
    }
  }, [user])

  const syncUserWithDatabase = async () => {
    try {
      const response = await fetch('/api/sync-user', {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Refresh the page to get updated user data
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('Failed to sync user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="text-6xl mb-6">🫒</div>
          <p className="text-xl text-gray-600">Φόρτωση του προφίλ σας...</p>
        </div>
      </div>
    )
  }

  // If user has no farms, show onboarding
  if (!userData?.farms || userData.farms.length === 0) {
    return <OnboardingView user={userData} />
  }

  // Show dashboard with farms
  return <FarmsView user={userData} showSuccessMessage={showSuccessMessage} showDeleteMessage={showDeleteMessage} />
}

function OnboardingView({ user }: { user: User | null }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <div className="text-6xl mb-6">🫒</div>
        <h1 className="text-4xl font-bold text-olive-800 mb-4">
          Καλώς ήρθατε{user?.firstName ? ` ${user.firstName}` : ''} στο ΕλαιοLog!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Ας δημιουργήσουμε τον πρώτο σας ελαιώνα
        </p>
        
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-olive-700 mb-6">
            Ξεκινήστε τη διαχείριση του ελαιώνα σας
          </h2>
          
          <div className="space-y-4 text-left mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-olive-100 rounded-full flex items-center justify-center">
                <span className="text-olive-700 font-semibold">1</span>
              </div>
              <span className="text-gray-700">Προσθήκη βασικών πληροφοριών ελαιώνα</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-olive-100 rounded-full flex items-center justify-center">
                <span className="text-olive-700 font-semibold">2</span>
              </div>
              <span className="text-gray-700">Οργάνωση σε τμήματα και δέντρα</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-olive-100 rounded-full flex items-center justify-center">
                <span className="text-olive-700 font-semibold">3</span>
              </div>
              <span className="text-gray-700">Ξεκίνημα καταγραφής δραστηριοτήτων</span>
            </div>
          </div>
          
          <button 
            onClick={() => {
              window.location.href = '/dashboard/farms/new'
            }}
            className="bg-gradient-to-r from-olive-700 to-olive-600 hover:from-olive-800 hover:to-olive-700 text-white py-3 px-8 rounded-2xl font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Δημιουργήστε τον πρώτο σας ελαιώνα
          </button>
        </div>
      </div>
    </div>
  )
}

function FarmsView({ user, showSuccessMessage, showDeleteMessage }: { 
  user: User; 
  showSuccessMessage: boolean; 
  showDeleteMessage: boolean; 
}) {
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null)
  const [farms, setFarms] = useState(user.farms)

  const handleEditSuccess = () => {
    setEditingFarm(null)
    // Refresh the page to get updated data
    window.location.reload()
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Messages */}
        {showSuccessMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center">
            <div className="text-2xl mr-3">🎉</div>
            <div>
              <strong>Επιτυχής δημιουργία!</strong>
              <p className="text-sm mt-1">Ο ελαιώνας σας δημιουργήθηκε επιτυχώς. Μπορείτε τώρα να προσθέσετε δέντρα και δραστηριότητες.</p>
            </div>
          </div>
        )}
        
        {showDeleteMessage && (
          <div className="bg-orange-50 border border-orange-200 text-orange-700 px-6 py-4 rounded-xl mb-6 flex items-center">
            <div className="text-2xl mr-3">🗑️</div>
            <div>
              <strong>Επιτυχής διαγραφή!</strong>
              <p className="text-sm mt-1">Ο ελαιώνας διαγράφηκε επιτυχώς από το σύστημα.</p>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-olive-800">
              Καλώς ήρθατε, {user.firstName}!
            </h1>
            <p className="text-gray-600 mt-2">
              Διαχειριστείτε {user.farms.length === 1 ? 'τον ελαιώνα σας' : `τους ${user.farms.length} ελαιώνες σας`}
            </p>
          </div>
          <button 
            onClick={() => {
              window.location.href = '/dashboard/farms/new'
            }}
            className="bg-gradient-to-r from-olive-700 to-olive-600 hover:from-olive-800 hover:to-olive-700 text-white py-2 px-4 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Νέος Ελαιώνας
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-olive-600 mb-2">🫒</div>
            <div className="text-2xl font-bold text-gray-800">
              {user.farms.reduce((sum, farm) => sum + farm.treesCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Συνολικά Δέντρα</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-olive-600 mb-2">📊</div>
            <div className="text-2xl font-bold text-gray-800">
              {user.farms.reduce((sum, farm) => sum + (farm.totalArea || 0), 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Στρέμματα</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-olive-600 mb-2">📝</div>
            <div className="text-2xl font-bold text-gray-800">
              {user.farms.reduce((sum, farm) => sum + farm.activitiesCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Δραστηριότητες</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-olive-600 mb-2">🏆</div>
            <div className="text-2xl font-bold text-gray-800">
              {user.farms.reduce((sum, farm) => sum + farm.harvestsCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Συγκομιδές</div>
          </div>
        </div>

        {/* Farms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {user.farms.map((farm) => (
            <FarmCard key={farm.id} farm={farm} onEdit={setEditingFarm} />
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingFarm && (
        <FarmEditModal
          farm={editingFarm}
          onClose={() => setEditingFarm(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  )
}

function FarmCard({ farm, onEdit }: { farm: Farm; onEdit: (farm: Farm | null) => void }) {
  const handleFarmClick = () => {
    window.location.href = `/dashboard/farms/${farm.id}`
  }

  const coordinates = farm.coordinates ? parseCoordinates(farm.coordinates) : null

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group"
      onClick={handleFarmClick}
    >
      {/* Map Preview */}
      <div className="h-32 relative">
        {coordinates ? (
          <MapPreview
            longitude={coordinates.lng}
            latitude={coordinates.lat}
            farmName={farm.name}
            zoom={13}
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
            <div className="text-center text-green-700">
              <MapPin className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Χωρίς συντεταγμένες</p>
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-olive-700 transition-colors">
          {farm.name}
        </h3>
        
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="text-sm">{farm.location}</span>
        </div>

        {farm.totalArea && (
          <div className="text-sm text-gray-600 mb-4">
            <span className="font-medium">{farm.totalArea} στρέμματα</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-lg font-semibold text-olive-700">{farm.treesCount}</div>
            <div className="text-gray-600">Δέντρα</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-olive-700">{farm.activitiesCount}</div>
            <div className="text-gray-600">Δραστηριότητες</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-olive-700">{farm.harvestsCount}</div>
            <div className="text-gray-600">Συγκομιδές</div>
          </div>
        </div>

        {farm.lastActivityDate && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <Activity className="w-3 h-3 mr-1" />
              <span>
                Τελευταία δραστηριότητα: {format(new Date(farm.lastActivityDate), 'dd/MM/yyyy', { locale: el })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 