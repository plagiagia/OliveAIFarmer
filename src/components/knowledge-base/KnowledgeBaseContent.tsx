'use client'

import { CareGuideline, MonthlyTask, OliveVariety, RiskFactor } from '@prisma/client'
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Droplets,
  Flame,
  Leaf,
  ListChecks,
  MapPin,
  Sun,
  Trees,
  Wind
} from 'lucide-react'
import { useMemo, useState } from 'react'

export type OliveVarietyWithDetails = OliveVariety & {
  monthlyTasks: MonthlyTask[]
  riskFactors: RiskFactor[]
  careGuidelines: CareGuideline[]
}

const MONTH_NAMES = [
  'Ιανουάριος',
  'Φεβρουάριος',
  'Μάρτιος',
  'Απρίλιος',
  'Μάιος',
  'Ιούνιος',
  'Ιούλιος',
  'Αύγουστος',
  'Σεπτέμβριος',
  'Οκτώβριος',
  'Νοέμβριος',
  'Δεκέμβριος'
]

const FRUIT_TYPE_LABELS: Record<OliveVariety['fruitType'], string> = {
  OIL: 'Ελαιοπαραγωγική',
  TABLE: 'Επιτραπέζια',
  DUAL: 'Διπλής χρήσης'
}

const TREE_SIZE_LABELS: Record<OliveVariety['treeSize'], string> = {
  SMALL: 'Μικρό δέντρο',
  MEDIUM: 'Μεσαίο δέντρο',
  LARGE: 'Μεγάλο δέντρο'
}

const WATER_NEEDS_LABELS = {
  LOW: 'Χαμηλές ανάγκες',
  MEDIUM: 'Μέτριες ανάγκες',
  HIGH: 'Υψηλές ανάγκες'
} as const

const SUNLIGHT_LABELS = {
  PARTIAL: 'Μερική έκθεση',
  FULL: 'Πλήρης έκθεση'
} as const

const TOLERANCE_LABELS = {
  LOW: 'Χαμηλή',
  MEDIUM: 'Μέτρια',
  HIGH: 'Υψηλή'
} as const

const PRIORITY_ORDER: Record<MonthlyTask['priority'], number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3
}

const PRIORITY_BADGE: Record<MonthlyTask['priority'], string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-700'
}

const PRIORITY_LABEL: Record<MonthlyTask['priority'], string> = {
  LOW: 'Χαμηλή προτεραιότητα',
  MEDIUM: 'Μέση προτεραιότητα',
  HIGH: 'Υψηλή προτεραιότητα',
  CRITICAL: 'Κρίσιμη προτεραιότητα'
}

const SEVERITY_BADGE: Record<RiskFactor['severity'], string> = {
  LOW: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border border-amber-200',
  HIGH: 'bg-orange-50 text-orange-700 border border-orange-200',
  SEVERE: 'bg-red-50 text-red-700 border border-red-200'
}

const SEVERITY_LABEL: Record<RiskFactor['severity'], string> = {
  LOW: 'Χαμηλή ένταση',
  MEDIUM: 'Μέτρια ένταση',
  HIGH: 'Υψηλή ένταση',
  SEVERE: 'Σοβαρός κίνδυνος'
}

const CATEGORY_LABEL: Record<CareGuideline['category'], string> = {
  PLANTING: 'Φύτευση',
  PRUNING: 'Κλάδεμα',
  WATERING: 'Πότισμα',
  FERTILIZING: 'Λίπανση',
  PEST_MANAGEMENT: 'Παράσιτα',
  HARVESTING: 'Συγκομιδή',
  GENERAL_CARE: 'Γενική φροντίδα',
  TROUBLESHOOTING: 'Αντιμετώπιση προβλημάτων'
}

const IMPORTANCE_BADGE: Record<CareGuideline['importance'], string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-700'
}

const IMPORTANCE_LABEL: Record<CareGuideline['importance'], string> = {
  LOW: 'Χαμηλή προτεραιότητα',
  MEDIUM: 'Μέση προτεραιότητα',
  HIGH: 'Υψηλή προτεραιότητα',
  CRITICAL: 'Κρίσιμη προτεραιότητα'
}

interface KnowledgeBaseContentProps {
  varieties: OliveVarietyWithDetails[]
}

export default function KnowledgeBaseContent({ varieties }: KnowledgeBaseContentProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeVarietyId, setActiveVarietyId] = useState(() => varieties[0]?.id ?? '')

  const filteredVarieties = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    if (!term) return varieties

    return varieties.filter((variety) => {
      const haystack = [
        variety.name,
        variety.scientificName,
        ...variety.alternativeNames,
        ...variety.primaryRegions
      ]
        .filter(Boolean)
        .join(' ') // fallback to string for includes
        .toLowerCase()

      return haystack.includes(term)
    })
  }, [searchTerm, varieties])

  const activeVariety = filteredVarieties.find((variety) => variety.id === activeVarietyId)
    ?? filteredVarieties[0]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gradient-to-br from-olive-100 via-emerald-50 to-olive-50 border border-olive-200 rounded-3xl p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-olive-800 mb-2">
              Γνώση Ποικιλιών & Φροντίδας Ελαιοδέντρων
            </h1>
            <p className="text-olive-700 max-w-2xl">
              Ανακαλύψτε τις ιδιαίτερες ανάγκες των ελληνικών ποικιλιών, με μηνιαίες εργασίες,
              κινδύνους και πρακτικές οδηγίες που σας βοηθούν να διατηρείτε τον ελαιώνα σας
              παραγωγικό και υγιή.
            </p>
          </div>
          <div className="bg-white shadow-lg rounded-2xl p-4 w-full lg:w-80">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-10 h-10 text-olive-600" />
              <div>
                <p className="text-sm text-gray-500">Διαθέσιμες ποικιλίες</p>
                <p className="text-2xl font-semibold text-olive-800">{filteredVarieties.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[320px,1fr] gap-6">
        <aside className="bg-white border border-gray-200 rounded-3xl p-6 h-fit">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="variety-search">
              Αναζήτηση ποικιλίας
            </label>
            <input
              id="variety-search"
              type="search"
              placeholder="Όνομα, περιοχή ή χαρακτηριστικό"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500"
            />
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {filteredVarieties.map((variety) => {
              const isActive = activeVariety?.id === variety.id

              return (
                <button
                  key={variety.id}
                  type="button"
                  onClick={() => setActiveVarietyId(variety.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    isActive
                      ? 'border-olive-400 bg-olive-50 shadow-sm'
                      : 'border-gray-200 hover:border-olive-200 hover:bg-olive-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{variety.name}</p>
                      {variety.scientificName && (
                        <p className="text-xs text-gray-500 italic mt-1">{variety.scientificName}</p>
                      )}
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-olive-600 translate-x-1' : 'text-gray-400'}`} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center text-xs px-3 py-1 rounded-full bg-olive-100 text-olive-700">
                      <Trees className="w-3 h-3 mr-1" />
                      {TREE_SIZE_LABELS[variety.treeSize]}
                    </span>
                    <span className="inline-flex items-center text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                      <Droplets className="w-3 h-3 mr-1" />
                      {FRUIT_TYPE_LABELS[variety.fruitType]}
                    </span>
                  </div>
                  {variety.primaryRegions.length > 0 && (
                    <div className="mt-3 text-xs text-gray-500 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {variety.primaryRegions.join(', ')}
                    </div>
                  )}
                </button>
              )
            })}

            {filteredVarieties.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-10">
                Δεν βρέθηκαν ποικιλίες με αυτά τα κριτήρια.
              </p>
            )}
          </div>
        </aside>

        <section className="space-y-6">
          {activeVariety ? (
            <VarietyDetail variety={activeVariety} />
          ) : (
            <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-12 text-center text-gray-500">
              Επιλέξτε μια ποικιλία από αριστερά για να δείτε λεπτομέρειες.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function VarietyDetail({ variety }: { variety: OliveVarietyWithDetails }) {
  const climateNeeds = variety.climateNeeds as Record<string, string> | null
  const soilNeeds = variety.soilNeeds as Record<string, string> | null
  const diseaseResistance = variety.diseaseResistance as Record<string, string> | null
  const pestResistance = variety.pestResistance as Record<string, string> | null

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-olive-600 to-emerald-600 text-white px-8 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">{variety.name}</h2>
              {variety.scientificName && (
                <p className="text-sm text-emerald-100">{variety.scientificName}</p>
              )}
              {variety.alternativeNames.length > 0 && (
                <p className="text-xs text-emerald-100 mt-2">
                  Γνωστή και ως: {variety.alternativeNames.join(', ')}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge icon={Droplets} label={FRUIT_TYPE_LABELS[variety.fruitType]} color="bg-white/20 text-white" />
              <Badge icon={Leaf} label={TREE_SIZE_LABELS[variety.treeSize]} color="bg-white/20 text-white" />
              <Badge icon={Sun} label={SUNLIGHT_LABELS[variety.sunlightNeeds]} color="bg-white/20 text-white" />
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Περιεκτικότητα σε λάδι" value={variety.oilContent ? `${variety.oilContent}%` : 'Άγνωστο'} icon={Droplets} />
            <StatCard label="Απόδοση ανά δέντρο" value={formatKg(variety.avgYieldPerTree)} icon={Trees} />
            <StatCard label="Απόδοση ανά στρέμμα" value={formatKg(variety.avgYieldPerStremma)} icon={Leaf} />
            <StatCard label="Έναρξη παραγωγής" value={formatYears(variety.productionStart)} icon={CalendarDays} />
            <StatCard label="Μέγιστη παραγωγή" value={formatYears(variety.peakProduction)} icon={CalendarDays} />
            <StatCard label="Αντοχή σε άνεμο" value={TOLERANCE_LABELS[variety.windTolerance]} icon={Wind} />
            <StatCard label="Ανάγκες ποτίσματος" value={WATER_NEEDS_LABELS[variety.waterNeeds]} icon={Droplets} />
            <StatCard label="Ανάγκες κλαδέματος" value={mapPruningLevel(variety.pruningNeeds)} icon={Leaf} />
            <StatCard label="Ανάγκες λίπανσης" value={mapFertilizingLevel(variety.fertilizingNeeds)} icon={Flame} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <InfoCard
              title="Κλιματικές απαιτήσεις"
              icon={Sun}
              items={climateNeeds}
              placeholder="Δεν υπάρχουν καταγεγραμμένες κλιματικές απαιτήσεις."
            />
            <InfoCard
              title="Απαιτήσεις εδάφους"
              icon={Leaf}
              items={soilNeeds}
              placeholder="Δεν υπάρχουν καταγεγραμμένες απαιτήσεις εδάφους."
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <InfoCard
              title="Ανθεκτικότητα σε ασθένειες"
              icon={AlertTriangle}
              items={diseaseResistance}
              placeholder="Δεν υπάρχουν στοιχεία ανθεκτικότητας σε ασθένειες."
            />
            <InfoCard
              title="Ανθεκτικότητα σε παράσιτα"
              icon={BugIcon}
              items={pestResistance}
              placeholder="Δεν υπάρχουν στοιχεία ανθεκτικότητας σε παράσιτα."
            />
          </div>

          <MonthlyCalendar tasks={variety.monthlyTasks} />
          <RiskFactors risks={variety.riskFactors} />
          <CareGuidelinesList guidelines={variety.careGuidelines} />
        </div>
      </div>
    </div>
  )
}

function MonthlyCalendar({ tasks }: { tasks: MonthlyTask[] }) {
  const tasksByMonth = useMemo(() => {
    return MONTH_NAMES.map((_, index) =>
      tasks
        .filter((task) => task.month === index + 1)
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    )
  }, [tasks])

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 flex items-center">
        <CalendarDays className="w-5 h-5 text-olive-600 mr-2" />
        Μηνιαίο ημερολόγιο εργασιών
      </h3>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tasksByMonth.map((monthTasks, index) => (
          <div key={MONTH_NAMES[index]} className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
              <span>{MONTH_NAMES[index]}</span>
              {monthTasks.length > 0 && (
                <span className="text-xs text-gray-500">{monthTasks.length} εργασία{monthTasks.length > 1 ? 'ες' : ''}</span>
              )}
            </h4>
            <div className="space-y-3">
              {monthTasks.length > 0 ? (
                monthTasks.map((task) => (
                  <div key={task.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{mapTaskType(task.taskType)}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${PRIORITY_BADGE[task.priority]}`}>
                        {PRIORITY_LABEL[task.priority]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">{task.description}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      {task.timing && <span>🕒 {task.timing}</span>}
                      {task.duration && <span>⌛ {task.duration}</span>}
                      {task.tools.length > 0 && (
                        <span className="col-span-2">🧰 Εργαλεία: {task.tools.join(', ')}</span>
                      )}
                      {task.temperatureRange && <span>🌡️ {task.temperatureRange}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">Χωρίς προγραμματισμένες εργασίες.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RiskFactors({ risks }: { risks: RiskFactor[] }) {
  if (risks.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 flex items-center">
        <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
        Κίνδυνοι & προειδοποιήσεις
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        {risks.map((risk) => (
          <div key={risk.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{risk.title}</p>
                <p className="text-xs text-gray-500 mt-1">{mapRiskType(risk.riskType)}</p>
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${SEVERITY_BADGE[risk.severity]}`}>
                {SEVERITY_LABEL[risk.severity]}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{risk.description}</p>
            <div className="mt-3 space-y-2 text-xs text-gray-500">
              <p>🎯 Σεζόν: {risk.seasonality.join(', ') || 'Όλο το έτος'}</p>
              <p>⚠️ Παράγοντες: {renderJsonList(risk.triggers)}</p>
              <p>🛡️ Πρόληψη: {risk.prevention}</p>
              {risk.treatment && <p>💊 Αντιμετώπιση: {risk.treatment}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CareGuidelinesList({ guidelines }: { guidelines: CareGuideline[] }) {
  if (guidelines.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 flex items-center">
        <ListChecks className="w-5 h-5 text-olive-600 mr-2" />
        Οδηγίες φροντίδας
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        {guidelines.map((guideline) => (
          <div key={guideline.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{guideline.title}</p>
                <p className="text-xs text-gray-500 mt-1">{CATEGORY_LABEL[guideline.category]}</p>
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${IMPORTANCE_BADGE[guideline.importance]}`}>
                {IMPORTANCE_LABEL[guideline.importance]}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{guideline.content}</p>
            <div className="mt-3 text-xs text-gray-500 space-y-1">
              <p>📅 Εποχικότητα: {guideline.seasonality.join(', ') || 'Όλο το έτος'}</p>
              <p>
                📸 Πολυμέσα:
                {' '}
                {[
                  guideline.hasImages ? 'Εικόνες' : null,
                  guideline.hasVideo ? 'Βίντεο' : null,
                  guideline.hasSteps ? 'Βήμα-βήμα οδηγός' : null
                ]
                  .filter(Boolean)
                  .join(', ') || 'Χωρίς πρόσθετα στοιχεία'}
              </p>
              {guideline.steps && (
                <p>🧭 Βήματα: {renderJsonList(guideline.steps)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Badge({ icon: Icon, label, color }: { icon: React.ComponentType<{ className?: string }>; label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${color}`}>
      <Icon className="w-4 h-4 mr-1" />
      {label}
    </span>
  )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3">
      <div className="p-3 bg-olive-50 rounded-xl">
        <Icon className="w-5 h-5 text-olive-600" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function InfoCard({
  title,
  icon: Icon,
  items,
  placeholder
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: Record<string, string> | null
  placeholder: string
}) {
  const entries = items ? Object.entries(items) : []

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Icon className="w-5 h-5 text-olive-600" />
        <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
      </div>

      {entries.length > 0 ? (
        <dl className="space-y-2">
          {entries.map(([key, value]) => (
            <div key={key} className="border border-gray-100 rounded-xl px-4 py-2 bg-olive-50/30">
              <dt className="text-xs uppercase tracking-wide text-gray-500">{formatLabel(key)}</dt>
              <dd className="text-sm text-gray-700 mt-1">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-gray-500 italic">{placeholder}</p>
      )}
    </div>
  )
}

function formatLabel(input: string) {
  return input
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase())
}

function formatKg(value: number | null | undefined) {
  if (!value || Number.isNaN(value)) {
    return 'Άγνωστο'
  }

  return `${value.toFixed(1)} kg`
}

function formatYears(value: number | null | undefined) {
  if (!value || Number.isNaN(value)) {
    return '—'
  }

  if (value === 1) return '1 έτος'
  return `${value} έτη`
}

function mapPruningLevel(level: OliveVariety['pruningNeeds']) {
  switch (level) {
    case 'MINIMAL':
      return 'Ελαφρύ κλάδεμα'
    case 'MODERATE':
      return 'Μέτριο κλάδεμα'
    case 'INTENSIVE':
      return 'Έντονο κλάδεμα'
    default:
      return 'Άγνωστο'
  }
}

function mapFertilizingLevel(level: OliveVariety['fertilizingNeeds']) {
  switch (level) {
    case 'LOW':
      return 'Χαμηλές ανάγκες'
    case 'MEDIUM':
      return 'Μέτριες ανάγκες'
    case 'HIGH':
      return 'Υψηλές ανάγκες'
    default:
      return 'Άγνωστο'
  }
}

function mapTaskType(taskType: MonthlyTask['taskType']) {
  switch (taskType) {
    case 'PRUNING':
      return 'Κλάδεμα'
    case 'WATERING':
      return 'Πότισμα'
    case 'FERTILIZING':
      return 'Λίπανση'
    case 'PEST_CONTROL':
      return 'Έλεγχος παρασίτων'
    case 'DISEASE_PREVENTION':
      return 'Πρόληψη ασθενειών'
    case 'SOIL_PREPARATION':
      return 'Προετοιμασία εδάφους'
    case 'HARVESTING':
      return 'Συγκομιδή'
    case 'MONITORING':
      return 'Παρακολούθηση'
    case 'GENERAL_CARE':
      return 'Γενική φροντίδα'
    default:
      return taskType
  }
}

function mapRiskType(riskType: RiskFactor['riskType']) {
  switch (riskType) {
    case 'DISEASE':
      return 'Ασθένεια'
    case 'PEST':
      return 'Παράσιτο'
    case 'WEATHER':
      return 'Καιρικός κίνδυνος'
    case 'ENVIRONMENTAL':
      return 'Περιβαλλοντικός'
    case 'SEASONAL':
      return 'Εποχιακός'
    default:
      return riskType
  }
}

function renderJsonList(value: unknown) {
  if (!value) {
    return '—'
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, itemValue]) => `${formatLabel(key)}: ${String(itemValue)}`)
      .join(', ')
  }

  return String(value)
}

function BugIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 9H15M9 13H15M12 3L12 5M5 8L3 7M19 8L21 7M5 16L3 17M19 16L21 17M7 3L5 5M17 3L19 5M7 21H17C18.1046 21 19 20.1046 19 19V9C19 6.79086 17.2091 5 15 5H9C6.79086 5 5 6.79086 5 9V19C5 20.1046 5.89543 21 7 21Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
