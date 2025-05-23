'use client'

import { Plus, TreePine } from 'lucide-react'

interface FarmTreesProps {
  farm: any
}

export default function FarmTrees({ farm }: FarmTreesProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Δέντρα Ελιάς</h2>
        <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Προσθήκη Δέντρου</span>
        </button>
      </div>

      {farm.trees && farm.trees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farm.trees.map((tree: any) => (
            <div key={tree.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TreePine className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Δέντρο #{tree.treeNumber}</h3>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Ποικιλία:</span>
                  <span className="font-medium">{tree.variety}</span>
                </div>
                {tree.age && (
                  <div className="flex justify-between">
                    <span>Ηλικία:</span>
                    <span className="font-medium">{tree.age} έτη</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Υγεία:</span>
                  <span className="font-medium">{tree.health}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <TreePine className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν υπάρχουν δέντρα ακόμα</h3>
          <p className="text-gray-500 mb-6">Προσθέστε δέντρα για να παρακολουθείτε τον ελαιώνα σας</p>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
            Προσθήκη Πρώτου Δέντρου
          </button>
        </div>
      )}
    </div>
  )
} 