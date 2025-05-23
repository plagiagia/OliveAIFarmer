'use client'

import { MapPin, Plus } from 'lucide-react'

interface FarmSectionsProps {
  farm: any
}

export default function FarmSections({ farm }: FarmSectionsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Τμήματα Ελαιώνα</h2>
        <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Προσθήκη Τμήματος</span>
        </button>
      </div>

      {farm.sections && farm.sections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farm.sections.map((section: any) => (
            <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                {section.area && (
                  <div className="flex justify-between">
                    <span>Έκταση:</span>
                    <span className="font-medium">{section.area} εκτάρια</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Δέντρα:</span>
                  <span className="font-medium">{section.trees?.length || 0}</span>
                </div>
                {section.soilType && (
                  <div className="flex justify-between">
                    <span>Έδαφος:</span>
                    <span className="font-medium">{section.soilType}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν υπάρχουν τμήματα ακόμα</h3>
          <p className="text-gray-500 mb-6">Δημιουργήστε τμήματα για καλύτερη οργάνωση του ελαιώνα σας</p>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
            Δημιουργία Πρώτου Τμήματος
          </button>
        </div>
      )}
    </div>
  )
} 