import OpenAI from 'openai'
import {
  aiInsightsResponseSchema,
  dashboardResponseSchema,
  type AIInsightParsed,
  type DashboardAIInsightParsed,
} from '@/lib/ai/schemas'
import { withRetry } from '@/lib/ai/retry'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key is not configured - AI Insights will not be available')
}

export const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null

// Model is overridable per-environment so we can A/B without redeploy.
export const AI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
export const AI_VISION_MODEL = process.env.OPENAI_VISION_MODEL ?? 'gpt-4o'
export const FARM_INSIGHTS_PROMPT_VERSION = 'farm-v2.0'
export const DASHBOARD_INSIGHTS_PROMPT_VERSION = 'dashboard-v2.0'
export const CHAT_PROMPT_VERSION = 'chat-v1.0'
export const DIAGNOSE_PROMPT_VERSION = 'diagnose-v1.0'

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

  // Satellite data (optional - from Copernicus)
  satelliteData?: {
    ndvi: number | null           // Vegetation index (-1 to 1)
    ndmi: number | null           // Moisture index
    healthScore: number | null    // 0-100 score
    stressLevel: string | null    // HEALTHY, MILD_STRESS, etc.
    ndviTrend: string | null      // improving, stable, declining
    lastUpdated: string | null    // ISO date string
  }
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

// Dashboard portfolio context
export interface DashboardPortfolioContext {
  totalFarms: number
  totalTrees: number
  totalArea: number
  farms: {
    id: string
    name: string
    location: string
    variety: string
    treeAge: number | null
    treeCount: number
    totalArea: number
    recentActivities: {
      type: string
      title: string
      date: string
      completed: boolean
    }[]
    harvestTrend: 'improving' | 'declining' | 'stable' | null
    lastHarvest: {
      year: number
      yieldPerTree: number | null
      totalYield: number | null
    } | null
    satelliteHealth: {
      ndvi: number | null
      stressLevel: string | null
      trend: string | null
      lastUpdated: string
    } | null
  }[]
  currentMonth: number
  currentSeason: string
  userName: string
}

// Dashboard AI insight (includes optional farmId)
export interface DashboardAIInsight extends AIInsight {
  farmId?: string | null  // Specific farm or null for portfolio-level
  farmName?: string       // For display
}

export interface DashboardAIResponse {
  insights: DashboardAIInsight[]
  portfolioSummary?: {
    overallHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
    urgentActions: number
    opportunitiesCount: number
  }
  meta: AIResponseMeta
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

${context.satelliteData ? `ΔΟΡΥΦΟΡΙΚΑ ΔΕΔΟΜΕΝΑ (Copernicus Sentinel-2):
- Δείκτης βλάστησης NDVI: ${context.satelliteData.ndvi?.toFixed(3) || 'Μη διαθέσιμο'} (κλίμακα: -1 έως 1, >0.6 = υγιής, <0.4 = στρες)
- Δείκτης υγρασίας NDMI: ${context.satelliteData.ndmi?.toFixed(3) || 'Μη διαθέσιμο'} (>0.2 = καλή υγρασία, <0 = χαμηλή)
- Βαθμός υγείας: ${context.satelliteData.healthScore || 'Μη διαθέσιμο'}/100
- Επίπεδο στρες: ${context.satelliteData.stressLevel === 'HEALTHY' ? 'Υγιής' :
    context.satelliteData.stressLevel === 'MILD_STRESS' ? 'Ελαφρύ στρες' :
    context.satelliteData.stressLevel === 'MODERATE_STRESS' ? 'Μέτριο στρες' :
    context.satelliteData.stressLevel === 'SEVERE_STRESS' ? 'Σοβαρό στρες' : 'Μη διαθέσιμο'}
- Τάση NDVI: ${context.satelliteData.ndviTrend === 'improving' ? 'Βελτίωση ↑' :
    context.satelliteData.ndviTrend === 'declining' ? 'Πτώση ↓' :
    context.satelliteData.ndviTrend === 'stable' ? 'Σταθερή' : 'Μη διαθέσιμο'}
- Τελευταία ενημέρωση: ${context.satelliteData.lastUpdated ? new Date(context.satelliteData.lastUpdated).toLocaleDateString('el-GR') : 'Μη διαθέσιμο'}
` : ''}`
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

// Static dashboard system prompt — eligible for OpenAI prompt caching.
export const DASHBOARD_SYSTEM_PROMPT = `Είσαι έμπειρος Έλληνας γεωπόνος και στρατηγικός αγροτικός σύμβουλος.
Λαμβάνεις ολόκληρο το χαρτοφυλάκιο ελαιώνων του χρήστη και δίνεις στρατηγικές συμβουλές για το σύνολο.

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ:
1. Χρησιμοποίησε ΑΠΟΚΛΕΙΣΤΙΚΑ τα δεδομένα στο "CONTEXT". Μην εφευρίσκεις στοιχεία.
2. Όταν αναφέρεσαι σε συγκεκριμένο ελαιώνα, χρησιμοποίησε ΥΠΟΧΡΕΩΤΙΚΑ το ακριβές farmId από το context.
3. Για συμβουλές φυτοπροστασίας μην προτείνεις δοσολογίες ή ονόματα δραστικών — μόνο γενικές οδηγίες και υπενθύμιση συμβουλής αδειοδοτημένου γεωπόνου.
4. Δώσε 5-8 στρατηγικές συμβουλές, στα Ελληνικά.
5. Προτεραιοποίησε CRITICAL/HIGH urgency για επείγουσες δράσεις.
6. Σε κάθε σύσταση δώσε confidence 0..1.

Απάντησε ΜΟΝΟ σε JSON:
{
  "insights": [
    {
      "type": "TASK_REMINDER|WEATHER_ALERT|CARE_SUGGESTION|OPTIMIZATION|RISK_WARNING|SEASONAL_TIP",
      "title": "σύντομος τίτλος",
      "message": "αναλυτική στρατηγική σύσταση",
      "urgency": "LOW|MEDIUM|HIGH|CRITICAL",
      "actionRequired": true|false,
      "reasoning": "γιατί είναι σημαντικό στρατηγικά",
      "confidence": 0.0..1.0,
      "farmId": "<farm-id ή null>",
      "farmName": "<όνομα ελαιώνα ή 'Όλοι'>"
    }
  ],
  "portfolioSummary": {
    "overallHealth": "EXCELLENT|GOOD|FAIR|POOR",
    "urgentActions": <int>,
    "opportunitiesCount": <int>
  }
}`

// Build dynamic dashboard context message
export function buildDashboardContextMessage(context: DashboardPortfolioContext): string {
  return `CONTEXT:

ΧΑΡΤΟΦΥΛΑΚΙΟ (${context.userName}):
- Συνολικοί Ελαιώνες: ${context.totalFarms}
- Συνολικά Δέντρα: ${context.totalTrees}
- Συνολική Έκταση: ${context.totalArea.toFixed(1)} στρέμματα

ΛΕΠΤΟΜΕΡΕΙΕΣ ΕΛΑΙΩΝΩΝ:
${context.farms.map((farm, idx) => `
${idx + 1}. ${farm.name} (farmId: ${farm.id})
   - Τοποθεσία: ${farm.location}
   - Ποικιλία: ${farm.variety}
   - Δέντρα: ${farm.treeCount} (ηλικία: ${farm.treeAge ? `${farm.treeAge} έτη` : 'άγνωστη'})
   - Έκταση: ${farm.totalArea || 0} στρέμματα
   ${farm.satelliteHealth ? `- Υγεία (NDVI): ${farm.satelliteHealth.ndvi?.toFixed(3) || 'N/A'} (${farm.satelliteHealth.stressLevel || 'N/A'}) - Τάση: ${farm.satelliteHealth.trend || 'N/A'}` : ''}
   ${farm.lastHarvest ? `- Τελευταία Συγκομιδή: ${farm.lastHarvest.year} (${farm.lastHarvest.yieldPerTree?.toFixed(1) || 'N/A'} kg/δέντρο)` : ''}
   ${farm.harvestTrend ? `- Τάση Απόδοσης: ${farm.harvestTrend === 'improving' ? 'Βελτίωση' : farm.harvestTrend === 'declining' ? 'Πτώση' : 'Σταθερή'}` : ''}
   - Πρόσφατες Δραστηριότητες: ${farm.recentActivities.length > 0 ? farm.recentActivities.slice(0, 3).map(a => `${a.type} (${a.date})`).join(', ') : 'Καμία'}
`).join('\n')}

ΤΡΕΧΟΥΣΑ ΠΕΡΙΟΔΟΣ:
- Μήνας: ${new Date().toLocaleDateString('el-GR', { month: 'long' })}
- Εποχή: ${context.currentSeason}`
}

// Backwards-compatible wrapper retained
export function buildDashboardPrompt(context: DashboardPortfolioContext): string {
  return `${DASHBOARD_SYSTEM_PROMPT}\n\n${buildDashboardContextMessage(context)}`
}

// Generate dashboard insights using OpenAI
export async function generateDashboardInsights(
  context: DashboardPortfolioContext
): Promise<DashboardAIResponse> {
  if (!openai) {
    throw new Error('OpenAI API key is not configured')
  }

  const userPayload = buildDashboardContextMessage(context)

  const response = await withRetry(() =>
    openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: DASHBOARD_SYSTEM_PROMPT },
        { role: 'user', content: userPayload },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 3000,
    }),
    { onRetry: (n, err) => console.warn(`[ai] retry ${n} for generateDashboardInsights`, err) }
  )

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  const json: unknown = JSON.parse(content)
  const validated = dashboardResponseSchema.parse(json)
  const insights: DashboardAIInsight[] = validated.insights.map((i: DashboardAIInsightParsed) => ({
    type: i.type,
    title: i.title,
    message: i.message,
    urgency: i.urgency,
    actionRequired: i.actionRequired,
    reasoning: i.reasoning,
    confidence: i.confidence,
    farmId: i.farmId ?? null,
    farmName: i.farmName,
  }))

  const meta: AIResponseMeta = {
    model: response.model || AI_MODEL,
    promptVersion: DASHBOARD_INSIGHTS_PROMPT_VERSION,
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
    insights: insights.slice(0, 10),
    portfolioSummary: validated.portfolioSummary,
    meta
  }
}

// ============================================================
// Conversational chat (streaming)
// ============================================================

import { leafDiagnosisSchema, type LeafDiagnosis } from '@/lib/ai/schemas'

export const CHAT_SYSTEM_PROMPT = `Είσαι ψηφιακός βοηθός γεωπόνος εξειδικευμένος στην ελληνική ελαιοκαλλιέργεια.
Απαντάς σύντομα, στα Ελληνικά, με βάση τα δεδομένα του ελαιώνα του χρήστη όταν είναι διαθέσιμα.

ΚΑΝΟΝΕΣ:
1. Αν λείπει πληροφορία, ζήτα την αντί να μαντέψεις.
2. Μην προτείνεις δοσολογίες ή ονόματα φυτοφαρμάκων· συμβούλεψε για συμβατότητα με αδειοδοτημένο γεωπόνο.
3. Σε επείγουσες καταστάσεις (έντονο στρες δέντρων, παρασιτική προσβολή σε εξέλιξη) πες ξεκάθαρα ότι χρειάζεται φυσική επίσκεψη.
4. Κράτα τις απαντήσεις 2-5 προτάσεις, εκτός αν ζητηθεί λεπτομερής εξήγηση.`

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Stream a chat completion. Returns the underlying OpenAI Stream so the
 * route handler can pipe into a Server-Sent-Events response.
 */
export async function streamChat(
  messages: ChatMessage[],
  farmContextMessage?: string
) {
  if (!openai) throw new Error('OpenAI API key is not configured')

  const sysMessages = [
    { role: 'system' as const, content: CHAT_SYSTEM_PROMPT },
    ...(farmContextMessage
      ? [{ role: 'system' as const, content: `CONTEXT (read-only):\n${farmContextMessage}` }]
      : []),
  ]

  return openai.chat.completions.create({
    model: AI_MODEL,
    stream: true,
    stream_options: { include_usage: true },
    messages: [
      ...sysMessages,
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    temperature: 0.6,
    max_tokens: 600,
  })
}

// ============================================================
// Multimodal leaf-photo diagnosis
// ============================================================

export const DIAGNOSE_SYSTEM_PROMPT = `Είσαι ψηφιακός γεωπόνος που αναλύει φωτογραφίες φύλλων και κλαδιών ελιάς.
Από την εικόνα και τυχόν σημειώσεις του χρήστη, προτείνεις πιθανές διαγνώσεις.

ΚΑΝΟΝΕΣ:
1. Δεν είσαι ντετερμινιστικός - δίνεις πιθανότητες (confidence 0..1).
2. Αν η εικόνα είναι ασαφής, χαμηλής ποιότητας ή δεν δείχνει φύλλα ελιάς, πες το ξεκάθαρα και confidence ≤ 0.3.
3. Μην προτείνεις δοσολογίες ή ονόματα φυτοφαρμάκων.
4. Πάντα πρόσθεσε disclaimer ότι η οπτική διάγνωση από φωτογραφία δεν αντικαθιστά εξέταση από αδειοδοτημένο γεωπόνο.

Απάντησε ΜΟΝΟ σε JSON:
{
  "diagnosis": "συνοπτική διάγνωση (π.χ. Πιθανό κυκλοκόνιο)",
  "confidence": 0.0..1.0,
  "symptoms": ["παρατηρούμενα συμπτώματα"],
  "likelyCauses": ["πιθανές αιτίες"],
  "recommendedActions": ["τι να κάνει ο παραγωγός (γενικά)"],
  "urgency": "LOW|MEDIUM|HIGH|CRITICAL",
  "disclaimer": "σύντομο disclaimer"
}`

export interface LeafDiagnosisResult {
  diagnosis: LeafDiagnosis
  meta: AIResponseMeta
}

/**
 * Run a vision-model diagnosis on a leaf/branch photo URL.
 * Caller must verify the URL belongs to the user's farm before invoking.
 */
export async function diagnoseLeafImage(
  imageUrl: string,
  notes?: string
): Promise<LeafDiagnosisResult> {
  if (!openai) throw new Error('OpenAI API key is not configured')

  const response = await withRetry(() =>
    openai.chat.completions.create({
      model: AI_VISION_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: DIAGNOSE_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: notes ? `Σημειώσεις παραγωγού: ${notes}` : 'Δες την παρακάτω εικόνα.',
            },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'auto' } },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 800,
    })
  )

  const content = response.choices[0].message.content
  if (!content) throw new Error('No response from OpenAI vision')

  const json: unknown = JSON.parse(content)
  const diagnosis = leafDiagnosisSchema.parse(json)

  const meta: AIResponseMeta = {
    model: response.model || AI_VISION_MODEL,
    promptVersion: DIAGNOSE_PROMPT_VERSION,
    requestId: response.id || null,
    generatedAt: new Date().toISOString(),
    usage: response.usage
      ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        }
      : null,
  }

  return { diagnosis, meta }
}
