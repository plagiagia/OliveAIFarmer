import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    farm: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'
import {
  assertFarmIsActive,
  reconcileFarmActivationByClerkId,
  reconcileFarmActivationForUser,
} from '@/lib/farm-activation'

describe('farm-activation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('assertFarmIsActive', () => {
    it('throws NotFoundError when farm is missing', () => {
      expect(() => assertFarmIsActive(null)).toThrow('δεν βρέθηκε')
    })

    it('throws ForbiddenError when farm is inactive', () => {
      expect(() => assertFarmIsActive({ isActive: false })).toThrow('ανενεργός')
    })

    it('passes when farm is active', () => {
      expect(() => assertFarmIsActive({ isActive: true })).not.toThrow()
    })
  })

  describe('reconcileFarmActivationForUser', () => {
    it('keeps only the latest farm active on FREE plan', async () => {
      vi.mocked(prisma.farm.findMany).mockResolvedValue([
        { id: 'newest' },
        { id: 'older' },
        { id: 'oldest' },
      ] as never)
      vi.mocked(prisma.farm.updateMany)
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 2 })

      const result = await reconcileFarmActivationForUser('user-1', 'FREE')

      expect(result).toEqual({ activated: 1, deactivated: 2 })
      expect(prisma.farm.updateMany).toHaveBeenNthCalledWith(1, {
        where: { userId: 'user-1', id: { in: ['newest'] }, isActive: false },
        data: { isActive: true },
      })
      expect(prisma.farm.updateMany).toHaveBeenNthCalledWith(2, {
        where: { userId: 'user-1', id: { in: ['older', 'oldest'] }, isActive: true },
        data: { isActive: false },
      })
    })

    it('activates all farms when plan has unlimited groves', async () => {
      vi.mocked(prisma.farm.findMany).mockResolvedValue([
        { id: 'a' },
        { id: 'b' },
      ] as never)
      vi.mocked(prisma.farm.updateMany).mockResolvedValue({ count: 2 })

      const result = await reconcileFarmActivationForUser('user-1', 'GROWER')

      expect(result).toEqual({ activated: 2, deactivated: 0 })
      expect(prisma.farm.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isActive: false },
        data: { isActive: true },
      })
    })
  })

  describe('reconcileFarmActivationByClerkId', () => {
    it('applies FREE limits to a past-due paid subscription', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        subscription: { plan: 'GROWER', status: 'PAST_DUE' },
      } as never)
      vi.mocked(prisma.farm.findMany).mockResolvedValue([
        { id: 'newest' },
        { id: 'older' },
      ] as never)
      vi.mocked(prisma.farm.updateMany)
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 1 })

      await reconcileFarmActivationByClerkId('clerk-user-1')

      expect(prisma.farm.updateMany).toHaveBeenNthCalledWith(2, {
        where: { userId: 'user-1', id: { in: ['older'] }, isActive: true },
        data: { isActive: false },
      })
    })
  })
})
