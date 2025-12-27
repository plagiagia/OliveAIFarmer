import { describe, it, expect } from 'vitest'
import {
  convertToStremmata,
  convertFromStremmata,
  getUnitAbbreviation,
  formatArea,
  getConversionInfo,
  type AreaUnit
} from './area-conversions'

describe('convertToStremmata', () => {
  it('returns same value for stremmata', () => {
    expect(convertToStremmata(10, 'στρέμματα')).toBe(10)
  })

  it('converts hectares to stremmata (1 hectare = 10 stremmata)', () => {
    expect(convertToStremmata(1, 'εκτάρια')).toBe(10)
    expect(convertToStremmata(2.5, 'εκτάρια')).toBe(25)
  })

  it('converts square meters to stremmata (1000 sq m = 1 stremma)', () => {
    expect(convertToStremmata(1000, 'τετραγωνικά μέτρα')).toBe(1)
    expect(convertToStremmata(500, 'τετραγωνικά μέτρα')).toBe(0.5)
    expect(convertToStremmata(2500, 'τετραγωνικά μέτρα')).toBe(2.5)
  })

  it('converts square kilometers to stremmata', () => {
    expect(convertToStremmata(1, 'τετραγωνικά χιλιόμετρα')).toBe(1000000)
    expect(convertToStremmata(0.001, 'τετραγωνικά χιλιόμετρα')).toBe(1000)
  })

  it('handles zero values', () => {
    expect(convertToStremmata(0, 'εκτάρια')).toBe(0)
    expect(convertToStremmata(0, 'τετραγωνικά μέτρα')).toBe(0)
  })

  it('handles decimal values', () => {
    expect(convertToStremmata(0.5, 'εκτάρια')).toBe(5)
    expect(convertToStremmata(1.5, 'εκτάρια')).toBe(15)
  })
})

describe('convertFromStremmata', () => {
  it('returns same value for stremmata', () => {
    expect(convertFromStremmata(10, 'στρέμματα')).toBe(10)
  })

  it('converts stremmata to hectares (10 stremmata = 1 hectare)', () => {
    expect(convertFromStremmata(10, 'εκτάρια')).toBe(1)
    expect(convertFromStremmata(25, 'εκτάρια')).toBe(2.5)
  })

  it('converts stremmata to square meters (1 stremma = 1000 sq m)', () => {
    expect(convertFromStremmata(1, 'τετραγωνικά μέτρα')).toBe(1000)
    expect(convertFromStremmata(0.5, 'τετραγωνικά μέτρα')).toBe(500)
  })

  it('converts stremmata to square kilometers', () => {
    expect(convertFromStremmata(1000000, 'τετραγωνικά χιλιόμετρα')).toBe(1)
    expect(convertFromStremmata(1000, 'τετραγωνικά χιλιόμετρα')).toBe(0.001)
  })

  it('handles zero values', () => {
    expect(convertFromStremmata(0, 'εκτάρια')).toBe(0)
  })
})

describe('getUnitAbbreviation', () => {
  it('returns correct abbreviation for stremmata', () => {
    expect(getUnitAbbreviation('στρέμματα')).toBe('στρ.')
  })

  it('returns correct abbreviation for hectares', () => {
    expect(getUnitAbbreviation('εκτάρια')).toBe('εκτ.')
  })

  it('returns correct abbreviation for square meters', () => {
    expect(getUnitAbbreviation('τετραγωνικά μέτρα')).toBe('τ.μ.')
  })

  it('returns correct abbreviation for square kilometers', () => {
    expect(getUnitAbbreviation('τετραγωνικά χιλιόμετρα')).toBe('χλμ²')
  })
})

describe('formatArea', () => {
  it('formats area with default precision', () => {
    expect(formatArea(10.5, 'στρέμματα')).toBe('10.5 στρ.')
    expect(formatArea(2.5, 'εκτάρια')).toBe('2.5 εκτ.')
  })

  it('formats area with custom precision', () => {
    expect(formatArea(10.567, 'στρέμματα', 2)).toBe('10.57 στρ.')
    expect(formatArea(10.567, 'στρέμματα', 0)).toBe('11 στρ.')
  })

  it('handles zero values', () => {
    expect(formatArea(0, 'στρέμματα')).toBe('0.0 στρ.')
  })

  it('handles large values', () => {
    expect(formatArea(1000000, 'τετραγωνικά μέτρα')).toBe('1000000.0 τ.μ.')
  })
})

describe('getConversionInfo', () => {
  it('returns correct conversion info for hectares', () => {
    const info = getConversionInfo(1, 'εκτάρια')
    expect(info.original).toBe('1.0 εκτ.')
    expect(info.converted).toBe('10.0 στρ.')
    expect(info.stremmataValue).toBe(10)
  })

  it('returns correct conversion info for square meters', () => {
    const info = getConversionInfo(2500, 'τετραγωνικά μέτρα')
    expect(info.original).toBe('2500.0 τ.μ.')
    expect(info.converted).toBe('2.5 στρ.')
    expect(info.stremmataValue).toBe(2.5)
  })

  it('handles stremmata (no conversion needed)', () => {
    const info = getConversionInfo(5, 'στρέμματα')
    expect(info.original).toBe('5.0 στρ.')
    expect(info.converted).toBe('5.0 στρ.')
    expect(info.stremmataValue).toBe(5)
  })
})

describe('round-trip conversions', () => {
  it('maintains value through round-trip for hectares', () => {
    const original = 5
    const toStremmata = convertToStremmata(original, 'εκτάρια')
    const backToHectares = convertFromStremmata(toStremmata, 'εκτάρια')
    expect(backToHectares).toBe(original)
  })

  it('maintains value through round-trip for square meters', () => {
    const original = 2500
    const toStremmata = convertToStremmata(original, 'τετραγωνικά μέτρα')
    const backToSqMeters = convertFromStremmata(toStremmata, 'τετραγωνικά μέτρα')
    expect(backToSqMeters).toBe(original)
  })

  it('maintains value through round-trip for square kilometers', () => {
    const original = 0.5
    const toStremmata = convertToStremmata(original, 'τετραγωνικά χιλιόμετρα')
    const backToSqKm = convertFromStremmata(toStremmata, 'τετραγωνικά χιλιόμετρα')
    expect(backToSqKm).toBe(original)
  })
})
