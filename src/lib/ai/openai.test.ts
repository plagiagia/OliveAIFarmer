import { beforeEach, describe, expect, it, vi } from 'vitest'
import { summarizeWeather, type FarmContext } from './context'

const mock = vi.hoisted(() => ({ create: vi.fn(), options: vi.fn() }))
vi.mock('@/env', () => ({ env: { OPENAI_API_KEY: 'test-key', OPENAI_MODEL: 'gpt-5.6-luna' } }))
vi.mock('openai', () => ({ default: class { responses = { create: mock.create }; constructor(options: unknown) { mock.options(options) } } }))
import { generateInsights } from '@/lib/openai'

const context: FarmContext = { farmId: 'test', name: 'Test', location: 'Μεσσηνία', variety: 'Κορωνέικη', treeCount: null, recentActivities: [], harvests: [], weatherSummary: summarizeWeather([]), currentMonth: 9, currentSeason: 'Φθινόπωρο', asOf: '2026-09-05' }
const insight = { type: 'TASK_REMINDER', title: 'Έλεγχος', message: 'Καταγράψτε παρατηρήσεις', reasoning: 'Δεν υπάρχουν καταγραφές', urgency: 'LOW', actionRequired: true, evidenceIds: ['region'], missingData: ['Έδαφος'], followUpQuestion: null }
function response(over = {}) { return { id: 'response-1', model: 'gpt-5.6-luna', status: 'completed', usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 }, output_text: JSON.stringify({ insights: [insight] }), ...over } }

beforeEach(() => mock.create.mockReset())
describe('bounded structured AI generation', () => {
  it('uses bounded output, strict structure, no provider storage and no nested retries', async () => {
    mock.create.mockResolvedValue(response())
    const onUsage = vi.fn().mockResolvedValue(undefined)
    await generateInsights(context, onUsage)
    expect(mock.options).toHaveBeenCalledWith(expect.objectContaining({ timeout: 25000, maxRetries: 0 }))
    expect(mock.create).toHaveBeenCalledWith(expect.objectContaining({ store: false, max_output_tokens: 3000, text: { format: expect.objectContaining({ type: 'json_schema', strict: true }) } }))
    expect(onUsage).toHaveBeenCalledWith(expect.objectContaining({ usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 } }))
  })
  it.each([
    ['invalid JSON', { output_text: '{' }],
    ['refusal', { output_text: '' }],
    ['truncation', { status: 'incomplete' }],
    ['invented evidence', { output_text: JSON.stringify({ insights: [{ ...insight, evidenceIds: ['soil_sensor'] }] }) }],
    ['weather risk without weather', { output_text: JSON.stringify({ insights: [{ ...insight, type: 'WEATHER_ALERT' }] }) }],
  ])('accounts for billed %s before rejecting the response', async (_name, override) => {
    mock.create.mockResolvedValue(response(override))
    const onUsage = vi.fn().mockResolvedValue(undefined)
    await expect(generateInsights(context, onUsage)).rejects.toThrow()
    expect(onUsage).toHaveBeenCalledTimes(1)
    expect(mock.create).toHaveBeenCalledTimes(1)
  })
  it('does not return recommendations if usage cannot be recorded', async () => {
    mock.create.mockResolvedValue(response())
    await expect(generateInsights(context, async () => { throw new Error('DB unavailable') })).rejects.toThrow('DB unavailable')
  })
})
