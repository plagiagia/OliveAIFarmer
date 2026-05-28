/** OliveLog analytics chart palette — olive & earth tones, semantic red for loss only */

export const CHART = {
  revenue: '#2E7D32',
  revenueLight: '#4CAF50',
  costs: '#8b6f37',
  costsLight: '#c4a661',
  profit: '#1B5E20',
  profitNegative: '#dc2626',
  secondary: '#68D391',
  axis: '#6b7280',
  grid: '#e5e7eb',
  reference: '#9ca3af',
} as const

/** Distinct but muted fills for pie / multi-series bar charts */
export const SERIES_PALETTE = [
  '#2E7D32',
  '#4CAF50',
  '#1B5E20',
  '#8b6f37',
  '#a68742',
  '#c4a661',
  '#68D391',
  '#6b7280',
  '#9ca3af',
] as const

export function getSeriesColor(index: number): string {
  return SERIES_PALETTE[index % SERIES_PALETTE.length]
}

/** Per activity type — olive/earth family, still distinguishable */
export const ACTIVITY_CHART_COLORS: Record<string, string> = {
  WATERING: '#4CAF50',
  PRUNING: '#2E7D32',
  FERTILIZING: '#68D391',
  PEST_CONTROL: '#a68742',
  SOIL_WORK: '#8b6f37',
  HARVESTING: '#1B5E20',
  MAINTENANCE: '#6b7280',
  INSPECTION: '#c4a661',
  OTHER: '#9ca3af',
}

export const TOOLTIP_STYLE = {
  backgroundColor: 'white',
  border: `1px solid ${CHART.grid}`,
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
} as const
