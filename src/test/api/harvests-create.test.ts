import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  prisma: {
    farm: {
      findFirst: vi.fn(),
    },
    harvest: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

import { POST } from '@/app/api/harvests/create/route'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

describe('POST /api/harvests/create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a harvest collection row with collectionDate', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-user-123' } as never)
    vi.mocked(prisma.farm.findFirst).mockResolvedValue({
      id: 'farm-123',
      name: 'North Grove',
    } as never)

    const startDate = new Date('2026-10-18T00:00:00.000Z')
    vi.mocked(prisma.harvest.create).mockResolvedValue({
      id: 'harvest-123',
      farmId: 'farm-123',
      year: 2026,
      startDate,
      endDate: null,
      collectionDate: startDate,
      totalYield: 310,
      totalYieldTons: 0.31,
      pricePerKg: 1.2,
      pricePerTon: 1200,
      priceUnit: 'PER_KG',
      totalValue: 372,
      yieldPerTree: 3.1,
      yieldPerStremma: 62,
      notes: null,
      completed: false,
      createdAt: new Date('2026-10-18T00:00:00.000Z'),
      updatedAt: new Date('2026-10-18T00:00:00.000Z'),
    } as never)

    const request = new NextRequest('http://localhost/api/harvests/create', {
      method: 'POST',
      body: JSON.stringify({
        farmId: 'farm-123',
        year: 2026,
        collectionDate: '2026-10-18',
        totalYield: 310,
        totalYieldUnit: 'kg',
        pricePerKg: 1.2,
        pricePerTon: 1200,
        priceUnit: 'PER_KG',
        totalValue: 372,
        yieldPerTree: 3.1,
        yieldPerStremma: 62,
        completed: false,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.harvest.collectionDate).toBe(startDate.toISOString())
    expect(prisma.harvest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        farmId: 'farm-123',
        year: 2026,
        startDate,
        collectionDate: startDate,
        totalYield: 310,
        completed: false,
      }),
    })
  })
})
