'use client'

import { format } from 'date-fns'
import { el } from 'date-fns/locale'
import { ArrowLeft, Calendar, Edit, FileText, MapPin, Ruler } from 'lucide-react'

interface FarmHeaderProps {
  farm: any
  user: any
  onEdit: () => void
  onBack: () => void
}

export default function FarmHeader({ farm, user, onEdit, onBack }: FarmHeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Πίσω στον Πίνακα Ελέγχου</span>
          </button>

          <button
            onClick={onEdit}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Επεξεργασία</span>
          </button>
        </div>

        {/* Farm Title & Basic Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {farm.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span>{farm.location}</span>
              </div>
              
              {farm.totalArea && (
                <div className="flex items-center space-x-2">
                  <Ruler className="w-4 h-4 text-green-600" />
                  <span>{farm.totalArea} εκτάρια</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-green-600" />
                <span>
                  Δημιουργήθηκε {format(new Date(farm.createdAt), 'dd MMMM yyyy', { locale: el })}
                </span>
              </div>
            </div>

            {farm.description && (
              <div className="flex items-start space-x-2 text-gray-700">
                <FileText className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm leading-relaxed">{farm.description}</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="font-semibold text-green-900 mb-4">Γρήγορα Στατιστικά</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Τμήματα:</span>
                <span className="font-semibold text-green-900">{farm.sections?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Δέντρα:</span>
                <span className="font-semibold text-green-900">{farm.trees?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Δραστηριότητες:</span>
                <span className="font-semibold text-green-900">{farm.activities?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Συγκομιδές:</span>
                <span className="font-semibold text-green-900">{farm.harvests?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* GPS Coordinates */}
        {farm.coordinates && (
          <div className="mt-4 text-sm text-gray-500">
            <span className="font-medium">Συντεταγμένες GPS:</span> {farm.coordinates}
          </div>
        )}
      </div>
    </div>
  )
} 