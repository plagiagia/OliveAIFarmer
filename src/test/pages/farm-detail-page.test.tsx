/**
 * Regression tests for /dashboard/farms/[farmId].
 *
 * This route returned 500s in production for three months because the Clerk
 * middleware matcher skipped farm ids that happened to contain an
 * extension-like substring (see src/middleware.test.ts). The matcher is fixed
 * there; these tests cover the page's own contract — that it never renders farm
 * data for a caller who is not the owner, and that each rejection is a redirect
 * rather than a throw.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'

const auth = vi.fn()
const getFarmById = vi.fn()
const getUserByClerkId = vi.fn()
const reconcileFarmActivationByClerkId = vi.fn()

class RedirectError extends Error {
  constructor(public readonly to: string) {
    super(`NEXT_REDIRECT:${to}`)
  }
}

vi.mock('@clerk/nextjs/server', () => ({ auth: () => auth() }))
vi.mock('@/lib/db', () => ({
  getFarmById: (...args: unknown[]) => getFarmById(...args),
  getUserByClerkId: (...args: unknown[]) => getUserByClerkId(...args),
}))
vi.mock('@/lib/farm-activation', () => ({
  reconcileFarmActivationByClerkId: (...args: unknown[]) =>
    reconcileFarmActivationByClerkId(...args),
}))
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new RedirectError(to)
  },
}))
vi.mock('@/components/farms/FarmDetailContent', () => ({
  default: ({ farm }: { farm: { id: string } }) => `farm:${farm.id}`,
}))

const FarmDetailPage = (await import('@/app/dashboard/farms/[farmId]/page')).default

const FARM_ID = 'cmtie911e000110g8y9e8ajs3'
const props = { params: Promise.resolve({ farmId: FARM_ID }) }

async function redirectTargetOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise
  } catch (err) {
    if (err instanceof RedirectError) return err.to
    throw err
  }
  throw new Error('expected a redirect, but the page rendered')
}

describe('FarmDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects signed-out visitors to the landing page', async () => {
    auth.mockResolvedValue({ userId: null })

    expect(await redirectTargetOf(FarmDetailPage(props))).toBe('/')
    expect(getFarmById).not.toHaveBeenCalled()
  })

  it('redirects to the dashboard when the Clerk user has no database record', async () => {
    auth.mockResolvedValue({ userId: 'user_1' })
    getUserByClerkId.mockResolvedValue(null)

    expect(await redirectTargetOf(FarmDetailPage(props))).toBe('/dashboard')
  })

  it('redirects to the dashboard when the farm does not exist', async () => {
    auth.mockResolvedValue({ userId: 'user_1' })
    getUserByClerkId.mockResolvedValue({ id: 'db_1' })
    getFarmById.mockResolvedValue(null)

    expect(await redirectTargetOf(FarmDetailPage(props))).toBe('/dashboard')
  })

  it('redirects to the dashboard when the farm belongs to someone else', async () => {
    auth.mockResolvedValue({ userId: 'user_1' })
    getUserByClerkId.mockResolvedValue({ id: 'db_1' })
    getFarmById.mockResolvedValue({ id: FARM_ID, userId: 'db_2' })

    expect(await redirectTargetOf(FarmDetailPage(props))).toBe('/dashboard')
  })

  it('renders the farm for its owner, scoping the lookup to the Clerk user', async () => {
    auth.mockResolvedValue({ userId: 'user_1' })
    getUserByClerkId.mockResolvedValue({ id: 'db_1' })
    getFarmById.mockResolvedValue({ id: FARM_ID, userId: 'db_1' })

    const element = await FarmDetailPage(props)

    expect(element).toBeTruthy()
    expect(getFarmById).toHaveBeenCalledWith(FARM_ID, 'user_1')
    expect(reconcileFarmActivationByClerkId).toHaveBeenCalledWith('user_1')
  })
})
