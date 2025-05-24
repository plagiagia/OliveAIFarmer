'use client'

import { BarChart3, Calculator, Euro, TreePine, Wheat, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface HarvestCreateModalProps {
  isOpen: boolean
  onClose: () => void
  farmId: string
  farmData: {
    totalArea?: number
    treesCount: number
    name: string
  }
  onSuccess: () => void
}

export default function HarvestCreateModal({ 
  isOpen, 
  onClose, 
  farmId, 
  farmData,
  onSuccess 
}: HarvestCreateModalProps) {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    collectionDate: '',
    totalYield: '', // user input
    totalYieldUnit: 'kg', // 'kg' or 'ton'
    pricePerKg: '',
    pricePerTon: '',
    priceUnit: 'PER_KG',
    oilExtracted: '',
    notes: ''
  })

  const [calculations, setCalculations] = useState({
    totalYieldTons: 0,
    yieldPerTree: 0,
    yieldPerStremma: 0,
    totalValue: 0,
    pricePerKgConverted: 0,
    pricePerTonConverted: 0
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Calculate metrics whenever relevant fields change
  useEffect(() => {
    const rawYield = parseFloat(formData.totalYield) || 0
    const pricePerKg = parseFloat(formData.pricePerKg) || 0
    const pricePerTon = parseFloat(formData.pricePerTon) || 0
    
    // Convert totalYield to kg based on selected unit
    const totalYieldKg = formData.totalYieldUnit === 'ton' ? rawYield * 1000 : rawYield
    
    const newCalculations = {
      totalYieldTons: totalYieldKg / 1000,
      yieldPerTree: farmData.treesCount > 0 ? totalYieldKg / farmData.treesCount : 0,
      yieldPerStremma: farmData.totalArea ? totalYieldKg / farmData.totalArea : 0,
      totalValue: 0,
      pricePerKgConverted: formData.priceUnit === 'PER_TON' ? pricePerTon / 1000 : pricePerKg,
      pricePerTonConverted: formData.priceUnit === 'PER_KG' ? pricePerKg * 1000 : pricePerTon
    }

    // Calculate total value based on price unit
    if (formData.priceUnit === 'PER_KG' && pricePerKg > 0) {
      newCalculations.totalValue = totalYieldKg * pricePerKg
    } else if (formData.priceUnit === 'PER_TON' && pricePerTon > 0) {
      newCalculations.totalValue = newCalculations.totalYieldTons * pricePerTon
    }

    setCalculations(newCalculations)
  }, [formData.totalYield, formData.totalYieldUnit, formData.pricePerKg, formData.pricePerTon, formData.priceUnit, farmData])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Παρακαλώ εισάγετε έγκυρη χρονιά'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Η ημερομηνία έναρξης είναι υποχρεωτική'
    }

    if (!formData.totalYield || parseFloat(formData.totalYield) <= 0) {
      newErrors.totalYield = 'Παρακαλώ εισάγετε έγκυρη συνολική παραγωγή'
    }

    if (formData.priceUnit === 'PER_KG' && formData.pricePerKg && parseFloat(formData.pricePerKg) <= 0) {
      newErrors.pricePerKg = 'Η τιμή ανά κιλό πρέπει να είναι θετική'
    }

    if (formData.priceUnit === 'PER_TON' && formData.pricePerTon && parseFloat(formData.pricePerTon) <= 0) {
      newErrors.pricePerTon = 'Η τιμή ανά τόνο πρέπει να είναι θετική'
    }

    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'Η ημερομηνία λήξης δεν μπορεί να είναι πριν την έναρξη'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        farmId,
        totalYield: parseFloat(formData.totalYield),
        totalYieldTons: calculations.totalYieldTons,
        pricePerKg: formData.priceUnit === 'PER_KG' ? parseFloat(formData.pricePerKg) : calculations.pricePerKgConverted,
        pricePerTon: formData.priceUnit === 'PER_TON' ? parseFloat(formData.pricePerTon) : calculations.pricePerTonConverted,
        totalValue: calculations.totalValue,
        yieldPerTree: calculations.yieldPerTree,
        yieldPerStremma: calculations.yieldPerStremma,
        oilExtracted: formData.oilExtracted ? parseFloat(formData.oilExtracted) : null,
        year: parseInt(formData.year.toString()),
        collectionDate: formData.collectionDate,
        totalYieldUnit: formData.totalYieldUnit
      }

      const response = await fetch('/api/harvests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          year: new Date().getFullYear(),
          startDate: '',
          endDate: '',
          collectionDate: '',
          totalYield: '',
          totalYieldUnit: 'kg',
          pricePerKg: '',
          pricePerTon: '',
          priceUnit: 'PER_KG',
          oilExtracted: '',
          notes: ''
        })
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || 'Αποτυχία δημιουργίας συγκομιδής' })
      }
    } catch (error) {
      setErrors({ submit: 'Σφάλμα δικτύου. Παρακαλώ δοκιμάστε ξανά.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Wheat className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Νέα Συγκομιδή</h2>
              <p className="text-gray-600">{farmData.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Wheat className="w-5 h-5 text-amber-600" />
              <span>Βασικές Πληροφορίες</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Έτος Συγκομιδής *
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
                {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ημερομηνία Έναρξης *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ημερομηνία Λήξης
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
              </div>
            </div>
          </div>

          {/* Production Data */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <span>Δεδομένα Παραγωγής</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Συνολική Παραγωγή *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.totalYield}
                    onChange={(e) => setFormData({ ...formData, totalYield: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="π.χ. 1250"
                    step="0.01"
                    min="0"
                  />
                  <select
                    value={formData.totalYieldUnit}
                    onChange={e => setFormData({ ...formData, totalYieldUnit: e.target.value })}
                    className="px-2 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="kg">κιλά</option>
                    <option value="ton">τόνοι</option>
                  </select>
                </div>
                {errors.totalYield && <p className="text-red-500 text-sm mt-1">{errors.totalYield}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ημερομηνία Συλλογής
                </label>
                <input
                  type="date"
                  value={formData.collectionDate}
                  onChange={e => setFormData({ ...formData, collectionDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Euro className="w-5 h-5 text-blue-600" />
              <span>Οικονομικά Στοιχεία</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Μονάδα Τιμής
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="PER_KG"
                      checked={formData.priceUnit === 'PER_KG'}
                      onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value })}
                      className="mr-2"
                    />
                    <span>Ανά κιλό (€/kg)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="PER_TON"
                      checked={formData.priceUnit === 'PER_TON'}
                      onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value })}
                      className="mr-2"
                    />
                    <span>Ανά τόνο (€/t)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.priceUnit === 'PER_KG' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Τιμή ανά Κιλό (€)
                    </label>
                    <input
                      type="number"
                      value={formData.pricePerKg}
                      onChange={(e) => setFormData({ ...formData, pricePerKg: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="π.χ. 4.50"
                      step="0.01"
                      min="0"
                    />
                    {errors.pricePerKg && <p className="text-red-500 text-sm mt-1">{errors.pricePerKg}</p>}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Τιμή ανά Τόνο (€)
                    </label>
                    <input
                      type="number"
                      value={formData.pricePerTon}
                      onChange={(e) => setFormData({ ...formData, pricePerTon: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="π.χ. 4500.50"
                      step="0.01"
                      min="0"
                    />
                    {errors.pricePerTon && <p className="text-red-500 text-sm mt-1">{errors.pricePerTon}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Calculations Display */}
          {(formData.totalYield && parseFloat(formData.totalYield) > 0) && (
            <div className="bg-gradient-to-r from-olive-50 to-green-50 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-olive-600" />
                <span>Αυτόματοι Υπολογισμοί</span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-olive-700">
                    {calculations.totalYieldTons.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Τόνοι</div>
                </div>

                {farmData.treesCount > 0 && (
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-700 flex items-center justify-center">
                      <TreePine className="w-5 h-5 mr-1" />
                      {calculations.yieldPerTree.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">kg/δέντρο</div>
                  </div>
                )}

                {farmData.totalArea && (
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {calculations.yieldPerStremma.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">kg/στρέμμα</div>
                  </div>
                )}

                {calculations.totalValue > 0 && (
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-amber-700">
                      €{calculations.totalValue.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Συνολική Αξία</div>
                  </div>
                )}
              </div>

              {/* Price conversions */}
              {(formData.pricePerKg || formData.pricePerTon) && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600 mb-2">Μετατροπές τιμών:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Τιμή ανά κιλό:</span> €{calculations.pricePerKgConverted.toFixed(3)}
                    </div>
                    <div>
                      <span className="font-medium">Τιμή ανά τόνο:</span> €{calculations.pricePerTonConverted.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Σημειώσεις
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-olive-500 focus:border-olive-500"
              placeholder="Προσθέστε τυχόν σημειώσεις για τη συγκομιδή..."
            />
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
              {errors.submit}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Δημιουργία...</span>
                </>
              ) : (
                <>
                  <Wheat className="w-5 h-5" />
                  <span>Δημιουργία Συγκομιδής</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 