'use client'

import { BarChart3, Calendar, Edit, Euro, Plus, TreePine, TrendingUp, Wheat } from 'lucide-react'
import { useState } from 'react'
import HarvestCreateModal from './HarvestCreateModal'

interface FarmHarvestsProps {
  farm: any
}

export default function FarmHarvests({ farm }: FarmHarvestsProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1)
    // Optionally refresh the page to get updated data
    window.location.reload()
  }

  // Calculate some aggregate statistics
  const totalYield = farm.harvests?.reduce((sum: number, h: any) => sum + (h.totalYield || 0), 0) || 0
  const averageYield = farm.harvests?.length > 0 ? totalYield / farm.harvests.length : 0
  const totalValue = farm.harvests?.reduce((sum: number, h: any) => sum + (h.totalValue || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Συγκομιδές</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Νέα Συγκομιδή</span>
        </button>
      </div>

      {/* Summary Statistics */}
      {farm.harvests && farm.harvests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Συνολική Παραγωγή</p>
                <p className="text-2xl font-bold text-green-700">{totalYield.toFixed(0)} kg</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Μέσος Όρος/Έτος</p>
                <p className="text-2xl font-bold text-blue-700">{averageYield.toFixed(0)} kg</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Συνολική Αξία</p>
                <p className="text-2xl font-bold text-amber-700">€{totalValue.toFixed(2)}</p>
              </div>
              <Euro className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Συγκομιδές</p>
                <p className="text-2xl font-bold text-purple-700">{farm.harvests.length}</p>
              </div>
              <Wheat className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {farm.harvests && farm.harvests.length > 0 ? (
        <div className="space-y-4">
          {farm.harvests
            .sort((a: any, b: any) => b.year - a.year) // Sort by year, newest first
            .map((harvest: any) => (
            <div key={harvest.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Wheat className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Συγκομιδή {harvest.year}</h3>
                    {harvest.qualityGrade && (
                      <p className="text-sm text-gray-600">Ποιότητα: {harvest.qualityGrade}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    harvest.completed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {harvest.completed ? 'Ολοκληρώθηκε' : 'Σε εξέλιξη'}
                  </span>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              
              {/* Main metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-olive-700">{harvest.totalYield || 0}</div>
                  <div className="text-sm text-gray-600">kg</div>
                </div>
                
                {harvest.totalYieldTons && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">{harvest.totalYieldTons.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">τόνοι</div>
                  </div>
                )}
                
                {harvest.yieldPerTree && farm.trees && farm.trees.length > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700 flex items-center justify-center">
                      <TreePine className="w-5 h-5 mr-1" />
                      {harvest.yieldPerTree.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">kg/δέντρο</div>
                  </div>
                )}
                
                {harvest.yieldPerStremma && farm.totalArea && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-700">{harvest.yieldPerStremma.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">kg/στρέμμα</div>
                  </div>
                )}
              </div>

              {/* Financial information */}
              {(harvest.pricePerKg || harvest.pricePerTon || harvest.totalValue) && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Euro className="w-4 h-4 mr-2 text-blue-600" />
                    Οικονομικά Στοιχεία
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {harvest.pricePerKg && (
                      <div>
                        <span className="font-medium">Τιμή/kg:</span>
                        <div className="text-blue-700">€{harvest.pricePerKg.toFixed(3)}</div>
                      </div>
                    )}
                    {harvest.pricePerTon && (
                      <div>
                        <span className="font-medium">Τιμή/τόνο:</span>
                        <div className="text-blue-700">€{harvest.pricePerTon.toFixed(2)}</div>
                      </div>
                    )}
                    {harvest.totalValue && (
                      <div>
                        <span className="font-medium">Συνολική Αξία:</span>
                        <div className="text-xl font-bold text-green-700">€{harvest.totalValue.toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Έναρξη:</span>
                  <div className="flex items-center mt-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(harvest.startDate).toLocaleDateString('el-GR')}
                  </div>
                </div>
                
                {harvest.endDate && (
                  <div>
                    <span className="font-medium">Λήξη:</span>
                    <div className="flex items-center mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(harvest.endDate).toLocaleDateString('el-GR')}
                    </div>
                  </div>
                )}
                
                {harvest.oilExtracted && (
                  <div>
                    <span className="font-medium">Λάδι:</span>
                    <div>{harvest.oilExtracted} λίτρα</div>
                  </div>
                )}
                
                {harvest.oilYieldPercent && (
                  <div>
                    <span className="font-medium">Απόδοση λαδιού:</span>
                    <div>{harvest.oilYieldPercent.toFixed(1)}%</div>
                  </div>
                )}
              </div>

              {harvest.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Σημειώσεις:</span> {harvest.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Wheat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν υπάρχουν συγκομιδές ακόμα</h3>
          <p className="text-gray-500 mb-6">Καταγράψτε τις συγκομιδές του ελαιώνα σας με πλήρη οικονομικά στοιχεία</p>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-colors"
          >
            Καταγραφή Πρώτης Συγκομιδής
          </button>
        </div>
      )}

      {/* Create Harvest Modal */}
      <HarvestCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        farmId={farm.id}
        farmData={{
          name: farm.name,
          totalArea: farm.totalArea,
          treesCount: farm.trees?.length || 0
        }}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
} 