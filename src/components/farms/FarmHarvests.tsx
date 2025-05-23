'use client'

import { Plus, Wheat } from 'lucide-react'

interface FarmHarvestsProps {
  farm: any
}

export default function FarmHarvests({ farm }: FarmHarvestsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Συγκομιδές</h2>
        <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Νέα Συγκομιδή</span>
        </button>
      </div>

      {farm.harvests && farm.harvests.length > 0 ? (
        <div className="space-y-4">
          {farm.harvests.map((harvest: any) => (
            <div key={harvest.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Wheat className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Συγκομιδή {harvest.year}</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Έτος:</span>
                  <div>{harvest.year}</div>
                </div>
                {harvest.totalYield && (
                  <div>
                    <span className="font-medium">Παραγωγή:</span>
                    <div>{harvest.totalYield} kg</div>
                  </div>
                )}
                {harvest.oilExtracted && (
                  <div>
                    <span className="font-medium">Λάδι:</span>
                    <div>{harvest.oilExtracted} λίτρα</div>
                  </div>
                )}
                <div>
                  <span className="font-medium">Κατάσταση:</span>
                  <div>{harvest.completed ? 'Ολοκληρώθηκε' : 'Σε εξέλιξη'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Wheat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν υπάρχουν συγκομιδές ακόμα</h3>
          <p className="text-gray-500 mb-6">Καταγράψτε τις συγκομιδές του ελαιώνα σας</p>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
            Καταγραφή Πρώτης Συγκομιδής
          </button>
        </div>
      )}
    </div>
  )
} 