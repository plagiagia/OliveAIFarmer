import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const m = vi.hoisted(() => ({ auth: vi.fn(), plan: vi.fn(), rate: vi.fn(), farm: vi.fn(), weather: vi.fn(), harvest: vi.fn(), find: vi.fn(), archive: vi.fn(), create: vi.fn(), lock: vi.fn(), generate: vi.fn(), reserve: vi.fn(), settle: vi.fn(), finish: vi.fn(), removeUsage: vi.fn() }))
vi.mock('@clerk/nextjs/server', () => ({ auth: m.auth }))
vi.mock('@/env', () => ({ env: { OPENAI_API_KEY: 'test' } }))
vi.mock('@/lib/subscription', () => ({ getUserPlanByClerkId: m.plan }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimitAsync: m.rate }))
vi.mock('@/lib/openai', () => ({ generateInsights: m.generate, AI_MODEL: 'model', FARM_INSIGHTS_PROMPT_VERSION: 'v3', reservationTokens: () => 100, getCurrentSeason: () => 'Φθινόπωρο' }))
vi.mock('@/lib/ai/usage', () => ({ reserveAIUsage: m.reserve, settleAIUsage: m.settle, finishAIUsage: m.finish, AIBudgetError: class extends Error {}, AIBusyError: class extends Error {} }))
vi.mock('@/lib/db', () => {
  const tx = { $executeRaw: m.lock, smartRecommendation: { findMany: m.find, updateMany: m.archive, create: m.create } }
  return { getWeatherHistory: m.weather, prisma: { ...tx, farm: { findFirst: m.farm }, harvest: { groupBy: m.harvest }, aIUsage: { delete: m.removeUsage }, $transaction: (fn: (tx: unknown) => unknown) => fn(tx) } }
})
import { POST } from '@/app/api/insights/generate/route'

const generated = { type: 'TASK_REMINDER', title: 'Έλεγχος', message: 'Παρατηρήστε', urgency: 'LOW', actionRequired: true, reasoning: 'Λείπουν καταγραφές', evidenceIds: ['region'], missingData: [], followUpQuestion: null }
const meta = { model: 'model', promptVersion: 'v3', requestId: 'r', generatedAt: '2026-09-05', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } }
function request(body: unknown = { farmId: 'farm' }) { return new NextRequest('http://localhost/api/insights/generate', { method: 'POST', body: JSON.stringify(body) }) }
beforeEach(() => {
  vi.clearAllMocks()
  m.auth.mockResolvedValue({ userId: 'owner' }); m.plan.mockResolvedValue({ plan: 'GROWER' }); m.rate.mockResolvedValue({ allowed: true })
  m.farm.mockResolvedValue({ id: 'farm', name: 'Ελαιώνας', location: 'Μεσσηνία', treeCount: null, isActive: true, activities: [] })
  m.weather.mockResolvedValue([]); m.harvest.mockResolvedValue([]); m.find.mockResolvedValue([])
  m.reserve.mockResolvedValue({ id: 'reservation' }); m.finish.mockResolvedValue(undefined)
  m.generate.mockImplementation(async (_context, onUsage) => { await onUsage(meta); return { insights: [generated], meta } })
  m.create.mockImplementation(async ({ data }) => ({ ...data, id: 'saved' }))
})
describe('AI generation endpoint', () => {
  it('rejects unauthenticated and free-plan generation without calling the model', async () => {
    m.auth.mockResolvedValueOnce({ userId: null })
    expect((await POST(request())).status).toBe(401)
    m.plan.mockResolvedValueOnce({ plan: 'FREE' })
    expect((await POST(request())).status).toBe(403)
    expect(m.generate).not.toHaveBeenCalled()
  })
  it('rejects invalid input and inactive or foreign farms', async () => {
    expect((await POST(request({ farmId: '' }))).status).toBe(400)
    m.farm.mockResolvedValueOnce(null)
    expect((await POST(request())).status).toBe(404)
    m.farm.mockResolvedValueOnce({ isActive: false })
    expect((await POST(request())).status).toBe(403)
    expect(m.generate).not.toHaveBeenCalled()
    expect(m.farm).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'farm', user: { clerkId: 'owner' } } }))
  })
  it('returns cached recommendations before charging budget or generation rate', async () => {
    m.find.mockResolvedValueOnce([{ id: 'cached', source: 'AI_GENERATED' }])
    const response = await POST(request())
    expect(await response.json()).toMatchObject({ cached: true })
    expect(m.reserve).not.toHaveBeenCalled(); expect(m.generate).not.toHaveBeenCalled(); expect(m.rate).not.toHaveBeenCalled()
  })
  it('keeps unknown counts and measurements unknown, aggregates completed harvest years, and persists evidence', async () => {
    const response = await POST(request())
    expect(response.status).toBe(200)
    expect(m.generate.mock.calls[0][0]).toMatchObject({ treeCount: null, variety: 'Άγνωστη', weatherSummary: { totalRainfall: null } })
    expect(m.harvest).toHaveBeenCalledWith(expect.objectContaining({ by: ['year'], where: expect.objectContaining({ completed: true }) }))
    expect(m.create.mock.calls[0][0].data.triggerConditions.evidence[0].detail).toContain('Μεσσηνία')
    expect(m.settle).toHaveBeenCalledWith('reservation', meta)
    expect(m.finish).toHaveBeenCalledWith('reservation', true)
    expect(m.finish.mock.invocationCallOrder[0]).toBeGreaterThan(m.create.mock.invocationCallOrder[0])
  })
  it('preserves a valid prior AI batch if new generation fails', async () => {
    m.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'previous', source: 'AI_GENERATED' }])
    m.generate.mockRejectedValueOnce(new Error('timeout'))
    expect(await (await POST(request())).json()).toMatchObject({ usedFallback: true, insights: [{ id: 'previous' }] })
    expect(m.archive).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled()
    expect(m.finish).toHaveBeenCalledWith('reservation', false)
  })
  it('saves clearly labelled short-lived fallback reminders if no prior AI is available', async () => {
    m.generate.mockRejectedValueOnce(new Error('timeout'))
    const result = await (await POST(request())).json()
    expect(result.usedFallback).toBe(true)
    expect(result.insights.every((i: { source: string }) => i.source === 'RULE_BASED')).toBe(true)
    const data = m.create.mock.calls[0][0].data
    expect(data.validUntil.getTime() - data.validFrom.getTime()).toBe(600_000)
  })
})
