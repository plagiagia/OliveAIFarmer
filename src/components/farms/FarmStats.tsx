'use client'

import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import {
    Activity,
    Calendar,
    CheckCircle,
    Clock,
    TreePine,
    Wheat
} from 'lucide-react'

interface FarmStatsProps {
  farm: any
}

export default function FarmStats({ farm }: FarmStatsProps) {
  // Calculate statistics
  const totalTrees = farm.trees?.length || 0
  const totalActivities = farm.activities?.length || 0
  const totalHarvests = farm.harvests?.length || 0
  
  // Recent activity
  const recentActivities = farm.activities?.slice(0, 5) || []
  const upcomingActivities = farm.activities?.filter((activity: any) => 
    new Date(activity.date) > new Date() && !activity.completed
  ).slice(0, 3) || []

  const statCards = [
    {
      title: 'Συνολικά Δέντρα',
      value: totalTrees,
      icon: TreePine,
      color: 'bg-green-500',
      description: 'Ελιές στον ελαιώνα'
    },
    {
      title: 'Δραστηριότητες',
      value: totalActivities,
      icon: Activity,
      color: 'bg-orange-500',
      description: 'Καταγεγραμμένες εργασίες'
    },
    {
      title: 'Συγκομιδές',
      value: totalHarvests,
      icon: Wheat,
      color: 'bg-amber-500',
      description: 'Ετήσιες συγκομιδές'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{stat.title}</h3>
              <p className="text-sm text-gray-600">{stat.description}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 text-green-600 mr-2" />
            Πρόσφατες Δραστηριότητες
          </h3>
          
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${activity.completed ? 'bg-green-100' : 'bg-orange-100'}`}>
                    {activity.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(activity.date), 'dd MMM yyyy', { locale: el })}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.completed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {activity.completed ? 'Ολοκληρώθηκε' : 'Εκκρεμεί'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Δεν υπάρχουν δραστηριότητες ακόμα</p>
          )}
        </div>

        {/* Upcoming Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 text-green-600 mr-2" />
            Επερχόμενες Δραστηριότητες
          </h3>
          
          {upcomingActivities.length > 0 ? (
            <div className="space-y-4">
              {upcomingActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(activity.date), 'dd MMM yyyy', { locale: el })}
                    </p>
                  </div>
                  <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    Προγραμματισμένη
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Δεν υπάρχουν προγραμματισμένες δραστηριότητες</p>
          )}
        </div>
      </div>
    </div>
  )
} 