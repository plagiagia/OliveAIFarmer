'use client'

import { ACTIVITY_TYPE_LABELS, ActivityFormData, ActivityWithTrees } from '@/lib/types/activity'
import { ActivityType } from '@prisma/client'
import { Activity, CheckCircle2, Clock, Filter, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import ActivityCard from '../activities/ActivityCard'
import ActivityFormModal from '../activities/ActivityFormModal'

interface FarmActivitiesProps {
  farm: any
}

export default function FarmActivities({ farm }: FarmActivitiesProps) {
  const [activities, setActivities] = useState<ActivityWithTrees[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityWithTrees[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingActivity, setEditingActivity] = useState<ActivityWithTrees | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL')
  const [sortBy, setSortBy] = useState<'date' | 'created' | 'title'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Load activities
  const loadActivities = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/activities?farmId=${farm.id}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      } else {
        console.error('Failed to load activities')
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...activities]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(activity => activity.type === typeFilter)
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(activity => 
        statusFilter === 'COMPLETED' ? activity.completed : !activity.completed
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date)
          bValue = new Date(b.date)
          break
        case 'created':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        default:
          aValue = new Date(a.date)
          bValue = new Date(b.date)
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredActivities(filtered)
  }, [activities, searchTerm, typeFilter, statusFilter, sortBy, sortOrder])

  // Load activities on mount
  useEffect(() => {
    loadActivities()
  }, [farm.id])

  // Handle form submission
  const handleSubmit = async (formData: ActivityFormData) => {
    setIsSubmitting(true)
    try {
      const url = editingActivity ? `/api/activities/${editingActivity.id}` : '/api/activities'
      const method = editingActivity ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, farmId: farm.id })
      })

      if (response.ok) {
        await loadActivities()
        setShowFormModal(false)
        setEditingActivity(null)
      } else {
        console.error('Failed to save activity')
      }
    } catch (error) {
      console.error('Error saving activity:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle activity deletion
  const handleDelete = async (activityId: string) => {
    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadActivities()
      } else {
        console.error('Failed to delete activity')
      }
    } catch (error) {
      console.error('Error deleting activity:', error)
    }
  }

  // Handle toggle completion
  const handleToggleComplete = async (activityId: string, completed: boolean) => {
    try {
      const activity = activities.find(a => a.id === activityId)
      if (!activity) return

      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...activity,
          completed,
          date: new Date(activity.date).toISOString().split('T')[0],
          duration: activity.duration?.toString() || '',
          cost: activity.cost?.toString() || '',
          selectedTrees: activity.treeActivities?.map(ta => ta.treeId) || []
        })
      })

      if (response.ok) {
        await loadActivities()
      } else {
        console.error('Failed to update activity')
      }
    } catch (error) {
      console.error('Error updating activity:', error)
    }
  }

  // Handle edit
  const handleEdit = (activity: ActivityWithTrees) => {
    setEditingActivity(activity)
    setShowFormModal(true)
  }

  // Handle new activity
  const handleNewActivity = () => {
    setEditingActivity(null)
    setShowFormModal(true)
  }

  // Activity statistics
  const totalActivities = activities.length
  const completedActivities = activities.filter(a => a.completed).length
  const pendingActivities = totalActivities - completedActivities
  const totalCost = activities.reduce((sum, a) => sum + (a.cost || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Δραστηριότητες</h2>
          <p className="text-gray-600">Καταγραφή και διαχείριση εργασιών στον ελαιώνα</p>
        </div>
        <button 
          onClick={handleNewActivity}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Νέα Δραστηριότητα</span>
        </button>
      </div>

      {/* Statistics */}
      {totalActivities > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-gray-600">Σύνολο</div>
                <div className="text-xl font-bold text-gray-900">{totalActivities}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm font-medium text-gray-600">Ολοκληρωμένες</div>
                <div className="text-xl font-bold text-gray-900">{completedActivities}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-sm font-medium text-gray-600">Εκκρεμείς</div>
                <div className="text-xl font-bold text-gray-900">{pendingActivities}</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">€</span>
              <div>
                <div className="text-sm font-medium text-gray-600">Συνολικό Κόστος</div>
                <div className="text-xl font-bold text-gray-900">€{totalCost.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      {totalActivities > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Αναζήτηση δραστηριοτήτων..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ActivityType | 'ALL')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="ALL">Όλοι οι τύποι</option>
              {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'COMPLETED' | 'PENDING')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="ALL">Όλες οι καταστάσεις</option>
              <option value="COMPLETED">Ολοκληρωμένες</option>
              <option value="PENDING">Εκκρεμείς</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-')
                setSortBy(by as 'date' | 'created' | 'title')
                setSortOrder(order as 'asc' | 'desc')
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="date-desc">Νεότερη ημερομηνία</option>
              <option value="date-asc">Παλαιότερη ημερομηνία</option>
              <option value="created-desc">Πρόσφατα δημιουργημένες</option>
              <option value="created-asc">Παλαιότερα δημιουργημένες</option>
              <option value="title-asc">Τίτλος (Α-Ω)</option>
              <option value="title-desc">Τίτλος (Ω-Α)</option>
            </select>
          </div>
        </div>
      )}

      {/* Activities List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Φόρτωση δραστηριοτήτων...</p>
        </div>
      ) : filteredActivities.length > 0 ? (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleComplete={handleToggleComplete}
              isLoading={isSubmitting}
            />
          ))}
        </div>
      ) : activities.length > 0 ? (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν βρέθηκαν δραστηριότητες</h3>
          <p className="text-gray-500 mb-6">Δοκιμάστε να αλλάξετε τα φίλτρα αναζήτησης</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setTypeFilter('ALL')
              setStatusFilter('ALL')
            }}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Καθαρισμός φίλτρων
          </button>
        </div>
      ) : (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν υπάρχουν δραστηριότητες ακόμα</h3>
          <p className="text-gray-500 mb-6">Καταγράψτε τις εργασίες στον ελαιώνα σας</p>
          <button 
            onClick={handleNewActivity}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Καταγραφή Πρώτης Δραστηριότητας
          </button>
        </div>
      )}

      {/* Form Modal */}
      <ActivityFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false)
          setEditingActivity(null)
        }}
        onSubmit={handleSubmit}
        farmId={farm.id}
        trees={farm.trees || []}
        activity={editingActivity}
        isLoading={isSubmitting}
      />
    </div>
  )
} 