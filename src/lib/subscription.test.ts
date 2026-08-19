import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findUniqueMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

import { hasPaidEntitlements } from './plans'
import { getUserPlanByClerkId } from './subscription'

function subscription(status: string) {
  return {
    plan: 'GROWER',
    status,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: new Date('2026-09-01T00:00:00.000Z'),
    stripeCustomerId: 'cus_test',
    stripeSubscriptionId: 'sub_test',
  }
}

describe('subscription entitlements', () => {
  beforeEach(() => {
    findUniqueMock.mockReset()
  })

  it.each(['ACTIVE', 'TRIALING'])('keeps paid entitlements for %s subscriptions', async (status) => {
    findUniqueMock.mockResolvedValue({ subscription: subscription(status) })

    const result = await getUserPlanByClerkId('user_test')

    expect(hasPaidEntitlements(status)).toBe(true)
    expect(result.plan).toBe('GROWER')
    expect(result.config.features.aiGeoponos).toBe(true)
    expect(result.status).toBe(status)
  })

  it.each(['PAST_DUE', 'CANCELED', 'INCOMPLETE'])(
    'removes paid entitlements for %s subscriptions',
    async (status) => {
      findUniqueMock.mockResolvedValue({ subscription: subscription(status) })

      const result = await getUserPlanByClerkId('user_test')

      expect(hasPaidEntitlements(status)).toBe(false)
      expect(result.plan).toBe('FREE')
      expect(result.config.features.aiGeoponos).toBe(false)
      expect(result.status).toBe(status)
      expect(result.stripeSubscriptionId).toBe('sub_test')
    }
  )
})
