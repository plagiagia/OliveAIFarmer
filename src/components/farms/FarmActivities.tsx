'use client'

import { Activity, Plus } from 'lucide-react'

interface FarmActivitiesProps {
  farm: any
}

export default function FarmActivities({ farm }: FarmActivitiesProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Δραστηριότητες</h2>
        <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Νέα Δραστηριότητα</span>
        </button>
      </div>

      {farm.activities && farm.activities.length > 0 ? (
        <div className="space-y-4">
          {farm.activities.map((activity: any) => (
            <div key={activity.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
              </div>
              
              {activity.description && (
                <p className="text-gray-600 mb-4">{activity.description}</p>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Ημερομηνία:</span>
                  <div>{new Date(activity.date).toLocaleDateString('el-GR')}</div>
                </div>
                <div>
                  <span className="font-medium">Τύπος:</span>
                  <div>{activity.type}</div>
                </div>
                {activity.duration && (
                  <div>
                    <span className="font-medium">Διάρκεια:</span>
                    <div>{activity.duration} λεπτά</div>
                  </div>
                )}
                <div>
                  <span className="font-medium">Κατάσταση:</span>
                  <div>{activity.completed ? 'Ολοκληρώθηκε' : 'Εκκρεμεί'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν υπάρχουν δραστηριότητες ακόμα</h3>
          <p className="text-gray-500 mb-6">Καταγράψτε τις εργασίες στον ελαιώνα σας</p>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
            Καταγραφή Πρώτης Δραστηριότητας
          </button>
        </div>
      )}
    </div>
  )
} 