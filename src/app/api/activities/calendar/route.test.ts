import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ auth: vi.fn(), findMany: vi.fn() }))
vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }))
vi.mock('@/lib/db', () => ({ prisma: { activity: { findMany: mocks.findMany } } }))
import { GET } from './route'

describe('private task calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('rejects signed-out requests before reading any tasks', async () => {
    mocks.auth.mockResolvedValue({ userId: null })
    expect((await GET()).status).toBe(401)
    expect(mocks.findMany).not.toHaveBeenCalled()
  })
  it('only queries active groves owned by the signed-in user and prevents caching', async () => {
    mocks.auth.mockResolvedValue({ userId: 'owner-1' })
    mocks.findMany.mockResolvedValue([])
    const response = await GET()
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          farm: { user: { clerkId: 'owner-1' }, isActive: true },
          completed: false,
        }),
      })
    )
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(response.headers.get('Content-Type')).toContain('text/calendar')
    expect(await response.text()).toContain('BEGIN:VCALENDAR')
  })
  it('returns a recoverable error when storage is unavailable', async () => {
    mocks.auth.mockResolvedValue({ userId: 'owner-1' })
    mocks.findMany.mockRejectedValue(new Error('offline'))
    expect((await GET()).status).toBe(500)
  })
})
