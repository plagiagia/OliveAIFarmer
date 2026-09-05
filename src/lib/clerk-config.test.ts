import { describe, expect, it } from 'vitest'
import { validateClerkConfig } from './clerk-config'

const base = { isProduction: false } as const

describe('validateClerkConfig', () => {
  it('accepts the default non-satellite setup', () => {
    const report = validateClerkConfig({
      ...base,
      publishableKey: 'pk_test_abc',
      signInUrl: '/sign-in',
    })

    expect(report.errors).toEqual([])
    expect(report.warnings).toEqual([])
  })

  it('rejects satellite mode with a relative signInUrl', () => {
    const report = validateClerkConfig({
      ...base,
      isSatellite: 'true',
      signInUrl: '/sign-in',
    })

    expect(report.errors).toHaveLength(1)
    expect(report.errors[0]).toContain('NEXT_PUBLIC_CLERK_IS_SATELLITE')
  })

  it('rejects satellite mode with no signInUrl at all', () => {
    const report = validateClerkConfig({ ...base, isSatellite: '1' })

    expect(report.errors).toHaveLength(1)
  })

  it('accepts satellite mode with an absolute signInUrl', () => {
    const report = validateClerkConfig({
      ...base,
      isSatellite: 'true',
      signInUrl: 'https://oliveiq.gr/sign-in',
    })

    expect(report.errors).toEqual([])
  })

  it('warns when production runs a Clerk development instance', () => {
    const report = validateClerkConfig({
      isProduction: true,
      publishableKey: 'pk_test_c3dlZXQtc3dhbi0zNC5jbGVyay5hY2NvdW50cy5kZXYk',
      signInUrl: '/sign-in',
    })

    expect(report.errors).toEqual([])
    expect(report.warnings).toHaveLength(1)
    expect(report.warnings[0]).toContain('pk_live_')
  })

  it('is quiet when production runs a Clerk production instance', () => {
    const report = validateClerkConfig({
      isProduction: true,
      publishableKey: 'pk_live_abc',
      signInUrl: '/sign-in',
    })

    expect(report.warnings).toEqual([])
  })

  it('does not warn about development keys outside production', () => {
    const report = validateClerkConfig({
      isProduction: false,
      publishableKey: 'pk_test_abc',
    })

    expect(report.warnings).toEqual([])
  })
})
