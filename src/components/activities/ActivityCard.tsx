'use client'

import { ACTIVITY_TYPE_COLORS, ACTIVITY_TYPE_ICONS, ACTIVITY_TYPE_LABELS, ActivityWithTrees } from '@/lib/types/activity'
import {
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    CloudSun,
    Edit,
    Euro,
    FileText,
    MoreVertical,
    Trash2,
    TreePine
} from 'lucide-react'
import { useState } from 'react'

interface ActivityCardProps {
  activity: ActivityWithTrees
  onEdit: (activity: ActivityWithTrees) => void
  onDelete: (activityId: string) => void
  onToggleComplete: (activityId: string, completed: boolean) => void
  isLoading?: boolean
}

export default function ActivityCard({ 
  activity, 
  onEdit, 
  onDelete, 
  onToggleComplete,
  isLoading = false 
}: ActivityCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} λεπτά`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'ώρα' : 'ώρες'}`
    }
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')} ώρες`
  }

  const handleToggleComplete = async () => {
    setIsUpdating(true)
    try {
      await onToggleComplete(activity.id, !activity.completed)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = () => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη δραστηριότητα;')) {
      onDelete(activity.id)
    }
    setShowMenu(false)
  }

  const handleEdit = () => {
    onEdit(activity)
    setShowMenu(false)
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
      activity.completed ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
    }`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${ACTIVITY_TYPE_COLORS[activity.type]}`}>
              <span className="text-lg">{ACTIVITY_TYPE_ICONS[activity.type]}</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
                <button
                  onClick={handleToggleComplete}
                  disabled={isUpdating || isLoading}
                  className={`transition-colors ${
                    activity.completed 
                      ? 'text-green-600 hover:text-green-700' 
                      : 'text-gray-400 hover:text-green-600'
                  } ${isUpdating ? 'opacity-50' : ''}`}
                  title={activity.completed ? 'Σημείωση ως ανολοκλήρωτη' : 'Σημείωση ως ολοκληρωμένη'}
                >
                  {isUpdating ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : activity.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${ACTIVITY_TYPE_COLORS[activity.type]}`}>
                  {ACTIVITY_TYPE_LABELS[activity.type]}
                </span>
                {activity.completed && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Ολοκληρώθηκε
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  <Edit className="w-4 h-4" />
                  <span>Επεξεργασία</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Διαγραφή</span>
                </button>
              </div>
            )}

            {/* Click outside to close menu */}
            {showMenu && (
              <div 
                className="fixed inset-0 z-0" 
                onClick={() => setShowMenu(false)}
              />
            )}
          </div>
        </div>

        {/* Description */}
        {activity.description && (
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">
            {activity.description}
          </p>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <div className="font-medium text-gray-900">Ημερομηνία</div>
              <div>{formatDate(activity.date)}</div>
            </div>
          </div>

          {activity.duration && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">Διάρκεια</div>
                <div>{formatTime(activity.duration)}</div>
              </div>
            </div>
          )}

          {activity.cost && activity.cost > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Euro className="w-4 h-4 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">Κόστος</div>
                <div>€{activity.cost.toFixed(2)}</div>
              </div>
            </div>
          )}

          {activity.weather && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CloudSun className="w-4 h-4 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">Καιρός</div>
                <div>{activity.weather}</div>
              </div>
            </div>
          )}
        </div>

        {/* Trees Section */}
        {activity.treeActivities && activity.treeActivities.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <TreePine className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-900">
                Δέντρα που επηρεάστηκαν ({activity.treeActivities.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {activity.treeActivities.slice(0, 6).map(treeActivity => (
                <span
                  key={treeActivity.id}
                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                >
                  #{treeActivity.tree.treeNumber} - {treeActivity.tree.variety}
                </span>
              ))}
              {activity.treeActivities.length > 6 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{activity.treeActivities.length - 6} ακόμα
                </span>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {activity.notes && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-start space-x-2">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">Σημειώσεις</div>
                <p className="text-sm text-gray-600 leading-relaxed">{activity.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer with timestamp */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
          <span>
            Δημιουργήθηκε: {new Date(activity.createdAt).toLocaleDateString('el-GR')}
          </span>
          {new Date(activity.updatedAt).getTime() !== new Date(activity.createdAt).getTime() && (
            <span>
              Τροποποιήθηκε: {new Date(activity.updatedAt).toLocaleDateString('el-GR')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
} 