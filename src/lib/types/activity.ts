// Define ActivityType locally to avoid Prisma client generation issues
export type ActivityType =
  | 'WATERING'
  | 'PRUNING'
  | 'FERTILIZING'
  | 'PEST_CONTROL'
  | 'SOIL_WORK'
  | 'HARVESTING'
  | 'MAINTENANCE'
  | 'INSPECTION'
  | 'OTHER'

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description?: string
  date: Date | string
  duration?: number
  cost?: number
  weather?: string
  notes?: string
  completed: boolean
  createdAt: Date | string
  updatedAt: Date | string
  farmId: string
  treeActivities?: TreeActivity[]
}

export interface TreeActivity {
  id: string
  activityId: string
  treeId: string
  notes?: string
  createdAt: Date | string
  tree?: {
    id: string
    treeNumber: string
    variety: string
  }
}

export interface ActivityFormData {
  type: ActivityType
  title: string
  description?: string
  date: string
  duration?: string
  cost?: string
  weather?: string
  notes?: string
  completed: boolean
  selectedTrees: string[]
}

export interface ActivityWithTrees extends Activity {
  treeActivities: (TreeActivity & {
    tree: {
      id: string
      treeNumber: string
      variety: string
    }
  })[]
}

// Activity type labels in Greek
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  WATERING: 'Πότισμα',
  PRUNING: 'Κλάδεμα', 
  FERTILIZING: 'Λίπανση',
  PEST_CONTROL: 'Έλεγχος Παρασίτων',
  SOIL_WORK: 'Εργασίες Εδάφους',
  HARVESTING: 'Συγκομιδή',
  MAINTENANCE: 'Συντήρηση',
  INSPECTION: 'Επιθεώρηση',
  OTHER: 'Άλλο'
}

// Activity type colors for UI
export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  WATERING: 'bg-blue-100 text-blue-800',
  PRUNING: 'bg-yellow-100 text-yellow-800',
  FERTILIZING: 'bg-green-100 text-green-800',
  PEST_CONTROL: 'bg-red-100 text-red-800',
  SOIL_WORK: 'bg-amber-100 text-amber-800',
  HARVESTING: 'bg-purple-100 text-purple-800',
  MAINTENANCE: 'bg-gray-100 text-gray-800',
  INSPECTION: 'bg-indigo-100 text-indigo-800',
  OTHER: 'bg-slate-100 text-slate-800'
}

// Activity type icons
export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  WATERING: '💧',
  PRUNING: '✂️',
  FERTILIZING: '🌱',
  PEST_CONTROL: '🛡️',
  SOIL_WORK: '🪨',
  HARVESTING: '🌾',
  MAINTENANCE: '🔧',
  INSPECTION: '🔍',
  OTHER: '📝'
} 