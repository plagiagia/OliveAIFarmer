'use client'

import { BarChart3, Calendar, CheckCircle, Clock, Edit, Euro, MapPin, Plus, TreePine, TrendingUp, Wheat } from 'lucide-react'
import { useState } from 'react'
import HarvestCreateModal from './HarvestCreateModal'

interface FarmHarvestsProps {
  farm: any
}

interface GroupedHarvest {
  year: number
  collections: any[]
  totalYield: number
  totalValue: number
  isCompleted: boolean
  startDate: Date
  endDate?: Date
}

export default function FarmHarvests({ farm }: FarmHarvestsProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1)
    // Optionally refresh the page to get updated data
    window.location.reload()
  }

  const handleCompleteHarvest = async (harvestId: string) => {
    try {
      const response = await fetch('/api/harvests/complete', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          harvestId,
          endDate: new Date().toISOString().split('T')[0]
        }),
      })

      if (response.ok) {
        handleCreateSuccess() // Refresh the data
      } else {
        console.error('Failed to complete harvest')
      }
    } catch (error) {
      console.error('Error completing harvest:', error)
    }
  }

  // Group harvests by year
  const groupHarvestsByYear = (harvests: any[]): GroupedHarvest[] => {
    const grouped = harvests.reduce((acc: Record<number, any[]>, harvest: any) => {
      if (!acc[harvest.year]) {
        acc[harvest.year] = []
      }
      acc[harvest.year].push(harvest)
      return acc
    }, {})

    return Object.entries(grouped)
      .map(([year, collections]) => {
        const sortedCollections = collections.sort((a, b) => 
          new Date(a.startDate || a.collectionDate).getTime() - new Date(b.startDate || b.collectionDate).getTime()
        )

        return {
          year: parseInt(year),
          collections: sortedCollections,
          totalYield: collections.reduce((sum, h) => sum + (h.totalYield || 0), 0),
          totalValue: collections.reduce((sum, h) => sum + (h.totalValue || 0), 0),
          isCompleted: collections.every(h => h.completed),
          startDate: new Date(Math.min(...collections.map(h => new Date(h.startDate || h.collectionDate).getTime()))),
          endDate: collections.some(h => h.endDate) ? 
            new Date(Math.max(...collections.filter(h => h.endDate).map(h => new Date(h.endDate).getTime()))) : 
            undefined
        }
      })
      .sort((a, b) => b.year - a.year)
  }

  const groupedHarvests = farm.harvests ? groupHarvestsByYear(farm.harvests) : []

  // Calculate aggregate statistics
  const totalYield = farm.harvests?.reduce((sum: number, h: any) => sum + (h.totalYield || 0), 0) || 0
  const averageYield = groupedHarvests.length > 0 ? totalYield / groupedHarvests.length : 0
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
      {groupedHarvests.length > 0 && (
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
                <p className="text-sm text-gray-600">Έτη Συγκομιδών</p>
                <p className="text-2xl font-bold text-purple-700">{groupedHarvests.length}</p>
              </div>
              <Wheat className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {groupedHarvests.length > 0 ? (
        <div className="space-y-6">
          {groupedHarvests.map((harvest) => (
            <div key={harvest.year} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Harvest Year Header */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <Wheat className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Συγκομιδή {harvest.year}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {harvest.startDate.toLocaleDateString('el-GR')}
                            {harvest.endDate && ` - ${harvest.endDate.toLocaleDateString('el-GR')}`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{harvest.collections.length} συλλογή{harvest.collections.length > 1 ? 'ές' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      harvest.isCompleted 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {harvest.isCompleted ? 'Ολοκληρώθηκε' : 'Σε εξέλιξη'}
                    </span>
                    
                    {!harvest.isCompleted && (
                      <button
                        onClick={() => {
                          // Find the first incomplete harvest to complete
                          const incompleteHarvest = harvest.collections.find(c => !c.completed)
                          if (incompleteHarvest) {
                            handleCompleteHarvest(incompleteHarvest.id)
                          }
                        }}
                        className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Ολοκλήρωση</span>
                      </button>
                    )}
                    
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Year Summary Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-olive-700">{harvest.totalYield.toFixed(0)}</div>
                    <div className="text-sm text-gray-600">kg συνολικά</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">{(harvest.totalYield / 1000).toFixed(2)}</div>
                    <div className="text-sm text-gray-600">τόνοι</div>
                  </div>
                  
                  {farm.trees && farm.trees.length > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-700 flex items-center justify-center">
                        <TreePine className="w-5 h-5 mr-1" />
                        {(harvest.totalYield / farm.trees.length).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">kg/δέντρο</div>
                    </div>
                  )}
                  
                  {farm.totalArea && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-700">{(harvest.totalYield / farm.totalArea).toFixed(1)}</div>
                      <div className="text-sm text-gray-600">kg/στρέμμα</div>
                    </div>
                  )}
                </div>

                {/* Total Value */}
                {harvest.totalValue > 0 && (
                  <div className="mt-4 pt-4 border-t border-amber-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-700">€{harvest.totalValue.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Συνολική Αξία</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Individual Collections */}
              <div className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Ημερήσιες Συλλογές</span>
                </h4>
                
                <div className="space-y-3">
                  {harvest.collections.map((collection, index) => (
                    <div key={collection.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${collection.completed ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <span className="font-medium text-gray-900">
                              Συλλογή #{index + 1}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {collection.collectionDate 
                                ? new Date(collection.collectionDate).toLocaleDateString('el-GR')
                                : new Date(collection.startDate).toLocaleDateString('el-GR')
                              }
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{(collection.totalYield || 0).toFixed(0)} kg</div>
                            <div className="text-sm text-gray-600">{((collection.totalYield || 0) / 1000).toFixed(2)} τόνοι</div>
                          </div>
                          
                          {collection.totalValue && (
                            <div className="text-right">
                              <div className="font-semibold text-green-700">€{collection.totalValue.toFixed(2)}</div>
                              <div className="text-sm text-gray-600">Αξία</div>
                            </div>
                          )}

                          <div className="flex items-center space-x-1">
                            {collection.completed ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-600" />
                            )}
                          </div>
                        </div>
                      </div>

                      {collection.notes && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-sm text-gray-600">{collection.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
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