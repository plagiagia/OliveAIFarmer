import { withRetry } from '@/lib/ai/retry'
import { aiInsightsResponseSchema, type AIInsightParsed } from '@/lib/ai/schemas'
import OpenAI from 'openai'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key is not configured - AI Insights will not be available')
}

export const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null

// Model is overridable per-environment so we can A/B without redeploy.
export const AI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
export const FARM_INSIGHTS_PROMPT_VERSION = 'farm-v2.0'

// Type definitions for AI Insights
export interface FarmContext {
  // Farm basics
  farmId: string
  name: string
  location: string
  coordinates?: string
  totalArea?: number      // stremmata
  treeAge?: number
  variety: string
  treeCount: number

  // Recent activities (last 30 days)
  recentActivities: {
    type: string
    date: string
    title: string
    notes?: string
    completed: boolean
  }[]

  // Harvest history (last 3 years)
  harvests: {
    year: number
    totalYield?: number
    yieldPerTree?: number
    pricePerKg?: number
  }[]

  // Weather summary (last 30 days)
  weatherSummary: {
    avgTempHigh: number
    avgTempLow: number
    totalRainfall: number
    avgHumidity: number
    rainyDays: number
  }

  // Current context
  currentMonth: number
  currentSeason: string
}

export interface AIInsight {
  type: 'TASK_REMINDER' | 'WEATHER_ALERT' | 'CARE_SUGGESTION' | 'OPTIMIZATION' | 'RISK_WARNING' | 'SEASONAL_TIP'
  title: string
  message: string
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  actionRequired: boolean
  reasoning: string
  confidence?: number
}

export interface AIInsightsResponse {
  insights: AIInsight[]
  meta: AIResponseMeta
}

export interface AIResponseMeta {
  model: string
  promptVersion: string
  requestId: string | null
  generatedAt: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  } | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
// Suppress unused warning — kept exported in case future callers need it.
void isRecord

// Get current season in Greek
export function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'Άνοιξη'
  if (month >= 6 && month <= 8) return 'Καλοκαίρι'
  if (month >= 9 && month <= 11) return 'Φθινόπωρο'
  return 'Χειμώνας'
}

/**
 * Static system prompt — kept identical across requests so OpenAI's
 * automatic prompt caching can kick in (saves ~50% on input tokens
 * for the stable instructional preamble).
 *
 * All dynamic context is sent as the user message via
 * `buildFarmContextMessage`.
 */
export const FARM_SYSTEM_PROMPT = `Είσαι έμπειρος Έλληνας γεωπόνος εξειδικευμένος στην ελαιοκαλλιέργεια.
Αναλύεις δεδομένα ελαιώνα που σου παρέχονται και δίνεις επαγγελματικές, εξατομικευμένες συμβουλές.

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ:
1. Χρησιμοποίησε ΑΠΟΚΛΕΙΣΤΙΚΑ τα δεδομένα στο "CONTEXT" του χρήστη. Μην εφευρίσκεις ποικιλίες, τιμές, ή συμβάντα που δεν αναφέρονται.
2. Αν λείπουν δεδομένα για μια σύσταση, πες "Δεν υπάρχουν αρκετά δεδομένα" αντί να μαντέψεις.
3. Για συμβουλές φυτοπροστασίας: ΜΗΝ προτείνεις δοσολογίες ή συγκεκριμένα δραστικά (π.χ. ονόματα φυτοφαρμάκων). Πρότεινε ΜΟΝΟ γενικές κατευθύνσεις και υπενθύμιση συμβουλής αδειοδοτημένου γεωπόνου.
4. Δώσε 3-5 συμβουλές, στα Ελληνικά, συγκεκριμένες και πρακτικές.
5. Σε κάθε σύσταση δώσε confidence 0..1: 1 = ξεκάθαρο από τα δεδομένα, 0.3 = αβέβαιο.

Απάντησε ΜΟΝΟ σε JSON με την δομή:
{
  "insights": [
    {
      "type": "TASK_REMINDER|WEATHER_ALERT|CARE_SUGGESTION|OPTIMIZATION|RISK_WARNING|SEASONAL_TIP",
      "title": "σύντομος τίτλος",
      "message": "αναλυτική συμβουλή 2-3 προτάσεις",
      "urgency": "LOW|MEDIUM|HIGH|CRITICAL",
      "actionRequired": true|false,
      "reasoning": "γιατί δίνεις αυτή τη συμβουλή",
      "confidence": 0.0..1.0
    }
  ]
}`

/**
 * Build the dynamic user message — contains only the variable farm data.
 */
export function buildFarmContextMessage(context: FarmContext): string {
  return `CONTEXT:

ΣΤΟΙΧΕΙΑ ΕΛΑΙΩΝΑ:
- Όνομα: ${context.name}
- Τοποθεσία: ${context.location}
- Έκταση: ${context.totalArea ? `${context.totalArea} στρέμματα` : 'Δεν έχει καταχωρηθεί'}
- Ποικιλία: ${context.variety}
- Ηλικία δέντρων: ${context.treeAge ? `${context.treeAge} έτη` : 'Δεν έχει καταχωρηθεί'}
- Αριθμός δέντρων: ${context.treeCount}

ΠΡΟΣΦΑΤΕΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ (τελευταίες 30 ημέρες):
${context.recentActivities.length > 0
  ? context.recentActivities.map(a =>
      `- ${a.date}: ${a.type} - ${a.title}${a.completed ? ' ✓' : ' (σε εξέλιξη)'}${a.notes ? ` (${a.notes})` : ''}`
    ).join('\n')
  : '- Δεν υπάρχουν καταγεγραμμένες δραστηριότητες'}

ΙΣΤΟΡΙΚΟ ΣΥΓΚΟΜΙΔΩΝ:
${context.harvests.length > 0
  ? context.harvests.map(h =>
      `- ${h.year}: ${h.totalYield ? `${h.totalYield}kg συνολικά` : 'Χωρίς δεδομένα απόδοσης'}${h.yieldPerTree ? `, ${h.yieldPerTree.toFixed(1)}kg/δέντρο` : ''}${h.pricePerKg ? `, ${h.pricePerKg}€/kg` : ''}`
    ).join('\n')
  : '- Δεν υπάρχουν καταγεγραμμένες συγκομιδές'}

ΚΑΙΡΙΚΕΣ ΣΥΝΘΗΚΕΣ (τελευταίες 30 ημέρες):
- Μέση μέγιστη θερμοκρασία: ${context.weatherSummary.avgTempHigh.toFixed(1)}°C
- Μέση ελάχιστη θερμοκρασία: ${context.weatherSummary.avgTempLow.toFixed(1)}°C
- Συνολική βροχόπτωση: ${context.weatherSummary.totalRainfall.toFixed(1)}mm
- Μέση υγρασία: ${context.weatherSummary.avgHumidity.toFixed(0)}%
- Ημέρες με βροχή: ${context.weatherSummary.rainyDays}

ΤΡΕΧΟΥΣΑ ΠΕΡΙΟΔΟΣ:
- Μήνας: ${new Date().toLocaleDateString('el-GR', { month: 'long' })}
- Εποχή: ${context.currentSeason}
`
}

// Backwards-compatible wrapper retained so existing imports don't break.
export function buildSystemPrompt(context: FarmContext): string {
  return `${FARM_SYSTEM_PROMPT}\n\n${buildFarmContextMessage(context)}`
}

// Generate insights using OpenAI
export async function generateInsights(context: FarmContext): Promise<AIInsightsResponse> {
  if (!openai) {
    throw new Error('OpenAI API key is not configured')
  }

  const userPayload = buildFarmContextMessage(context)

  const response = await withRetry(() =>
    openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        // Static system prompt — eligible for OpenAI prompt caching.
        { role: 'system', content: FARM_SYSTEM_PROMPT },
        // Dynamic per-request context.
        { role: 'user', content: userPayload },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    }),
    { onRetry: (n, err) => console.warn(`[ai] retry ${n} for generateInsights`, err) }
  )

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  const json: unknown = JSON.parse(content)
  // Strict Zod parse — surfaces schema regressions instead of silently filtering.
  const validated = aiInsightsResponseSchema.parse(json)
  const validatedInsights: AIInsight[] = validated.insights.map((i: AIInsightParsed) => ({
    type: i.type,
    title: i.title,
    message: i.message,
    urgency: i.urgency,
    actionRequired: i.actionRequired,
    reasoning: i.reasoning,
    confidence: i.confidence,
  }))

  const meta: AIResponseMeta = {
    model: response.model || AI_MODEL,
    promptVersion: FARM_INSIGHTS_PROMPT_VERSION,
    requestId: response.id || null,
    generatedAt: new Date().toISOString(),
    usage: response.usage
      ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        }
      : null
  }

  return {
    insights: validatedInsights.slice(0, 8),
    meta
  }
}
