'use client'

import { useState } from 'react'
import { X, Plus, Trash2, TreeDeciduous, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TreeEntry {
  id: string
  treeNumber: string
  variety: string
  plantingYear: string
  health: string
  notes: string
}

interface BulkTreeFormProps {
  farmId: string
  onClose: () => void
  onSuccess: () => void
  existingTreeNumbers?: string[]
}

const OLIVE_VARIETIES = [
  'Κορωνέικη',
  'Καλαμών',
  'Μανάκι',
  'Θρουμπολιά',
  'Αμφίσσης',
  'Χαλκιδικής',
  'Μεγαρίτικη',
  'Λιανολιά',
  'Κολοβή',
  'Αδραμυττινή',
  'Άλλο'
]

const HEALTH_OPTIONS = [
  { value: 'EXCELLENT', label: 'Εξαιρετική' },
  { value: 'GOOD', label: 'Καλή' },
  { value: 'HEALTHY', label: 'Υγιές' },
  { value: 'FAIR', label: 'Μέτρια' },
  { value: 'POOR', label: 'Κακή' },
]

export function BulkTreeForm({
  farmId,
  onClose,
  onSuccess,
  existingTreeNumbers = []
}: BulkTreeFormProps) {
  const [trees, setTrees] = useState<TreeEntry[]>([
    createEmptyTree()
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function createEmptyTree(): TreeEntry {
    return {
      id: Math.random().toString(36).substr(2, 9),
      treeNumber: '',
      variety: 'Κορωνέικη',
      plantingYear: '',
      health: 'HEALTHY',
      notes: ''
    }
  }

  const addTree = () => {
    setTrees([...trees, createEmptyTree()])
  }

  const removeTree = (id: string) => {
    if (trees.length > 1) {
      setTrees(trees.filter(t => t.id !== id))
    }
  }

  const updateTree = (id: string, field: keyof TreeEntry, value: string) => {
    setTrees(trees.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ))
  }

  const addMultipleTrees = (count: number) => {
    // Find the highest existing tree number
    const existingNumbers = [...existingTreeNumbers, ...trees.map(t => t.treeNumber)]
      .filter(n => /^\d+$/.test(n))
      .map(n => parseInt(n))

    const startNumber = existingNumbers.length > 0
      ? Math.max(...existingNumbers) + 1
      : 1

    const newTrees: TreeEntry[] = []
    for (let i = 0; i < count; i++) {
      newTrees.push({
        id: Math.random().toString(36).substr(2, 9),
        treeNumber: String(startNumber + i),
        variety: 'Κορωνέικη',
        plantingYear: '',
        health: 'HEALTHY',
        notes: ''
      })
    }

    setTrees([...trees.filter(t => t.treeNumber !== ''), ...newTrees])
  }

  const handleSubmit = async () => {
    setError(null)

    // Validate
    const validTrees = trees.filter(t => t.treeNumber.trim() !== '')
    if (validTrees.length === 0) {
      setError('Παρακαλώ προσθέστε τουλάχιστον ένα δέντρο')
      return
    }

    // Check for duplicates
    const treeNumbers = validTrees.map(t => t.treeNumber.trim())
    const duplicates = treeNumbers.filter((num, i) => treeNumbers.indexOf(num) !== i)
    if (duplicates.length > 0) {
      setError(`Διπλότυπος αριθμός δέντρου: ${duplicates.join(', ')}`)
      return
    }

    // Check against existing trees
    const conflicting = treeNumbers.filter(num => existingTreeNumbers.includes(num))
    if (conflicting.length > 0) {
      setError(`Αυτοί οι αριθμοί δέντρων υπάρχουν ήδη: ${conflicting.join(', ')}`)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/farms/${farmId}/trees/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trees: validTrees.map(t => ({
            treeNumber: t.treeNumber.trim(),
            variety: t.variety,
            plantingYear: t.plantingYear ? parseInt(t.plantingYear) : null,
            health: t.health,
            notes: t.notes.trim() || null
          }))
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add trees')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Αποτυχία προσθήκης δέντρων')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-olive-100 rounded-xl">
              <TreeDeciduous className="w-5 h-5 text-olive-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Μαζική Προσθήκη Δέντρων
              </h2>
              <p className="text-sm text-gray-500">
                Προσθέστε πολλά δέντρα ταυτόχρονα
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick add buttons */}
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <p className="text-sm text-gray-600 mb-2">Γρήγορη προσθήκη:</p>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 20, 50].map(count => (
              <button
                key={count}
                onClick={() => addMultipleTrees(count)}
                className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:border-olive-400 hover:text-olive-700 transition-colors"
              >
                +{count} δέντρα
              </button>
            ))}
          </div>
        </div>

        {/* Trees list */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <div className="space-y-4">
            {trees.map((tree, index) => (
              <div
                key={tree.id}
                className="p-4 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500">
                    Δέντρο #{index + 1}
                  </span>
                  {trees.length > 1 && (
                    <button
                      onClick={() => removeTree(tree.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Tree number */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Αριθμός *
                    </label>
                    <input
                      type="text"
                      value={tree.treeNumber}
                      onChange={(e) => updateTree(tree.id, 'treeNumber', e.target.value)}
                      placeholder="π.χ. 1"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500"
                    />
                  </div>

                  {/* Variety */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ποικιλία
                    </label>
                    <select
                      value={tree.variety}
                      onChange={(e) => updateTree(tree.id, 'variety', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500"
                    >
                      {OLIVE_VARIETIES.map(variety => (
                        <option key={variety} value={variety}>{variety}</option>
                      ))}
                    </select>
                  </div>

                  {/* Planting year */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Έτος φύτευσης
                    </label>
                    <input
                      type="number"
                      value={tree.plantingYear}
                      onChange={(e) => updateTree(tree.id, 'plantingYear', e.target.value)}
                      placeholder={String(new Date().getFullYear())}
                      min="1900"
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500"
                    />
                  </div>

                  {/* Health */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Κατάσταση
                    </label>
                    <select
                      value={tree.health}
                      onChange={(e) => updateTree(tree.id, 'health', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-olive-500 focus:ring-1 focus:ring-olive-500"
                    >
                      {HEALTH_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add more button */}
          <button
            onClick={addTree}
            className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-olive-400 hover:text-olive-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Προσθήκη δέντρου
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          {error && (
            <p className="text-sm text-red-600 mb-4">{error}</p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {trees.filter(t => t.treeNumber.trim()).length} δέντρα για προσθήκη
            </span>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Ακύρωση
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  'px-6 py-2 bg-olive-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2',
                  isSubmitting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-olive-700'
                )}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Αποθήκευση...' : 'Αποθήκευση δέντρων'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
