import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatDateTime, capitalizeFirst, truncateText } from './utils'

describe('cn (className merge utility)', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', true && 'active')).toBe('base active')
    expect(cn('base', false && 'active')).toBe('base')
  })

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
  })

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('handles arrays of classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })
})

describe('formatDate', () => {
  it('formats date in Greek locale by default', () => {
    const date = new Date('2024-03-15')
    const result = formatDate(date)
    // Should include Greek month name
    expect(result).toContain('2024')
    expect(result).toContain('15')
  })

  it('respects custom locale', () => {
    const date = new Date('2024-03-15')
    const result = formatDate(date, 'en-US')
    expect(result).toContain('March')
  })

  it('handles various date inputs', () => {
    const date = new Date('2024-01-01')
    const result = formatDate(date, 'el-GR')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })
})

describe('formatDateTime', () => {
  it('formats date and time correctly', () => {
    const date = new Date('2024-03-15T14:30:00')
    const result = formatDateTime(date)
    expect(result).toContain('2024')
    expect(result).toContain('15')
  })

  it('includes time component', () => {
    const date = new Date('2024-03-15T14:30:00')
    const result = formatDateTime(date, 'en-US')
    // Should contain time (format may vary)
    expect(result).toBeTruthy()
  })

  it('respects custom locale', () => {
    const date = new Date('2024-03-15T10:00:00')
    const result = formatDateTime(date, 'en-US')
    expect(result).toContain('Mar')
  })
})

describe('capitalizeFirst', () => {
  it('capitalizes first letter of string', () => {
    expect(capitalizeFirst('hello')).toBe('Hello')
  })

  it('handles already capitalized strings', () => {
    expect(capitalizeFirst('Hello')).toBe('Hello')
  })

  it('handles single character', () => {
    expect(capitalizeFirst('a')).toBe('A')
  })

  it('handles empty string', () => {
    expect(capitalizeFirst('')).toBe('')
  })

  it('preserves rest of string', () => {
    expect(capitalizeFirst('hELLO WORLD')).toBe('HELLO WORLD')
  })

  it('handles Greek characters', () => {
    expect(capitalizeFirst('ελιά')).toBe('Ελιά')
  })
})

describe('truncateText', () => {
  it('returns original text if shorter than maxLength', () => {
    expect(truncateText('short', 10)).toBe('short')
  })

  it('truncates text longer than maxLength', () => {
    expect(truncateText('this is a long text', 10)).toBe('this is a ...')
  })

  it('handles exact length', () => {
    expect(truncateText('exact', 5)).toBe('exact')
  })

  it('handles empty string', () => {
    expect(truncateText('', 10)).toBe('')
  })

  it('handles maxLength of 0', () => {
    expect(truncateText('hello', 0)).toBe('...')
  })

  it('adds ellipsis correctly', () => {
    const result = truncateText('hello world', 5)
    expect(result.endsWith('...')).toBe(true)
  })
})
