// PDF Generation utilities - wrapper for dynamic import
// Note: @react-pdf/renderer needs to be imported dynamically in client components
// due to SSR incompatibility

export interface FarmReportData {
  farm: {
    name: string
    location: string
    totalArea: number | null
    treeCount: number | null
    oliveVariety: string | null
    coordinates: string | null
  }
  activities: Array<{
    type: string
    title: string
    date: string
    duration: number | null
    cost: number | null
    completed: boolean
  }>
  harvests: Array<{
    year: number
    totalYield: number | null
    totalValue: number | null
    pricePerKg: number | null
  }>
  summary: {
    totalTrees: number
    totalActivities: number
    totalHarvests: number
    totalYield: number
    totalValue: number
    totalCost: number
  }
}

export interface SummaryReportData {
  farms: Array<{
    name: string
    location: string
    totalArea: number | null
    treeCount: number | null
    oliveVariety: string | null
    activitiesCount: number
    harvestsCount: number
  }>
  totals: {
    farms: number
    trees: number
    area: number
    activities: number
    harvests: number
    yield: number
    value: number
    costs: number
  }
  generatedAt: string
}

// Activity type translations
export const activityTypeLabels: Record<string, string> = {
  WATERING: 'Πότισμα',
  PRUNING: 'Κλάδεμα',
  FERTILIZING: 'Λίπανση',
  PEST_CONTROL: 'Φυτοπροστασία',
  SOIL_WORK: 'Εργασίες εδάφους',
  HARVESTING: 'Συγκομιδή',
  MAINTENANCE: 'Συντήρηση',
  INSPECTION: 'Επιθεώρηση',
  OTHER: 'Άλλο',
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('el-GR')
}

export function formatCurrency(value: number | null): string {
  if (value === null) return '-'
  return `€${value.toLocaleString('el-GR')}`
}

export function formatNumber(value: number | null): string {
  if (value === null) return '-'
  return value.toLocaleString('el-GR')
}
