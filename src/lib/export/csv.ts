import Papa from 'papaparse'

export interface ExportColumn<T> {
  key: keyof T | string
  header: string
  format?: (value: unknown, row: T) => string
}

export function exportToCSV<T extends object>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  // Transform data to use Greek headers and format values
  const formattedData = data.map(row => {
    const formattedRow: Record<string, string> = {}
    const rowObj = row as Record<string, unknown>

    columns.forEach(col => {
      const key = col.key as string
      const value = key.includes('.')
        ? getNestedValue(rowObj, key)
        : rowObj[key]

      formattedRow[col.header] = col.format
        ? col.format(value, row)
        : formatValue(value)
    })

    return formattedRow
  })

  // Generate CSV with UTF-8 BOM for Greek character support in Excel
  const csv = Papa.unparse(formattedData, {
    quotes: true,
    quoteChar: '"',
    escapeChar: '"',
    delimiter: ';', // Use semicolon for better Greek Excel compatibility
    header: true,
    newline: '\r\n'
  })

  // Add BOM for UTF-8
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })

  // Download file
  downloadBlob(blob, `${filename}.csv`)
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Date) {
    return value.toLocaleDateString('el-GR')
  }

  if (typeof value === 'boolean') {
    return value ? 'Ναι' : 'Όχι'
  }

  if (typeof value === 'number') {
    return value.toLocaleString('el-GR')
  }

  return String(value)
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Pre-defined export configurations for common data types

export interface FarmExportData {
  name: string
  location: string
  totalArea: number | null
  coordinates: string | null
  treesCount: number
  activitiesCount: number
  harvestsCount: number
}

export const farmExportColumns: ExportColumn<FarmExportData>[] = [
  { key: 'name', header: 'Όνομα Ελαιώνα' },
  { key: 'location', header: 'Τοποθεσία' },
  { key: 'totalArea', header: 'Έκταση (στρ.)', format: (v) => v ? `${v}` : '' },
  { key: 'coordinates', header: 'Συντεταγμένες' },
  { key: 'treesCount', header: 'Αριθμός Δέντρων' },
  { key: 'activitiesCount', header: 'Δραστηριότητες' },
  { key: 'harvestsCount', header: 'Συγκομιδές' },
]

export interface HarvestExportData {
  farmName: string
  year: number
  startDate: Date | string
  endDate: Date | string | null
  totalYield: number | null
  pricePerKg: number | null
  totalValue: number | null
  yieldPerStremma: number | null
  notes: string | null
}

export const harvestExportColumns: ExportColumn<HarvestExportData>[] = [
  { key: 'farmName', header: 'Ελαιώνας' },
  { key: 'year', header: 'Έτος' },
  { key: 'startDate', header: 'Ημ. Έναρξης', format: (v) => v ? new Date(v as string).toLocaleDateString('el-GR') : '' },
  { key: 'endDate', header: 'Ημ. Λήξης', format: (v) => v ? new Date(v as string).toLocaleDateString('el-GR') : '' },
  { key: 'totalYield', header: 'Παραγωγή (kg)', format: (v) => v ? `${v}` : '' },
  { key: 'pricePerKg', header: 'Τιμή/kg (€)', format: (v) => v ? `${v}` : '' },
  { key: 'totalValue', header: 'Συνολική Αξία (€)', format: (v) => v ? `${v}` : '' },
  { key: 'yieldPerStremma', header: 'Απόδοση/στρέμμα (kg)', format: (v) => v ? `${(v as number).toFixed(1)}` : '' },
  { key: 'notes', header: 'Σημειώσεις' },
]

export interface ActivityExportData {
  farmName: string
  type: string
  title: string
  date: Date | string
  duration: number | null
  cost: number | null
  completed: boolean
  notes: string | null
}

const activityTypeLabels: Record<string, string> = {
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

export const activityExportColumns: ExportColumn<ActivityExportData>[] = [
  { key: 'farmName', header: 'Ελαιώνας' },
  { key: 'type', header: 'Τύπος', format: (v) => activityTypeLabels[v as string] || (v as string) },
  { key: 'title', header: 'Τίτλος' },
  { key: 'date', header: 'Ημερομηνία', format: (v) => new Date(v as string).toLocaleDateString('el-GR') },
  { key: 'duration', header: 'Διάρκεια (λεπτά)', format: (v) => v ? `${v}` : '' },
  { key: 'cost', header: 'Κόστος (€)', format: (v) => v ? `${v}` : '' },
  { key: 'completed', header: 'Ολοκληρώθηκε' },
  { key: 'notes', header: 'Σημειώσεις' },
]

export interface TreeExportData {
  farmName: string
  treeNumber: string
  variety: string
  plantingYear: number | null
  health: string
  status: string
  notes: string | null
}

const healthLabels: Record<string, string> = {
  EXCELLENT: 'Εξαιρετική',
  GOOD: 'Καλή',
  HEALTHY: 'Υγιές',
  FAIR: 'Μέτρια',
  POOR: 'Κακή',
  DISEASED: 'Ασθενές',
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ενεργό',
  INACTIVE: 'Ανενεργό',
  REMOVED: 'Αφαιρέθηκε',
  REPLANTED: 'Επαναφυτεύτηκε',
}

export const treeExportColumns: ExportColumn<TreeExportData>[] = [
  { key: 'farmName', header: 'Ελαιώνας' },
  { key: 'treeNumber', header: 'Αριθμός Δέντρου' },
  { key: 'variety', header: 'Ποικιλία' },
  { key: 'plantingYear', header: 'Έτος Φύτευσης', format: (v) => v ? `${v}` : '' },
  { key: 'health', header: 'Υγεία', format: (v) => healthLabels[v as string] || (v as string) },
  { key: 'status', header: 'Κατάσταση', format: (v) => statusLabels[v as string] || (v as string) },
  { key: 'notes', header: 'Σημειώσεις' },
]
