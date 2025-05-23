// Area conversion utilities
// Base unit: Στρέμματα (Stremmata)
// 1 στρέμμα = 1000 τετραγωνικά μέτρα
// 1 εκτάριο = 10 στρέμματα

export type AreaUnit = 'στρέμματα' | 'εκτάρια' | 'τετραγωνικά μέτρα' | 'τετραγωνικά χιλιόμετρα'

/**
 * Convert any area unit TO stremmata (base unit for storage)
 */
export function convertToStremmata(value: number, fromUnit: AreaUnit): number {
  switch (fromUnit) {
    case 'στρέμματα':
      return value
    case 'εκτάρια':
      return value * 10 // 1 hectare = 10 stremmata
    case 'τετραγωνικά μέτρα':
      return value / 1000 // 1 stremma = 1000 square meters
    case 'τετραγωνικά χιλιόμετρα':
      return value * 1000000 // 1 km² = 1,000,000 stremmata
    default:
      return value
  }
}

/**
 * Convert FROM stremmata to any other unit
 */
export function convertFromStremmata(value: number, toUnit: AreaUnit): number {
  switch (toUnit) {
    case 'στρέμματα':
      return value
    case 'εκτάρια':
      return value / 10 // 10 stremmata = 1 hectare
    case 'τετραγωνικά μέτρα':
      return value * 1000 // 1 stremma = 1000 square meters
    case 'τετραγωνικά χιλιόμετρα':
      return value / 1000000 // 1,000,000 stremmata = 1 km²
    default:
      return value
  }
}

/**
 * Get the display abbreviation for each unit
 */
export function getUnitAbbreviation(unit: AreaUnit): string {
  switch (unit) {
    case 'στρέμματα':
      return 'στρ.'
    case 'εκτάρια':
      return 'εκτ.'
    case 'τετραγωνικά μέτρα':
      return 'τ.μ.'
    case 'τετραγωνικά χιλιόμετρα':
      return 'χλμ²'
    default:
      return unit
  }
}

/**
 * Format area value with unit for display
 */
export function formatArea(value: number, unit: AreaUnit, precision: number = 1): string {
  return `${value.toFixed(precision)} ${getUnitAbbreviation(unit)}`
}

/**
 * Get conversion information for display
 */
export function getConversionInfo(value: number, fromUnit: AreaUnit): {
  original: string
  converted: string
  stremmataValue: number
} {
  const stremmataValue = convertToStremmata(value, fromUnit)
  return {
    original: formatArea(value, fromUnit),
    converted: formatArea(stremmataValue, 'στρέμματα'),
    stremmataValue
  }
} 