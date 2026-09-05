import { beforeEach, describe, expect, it, vi } from 'vitest'
const db = vi.hoisted(() => ({ lock: vi.fn(), findFirst: vi.fn(), aggregate: vi.fn(), create: vi.fn(), update: vi.fn() }))
vi.mock('@/env', () => ({ env: { OPENAI_MONTHLY_TOKEN_BUDGET: 1000 } }))
vi.mock('@/lib/db', () => {
  const tx = { $executeRaw: db.lock, aIUsage: db }
  return { prisma: { ...tx, $transaction: (fn: (arg: typeof tx) => unknown) => fn(tx) } }
})
import { reserveAIUsage, settleAIUsage, finishAIUsage, AIBudgetError, AIBusyError } from './usage'

beforeEach(() => { vi.clearAllMocks(); db.findFirst.mockResolvedValue(null); db.aggregate.mockResolvedValue({ _sum: { totalTokens: 800 } }); db.create.mockResolvedValue({ id: 'reservation' }) })
describe('AI budget reservations', () => {
  it('reserves before external work while holding a per-user transaction lock', async () => {
    await reserveAIUsage('user', 'model', 200)
    expect(db.lock).toHaveBeenCalled()
    expect(db.lock.mock.invocationCallOrder[0]).toBeLessThan(db.aggregate.mock.invocationCallOrder[0])
    expect(db.create).toHaveBeenCalledWith({ data: { userId: 'user', model: 'model', endpoint: 'insights/reserved', totalTokens: 200 } })
  })
  it('rejects work whose maximum cost would exceed remaining budget', async () => {
    await expect(reserveAIUsage('user', 'model', 201)).rejects.toBeInstanceOf(AIBudgetError)
    expect(db.create).not.toHaveBeenCalled()
  })
  it('rejects a second generation while a lease is active', async () => {
    db.findFirst.mockResolvedValue({ id: 'active' })
    await expect(reserveAIUsage('user', 'model', 100)).rejects.toBeInstanceOf(AIBusyError)
    expect(db.aggregate).not.toHaveBeenCalled()
  })
  it('settles actual usage without releasing the lease before persistence', async () => {
    await settleAIUsage('r', { model: 'model', generatedAt: '', promptVersion: '', requestId: 'req', usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 } })
    expect(db.update).toHaveBeenCalledWith({ where: { id: 'r' }, data: { model: 'model', promptTokens: 10, completionTokens: 5, totalTokens: 15 } })
    await finishAIUsage('r', true)
    expect(db.update).toHaveBeenLastCalledWith({ where: { id: 'r' }, data: { endpoint: 'insights/generate' } })
  })
  it('retains the conservative token reservation on an unknown provider outcome', async () => {
    await finishAIUsage('r', false)
    expect(db.update).toHaveBeenCalledWith({ where: { id: 'r' }, data: { endpoint: 'insights/uncertain' } })
  })
})
