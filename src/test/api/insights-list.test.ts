import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  farm: vi.fn(),
  findMany: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }))
vi.mock('@/lib/db', () => ({
  prisma: {
    farm: { findFirst: mocks.farm },
    smartRecommendation: { findMany: mocks.findMany },
  },
}))

import { GET } from '@/app/api/insights/[farmId]/route'

const baseInsight = {
  type: 'RISK_WARNING',
  title: 'Alert',
  message: 'Message',
  actionRequired: true,
  urgency: 'MEDIUM',
  source: 'WEATHER_ALERT',
  farmId: 'farm',
  weatherBased: true,
  contextHash: 'dakos-alert',
  isArchived: false,
  isRead: false,
  isActioned: false,
  validUntil: new Date('2026-09-12T00:00:00.000Z'),
}

function request() {
  return new NextRequest('http://localhost/api/insights/farm')
}

describe('GET /api/insights/[farmId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ userId: 'owner' })
    mocks.farm.mockResolvedValue({ id: 'farm', isActive: true })
  })

  it('returns only the newest dakos alert while preserving other insights', async () => {
    const older = { ...baseInsight, id: 'older', createdAt: new Date('2026-09-02T12:00:00.000Z') }
    const newest = { ...baseInsight, id: 'newest', createdAt: new Date('2026-09-05T18:00:00.000Z') }
    const other = {
      ...baseInsight,
      id: 'ai',
      source: 'AI_GENERATED',
      contextHash: 'farm:context',
      title: 'AI insight',
      createdAt: new Date('2026-09-06T07:00:00.000Z'),
    }
    mocks.findMany.mockResolvedValue([older, newest, other])

    const response = await GET(request(), { params: Promise.resolve({ farmId: 'farm' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.insights.map((insight: { id: string }) => insight.id)).toEqual(['newest', 'ai'])
    expect(data.unreadCount).toBe(2)
  })
})
