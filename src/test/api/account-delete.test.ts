import { beforeEach, describe, expect, it, vi } from 'vitest'

const deleteClerkUser = vi.fn()

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    aIUsage: {
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/stripe', () => ({
  stripe: {
    subscriptions: {
      cancel: vi.fn(),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}))

import { DELETE } from '@/app/api/account/route'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { auth, clerkClient } from '@clerk/nextjs/server'

describe('DELETE /api/account', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(clerkClient).mockResolvedValue({
      users: { deleteUser: deleteClerkUser },
    } as never)
  })

  it('returns 401 when the user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never)

    const response = await DELETE()

    expect(response.status).toBe(401)
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('aborts without deleting data when Stripe cancellation fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-user-123' } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-123',
      subscription: { stripeSubscriptionId: 'sub_123' },
    } as never)
    vi.mocked(stripe.subscriptions.cancel).mockRejectedValue(new Error('Stripe unavailable'))

    const response = await DELETE()
    const data = await response.json()

    expect(response.status).toBe(502)
    expect(data.error).toContain('Δεν διαγράφηκαν δεδομένα')
    expect(stripe.subscriptions.cancel).toHaveBeenCalledWith('sub_123')
    expect(prisma.aIUsage.deleteMany).not.toHaveBeenCalled()
    expect(prisma.user.delete).not.toHaveBeenCalled()
    expect(deleteClerkUser).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith(
      '[account-delete] stripe cancel failed; aborting account deletion:',
      expect.any(Error)
    )
    errorSpy.mockRestore()
  })

  it('deletes local data and the Clerk user after Stripe cancellation succeeds', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-user-123' } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-123',
      subscription: { stripeSubscriptionId: 'sub_123' },
    } as never)
    vi.mocked(stripe.subscriptions.cancel).mockResolvedValue({} as never)
    vi.mocked(prisma.aIUsage.deleteMany).mockResolvedValue({ count: 1 })
    vi.mocked(prisma.user.delete).mockResolvedValue({ id: 'user-123' } as never)

    const response = await DELETE()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(stripe.subscriptions.cancel).toHaveBeenCalledWith('sub_123')
    expect(prisma.aIUsage.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'clerk-user-123' },
    })
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-123' } })
    expect(deleteClerkUser).toHaveBeenCalledWith('clerk-user-123')
  })
})
