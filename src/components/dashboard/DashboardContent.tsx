'use client'

import CalendarActivityModal from '@/components/calendar/CalendarActivityModal'
import FarmCalendar from '@/components/calendar/FarmCalendar'
import FarmEditModal from '@/components/farms/FarmEditModal'
import MapPreview from '@/components/map/MapPreview'
import OliveIcon from '@/components/ui/OliveIcon'
import { parseCoordinates } from '@/lib/mapbox-utils'
import { ACTIVITY_TYPE_COLORS, ACTIVITY_TYPE_ICONS, ActivityType } from '@/types/activity'
import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import { Activity, BarChart3, Filter, MapPin, Plus, Sparkles, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface Farm {
  id: string
  name: string
  location: string
  coordinates: string | null
  totalArea: number | null
  treesCount: number
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

export default function DashboardContent({ user, clerkUserId: _clerkUserId }: DashboardContentProps) {
  const [isLoading, setIsLoading] = useState(!user)
  const [userData, _setUserData] = useState(user)
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
          <div className="mb-6 flex justify-center">
            <OliveIcon size="2xl" className="text-olive-600" />
          </div>
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
        <div className="mb-6 flex justify-center">
          <OliveIcon size="2xl" className="text-olive-600" />
        </div>
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
              <span className="text-gray-700">Προσθήκη δέντρων στον ελαιώνα</span>
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

interface CalendarActivity {
  id: string
  type: ActivityType
  title: string
  date: Date | string
  completed: boolean
  farmId: string
  farmName?: string
}

function FarmsView({ user, showSuccessMessage, showDeleteMessage }: {
  user: User;
  showSuccessMessage: boolean;
  showDeleteMessage: boolean;
}) {
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null)
  // Note: farms state is intentionally unused - using user.farms directly, reload for updates
  const [_farms, _setFarms] = useState(user.farms)

  // Calendar state
  const [calendarActivities, setCalendarActivities] = useState<CalendarActivity[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [activityTypeFilter, setActivityTypeFilter] = useState<ActivityType | 'ALL'>('ALL')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  // Fetch all activities from all farms
  const fetchAllActivities = useCallback(async () => {
    setIsLoadingActivities(true)
    try {
      const allActivities: CalendarActivity[] = []

      for (const farm of user.farms) {
        const response = await fetch(`/api/activities?farmId=${farm.id}`)
        if (response.ok) {
          const activities = await response.json()
          activities.forEach((activity: { id: string; type: ActivityType; title: string; date: string; completed: boolean }) => {
            allActivities.push({
              ...activity,
              farmId: farm.id,
              farmName: farm.name
            })
          })
        }
      }

      setCalendarActivities(allActivities)
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setIsLoadingActivities(false)
    }
  }, [user.farms])

  useEffect(() => {
    fetchAllActivities()
  }, [fetchAllActivities])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setShowActivityModal(true)
  }

  const handleActivityClick = (activity: CalendarActivity) => {
    // Navigate to the farm's activities page
    window.location.href = `/dashboard/farms/${activity.farmId}?tab=activities`
  }

  const handleActivityCreated = () => {
    fetchAllActivities()
    // Refresh page to update counts
    setTimeout(() => window.location.reload(), 500)
  }

  const handleEditSuccess = () => {
    setEditingFarm(null)
    // Refresh the page to get updated data
    window.location.reload()
  }

  // Filter activities for calendar
  const filteredActivities = activityTypeFilter === 'ALL'
    ? calendarActivities
    : calendarActivities.filter(a => a.type === activityTypeFilter)

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-olive-800">
              Καλώς ήρθατε, {user.firstName}!
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:base">
              Διαχειριστείτε {user.farms.length === 1 ? 'τον ελαιώνα σας' : `τους ${user.farms.length} ελαιώνες σας`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Link
              href="/dashboard/ai-geoponos"
              className="flex-1 sm:flex-none justify-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2 px-3 sm:px-4 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-lg flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span className="whitespace-nowrap">AI Γεωπόνος</span>
            </Link>
            <Link
              href="/dashboard/analytics"
              className="flex-1 sm:flex-none justify-center bg-white border border-gray-200 hover:border-olive-300 text-gray-700 hover:text-olive-700 py-2 px-3 sm:px-4 rounded-xl font-medium text-sm transition-all duration-200 hover:shadow-md flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="whitespace-nowrap">Αναλύσεις</span>
            </Link>
            <button
              onClick={() => {
                window.location.href = '/dashboard/farms/new'
              }}
              className="w-full sm:w-auto justify-center bg-gradient-to-r from-olive-700 to-olive-600 hover:from-olive-800 hover:to-olive-700 text-white py-2 px-3 sm:px-4 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="whitespace-nowrap">Νέος Ελαιώνας</span>
            </button>
          </div>
        </div>

        {/* Stats Overview - Horizontal Row */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-olive-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <OliveIcon size="md" className="text-olive-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                  {user.farms.reduce((sum, farm) => sum + farm.treesCount, 0)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 truncate">Δέντρα</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                📊
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                  {user.farms.reduce((sum, farm) => sum + (farm.totalArea || 0), 0).toFixed(1)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 truncate">Στρέμματα</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-green-700" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                  {user.farms.reduce((sum, farm) => sum + farm.activitiesCount, 0)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 truncate">Δραστηριότητες</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 text-amber-700" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                  {user.farms.reduce((sum, farm) => sum + farm.harvestsCount, 0)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 truncate">Συγκομιδές</div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="mb-8">
          {isLoadingActivities ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-olive-200 border-t-olive-600 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Φόρτωση ημερολογίου...</p>
            </div>
          ) : (
            <FarmCalendar
              activities={filteredActivities}
              onDateSelect={handleDateSelect}
              onActivityClick={handleActivityClick}
              filterElement={
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className={`p-2 rounded-lg transition-colors ${activityTypeFilter !== 'ALL'
                        ? 'bg-olive-100 text-olive-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    title="Φίλτρο δραστηριοτήτων"
                  >
                    <Filter className="w-4 h-4" />
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                      <button
                        onClick={() => { setActivityTypeFilter('ALL'); setShowFilterDropdown(false) }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${activityTypeFilter === 'ALL' ? 'text-olive-700 font-medium' : 'text-gray-700'
                          }`}
                      >
                        Όλα
                      </button>
                      {Object.entries(ACTIVITY_TYPE_ICONS).map(([type, icon]) => (
                        <button
                          key={type}
                          onClick={() => { setActivityTypeFilter(type as ActivityType); setShowFilterDropdown(false) }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${activityTypeFilter === type ? 'text-olive-700 font-medium' : 'text-gray-700'
                            }`}
                        >
                          <span>{icon}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${ACTIVITY_TYPE_COLORS[type as ActivityType]}`}>
                            {type === 'WATERING' ? 'Πότισμα' :
                              type === 'PRUNING' ? 'Κλάδεμα' :
                                type === 'FERTILIZING' ? 'Λίπανση' :
                                  type === 'PEST_CONTROL' ? 'Ψεκασμός' :
                                    type === 'SOIL_WORK' ? 'Εδαφοκαλλιέργεια' :
                                      type === 'HARVESTING' ? 'Συγκομιδή' :
                                        type === 'MAINTENANCE' ? 'Συντήρηση' :
                                          type === 'INSPECTION' ? 'Επιθεώρηση' : 'Άλλο'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              }
            />
          )}

          {/* Last activity info */}
          {calendarActivities.length > 0 && (
            <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>
                Τελευταία δραστηριότητα: {format(
                  new Date(Math.max(...calendarActivities.map(a => new Date(a.date).getTime()))),
                  'dd/MM/yyyy',
                  { locale: el }
                )} (πριν {Math.floor((Date.now() - Math.max(...calendarActivities.map(a => new Date(a.date).getTime()))) / (1000 * 60 * 60 * 24))} μέρες)
              </span>
            </div>
          )}
        </div>

        {/* Farms Grid */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Οι Ελαιώνες σας</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {user.farms.map((farm) => (
              <FarmCard key={farm.id} farm={farm} onEdit={setEditingFarm} />
            ))}
          </div>
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

      {/* Calendar Activity Modal */}
      {showActivityModal && selectedDate && (
        <CalendarActivityModal
          isOpen={showActivityModal}
          onClose={() => { setShowActivityModal(false); setSelectedDate(null) }}
          selectedDate={selectedDate}
          farms={user.farms.map(f => ({ id: f.id, name: f.name, location: f.location, coordinates: f.coordinates, treeCount: f.treesCount }))}
          onSuccess={handleActivityCreated}
        />
      )}
    </>
  )
}

function FarmCard({ farm, onEdit: _onEdit }: { farm: Farm; onEdit: (farm: Farm | null) => void }) {
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
            <div className={`flex items-center text-xs transition-colors ${
              // Highlight if activity is within the last 7 days
              new Date().getTime() - new Date(farm.lastActivityDate).getTime() <= 7 * 24 * 60 * 60 * 1000
                ? 'text-green-600 bg-green-50 -mx-2 px-2 py-1 rounded-md'
                : 'text-gray-500'
              }`}>
              <Activity className="w-3 h-3 mr-1" />
              <span>
                Τελευταία δραστηριότητα: {format(new Date(farm.lastActivityDate), 'dd/MM/yyyy', { locale: el })}
                {/* Show how many days ago */}
                {(() => {
                  const daysDiff = Math.floor((new Date().getTime() - new Date(farm.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
                  if (daysDiff === 0) return ' (σήμερα)'
                  if (daysDiff === 1) return ' (χθες)'
                  if (daysDiff <= 7) return ` (πριν ${daysDiff} μέρες)`
                  if (daysDiff <= 30) return ` (πριν ${Math.floor(daysDiff / 7)} εβδομάδες)`
                  if (daysDiff <= 365) return ` (πριν ${Math.floor(daysDiff / 30)} μήνες)`
                  return ` (πριν ${Math.floor(daysDiff / 365)} χρόνια)`
                })()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 