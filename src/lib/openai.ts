import OpenAI from 'openai'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key is not configured - AI Insights will not be available')
}

export const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null

export const AI_MODEL = 'gpt-4o-mini'

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
}

export interface AIInsightsResponse {
  insights: AIInsight[]
}

const AI_INSIGHT_TYPES = new Set<AIInsight['type']>([
  'TASK_REMINDER',
  'WEATHER_ALERT',
  'CARE_SUGGESTION',
  'OPTIMIZATION',
  'RISK_WARNING',
  'SEASONAL_TIP'
])

const AI_URGENCY_LEVELS = new Set<AIInsight['urgency']>([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
])

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
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toValidInsightType(value: unknown): AIInsight['type'] | null {
  return typeof value === 'string' && AI_INSIGHT_TYPES.has(value as AIInsight['type'])
    ? value as AIInsight['type']
    : null
}

function toValidUrgency(value: unknown): AIInsight['urgency'] | null {
  return typeof value === 'string' && AI_URGENCY_LEVELS.has(value as AIInsight['urgency'])
    ? value as AIInsight['urgency']
    : null
}

function toTrimmedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed
}

function toBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function validateAIInsight(input: unknown): AIInsight | null {
  if (!isRecord(input)) return null

  const type = toValidInsightType(input.type)
  const urgency = toValidUrgency(input.urgency)
  const title = toTrimmedString(input.title, 120)
  const message = toTrimmedString(input.message, 1200)
  const reasoning = toTrimmedString(input.reasoning, 500)
  const actionRequired = toBoolean(input.actionRequired, false)

  if (!type || !urgency || !title || !message || !reasoning) return null

  return {
    type,
    title,
    message,
    urgency,
    actionRequired,
    reasoning
  }
}

function validateDashboardSummary(input: unknown): DashboardAIResponse['portfolioSummary'] | undefined {
  if (!isRecord(input)) return undefined

  const health = input.overallHealth
  if (health !== 'EXCELLENT' && health !== 'GOOD' && health !== 'FAIR' && health !== 'POOR') {
    return undefined
  }

  const urgentActions = typeof input.urgentActions === 'number' ? Math.max(0, Math.round(input.urgentActions)) : 0
  const opportunitiesCount = typeof input.opportunitiesCount === 'number' ? Math.max(0, Math.round(input.opportunitiesCount)) : 0

  return {
    overallHealth: health,
    urgentActions,
    opportunitiesCount
  }
}

function validateDashboardInsight(input: unknown): DashboardAIInsight | null {
  const base = validateAIInsight(input)
  if (!base || !isRecord(input)) return null

  const farmId = typeof input.farmId === 'string' && input.farmId.trim()
    ? input.farmId.trim()
    : null
  const farmName = typeof input.farmName === 'string' ? input.farmName.trim() : undefined

  return {
    ...base,
    farmId,
    farmName: farmName || undefined
  }
}

// Get current season in Greek
export function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'Άνοιξη'
  if (month >= 6 && month <= 8) return 'Καλοκαίρι'
  if (month >= 9 && month <= 11) return 'Φθινόπωρο'
  return 'Χειμώνας'
}

// Build the system prompt for the AI
export function buildSystemPrompt(context: FarmContext): string {
  return `Είσαι έμπειρος Έλληνας γεωπόνος εξειδικευμένος στην ελαιοκαλλιέργεια.
Αναλύεις τα δεδομένα του ελαιώνα και παρέχεις επαγγελματικές συμβουλές.

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
` : ''}
ΟΔΗΓΙΕΣ:
1. Δώσε 3-5 εξατομικευμένες συμβουλές βασισμένες ΑΠΟΚΛΕΙΣΤΙΚΑ στα παραπάνω δεδομένα
2. Λάβε υπόψη την τοποθεσία, την ποικιλία, και την ηλικία των δέντρων
3. Σχολίασε τις πρόσφατες δραστηριότητες - τι λείπει ή τι πρέπει να επαναληφθεί
4. Βασίσου στις καιρικές συνθήκες για συστάσεις άρδευσης και φυτοπροστασίας
5. Σύγκρινε με προηγούμενες συγκομιδές για βελτιστοποίηση απόδοσης
6. ΑΝ υπάρχουν δορυφορικά δεδομένα, αξιολόγησε την υγεία της βλάστησης (NDVI) και την υγρασία (NDMI) - προειδοποίησε για στρες ή πτωτικές τάσεις
7. Να είσαι συγκεκριμένος και πρακτικός - όχι γενικές συμβουλές

Απάντησε ΜΟΝΟ σε JSON format με την ακόλουθη δομή:
{
  "insights": [
    {
      "type": "TASK_REMINDER|WEATHER_ALERT|CARE_SUGGESTION|OPTIMIZATION|RISK_WARNING|SEASONAL_TIP",
      "title": "Σύντομος τίτλος στα Ελληνικά",
      "message": "Αναλυτική συμβουλή 2-3 προτάσεις στα Ελληνικά",
      "urgency": "LOW|MEDIUM|HIGH|CRITICAL",
      "actionRequired": true/false,
      "reasoning": "Γιατί δίνεις αυτή τη συμβουλή (1 πρόταση)"
    }
  ]
}`
}

// Generate insights using OpenAI
export async function generateInsights(context: FarmContext): Promise<AIInsightsResponse> {
  if (!openai) {
    throw new Error('OpenAI API key is not configured')
  }

  const systemPrompt = buildSystemPrompt(context)

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Ανάλυσε τα δεδομένα του ελαιώνα και δώσε τις συμβουλές σου.' }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2000
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  const parsed = JSON.parse(content) as unknown
  if (!isRecord(parsed) || !Array.isArray(parsed.insights)) {
    throw new Error('Invalid response structure from OpenAI')
  }

  const validatedInsights = parsed.insights
    .map(validateAIInsight)
    .filter((insight): insight is AIInsight => insight !== null)

  if (validatedInsights.length === 0) {
    throw new Error('No valid insights generated from OpenAI response')
  }

  return { insights: validatedInsights.slice(0, 8) }
}

// Build dashboard system prompt
export function buildDashboardPrompt(context: DashboardPortfolioContext): string {
  return `Είσαι έμπειρος Έλληνας γεωπόνος και αγροτικός σύμβουλος εξειδικευμένος στην ελαιοκαλλιέργεια.

Αναλύεις ΟΛΟ το χαρτοφυλάκιο ελαιώνων του ${context.userName} και παρέχεις στρατηγικές συμβουλές.

ΧΑΡΤΟΦΥΛΑΚΙΟ ΕΛΑΙΩΝΩΝ:
- Συνολικοί Ελαιώνες: ${context.totalFarms}
- Συνολικά Δέντρα: ${context.totalTrees}
- Συνολική Έκταση: ${context.totalArea.toFixed(1)} στρέμματα

ΛΕΠΤΟΜΕΡΕΙΕΣ ΕΛΑΙΩΝΩΝ:
${context.farms.map((farm, idx) => `
${idx + 1}. ${farm.name}
   - Τοποθεσία: ${farm.location}
   - Ποικιλία: ${farm.variety}
   - Δέντρα: ${farm.treeCount} (ηλικία: ${farm.treeAge ? `${farm.treeAge} έτη` : 'άγνωστη'})
   - Έκταση: ${farm.totalArea || 0} στρέμματα
   ${farm.satelliteHealth ? `- Υγεία (NDVI): ${farm.satelliteHealth.ndvi?.toFixed(3) || 'N/A'} (${farm.satelliteHealth.stressLevel || 'N/A'}) - Τάση: ${farm.satelliteHealth.trend || 'N/A'}` : ''}
   ${farm.lastHarvest ? `- Τελευταία Συγκομιδή: ${farm.lastHarvest.year} (${farm.lastHarvest.yieldPerTree?.toFixed(1) || 'N/A'} kg/δέντρο)` : ''}
   ${farm.harvestTrend ? `- Τάση Απόδοσης: ${farm.harvestTrend === 'improving' ? '⬆️ Βελτίωση' : farm.harvestTrend === 'declining' ? '⬇️ Πτώση' : '➡️ Σταθερή'}` : ''}
   - Πρόσφατες Δραστηριότητες: ${farm.recentActivities.length > 0 ? farm.recentActivities.slice(0, 3).map(a => `${a.type} (${a.date})`).join(', ') : 'Καμία'}
`).join('\n')}

ΤΡΕΧΟΥΣΑ ΠΕΡΙΟΔΟΣ:
- Μήνας: ${new Date().toLocaleDateString('el-GR', { month: 'long' })}
- Εποχή: ${context.currentSeason}

ΡΟΛΟΣ ΣΟΥ - Σκέψου σαν στρατηγικός αγροτικός σύμβουλος:

1. **Προτεραιοποίηση**: Ποιος ελαιώνας χρειάζεται ΑΜΕΣΗ προσοχή;
2. **Σύγκριση**: Ποιος ελαιώνας πηγαίνει καλύτερα; Γιατί?
3. **Μεταφορά Γνώσης**: Μπορούν οι πρακτικές από τον καλύτερο ελαιώνα να εφαρμοστούν αλλού?
4. **Βελτιστοποίηση Πόρων**: Πού να επενδύσει χρόνο/χρήμα για το μέγιστο όφελος?
5. **Διαχείριση Κινδύνου**: Υπάρχουν κοινοί κίνδυνοι σε πολλούς ελαιώνες?
6. **Στρατηγικός Προγραμματισμός**: Τι πρέπει να γίνει αυτό το μήνα σε ΟΛΟΥΣ τους ελαιώνες?

ΟΔΗΓΙΕΣ:
1. Δώσε 5-8 στρατηγικές συμβουλές που αφορούν το ΣΥΝΟΛΟ του χαρτοφυλακίου
2. Αναφέρου σε συγκεκριμένους ελαιώνες με το όνομά τους
3. Βάλε σε προτεραιότητα τις επείγουσες δράσεις (CRITICAL/HIGH urgency)
4. Σύγκρινε απόδοση μεταξύ ελαιώνων και πρότεινε βελτιώσεις
5. Για κάθε σύσταση, προσδιόρισε αν αφορά συγκεκριμένο ελαιώνα ή ΟΛΟΥΣ
6. Σκέψου την οικονομική απόδοση και τη βέλτιστη κατανομή πόρων

Απάντησε ΜΟΝΟ σε JSON format:
{
  "insights": [
    {
      "type": "TASK_REMINDER|WEATHER_ALERT|CARE_SUGGESTION|OPTIMIZATION|RISK_WARNING|SEASONAL_TIP",
      "title": "Σύντομος τίτλος",
      "message": "Αναλυτική στρατηγική σύσταση 2-4 προτάσεις",
      "urgency": "LOW|MEDIUM|HIGH|CRITICAL",
      "actionRequired": true/false,
      "reasoning": "Γιατί είναι σημαντικό αυτό στρατηγικά",
      "farmId": "farm-id ή null αν αφορά όλους",
      "farmName": "Όνομα ελαιώνα ή 'Όλοι οι ελαιώνες'"
    }
  ],
  "portfolioSummary": {
    "overallHealth": "EXCELLENT|GOOD|FAIR|POOR",
    "urgentActions": <αριθμός κρίσιμων δράσεων>,
    "opportunitiesCount": <αριθμός ευκαιριών βελτίωσης>
  }
}`
}

// Generate dashboard insights using OpenAI
export async function generateDashboardInsights(
  context: DashboardPortfolioContext
): Promise<DashboardAIResponse> {
  if (!openai) {
    throw new Error('OpenAI API key is not configured')
  }

  const systemPrompt = buildDashboardPrompt(context)

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: 'Ανάλυσε το χαρτοφυλάκιο ελαιώνων και δώσε τις στρατηγικές σου συμβουλές.'
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 3000
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  const parsed = JSON.parse(content) as unknown
  if (!isRecord(parsed) || !Array.isArray(parsed.insights)) {
    throw new Error('Invalid response structure from OpenAI')
  }

  const insights = parsed.insights
    .map(validateDashboardInsight)
    .filter((insight): insight is DashboardAIInsight => insight !== null)

  if (insights.length === 0) {
    throw new Error('No valid dashboard insights generated from OpenAI response')
  }

  return {
    insights: insights.slice(0, 10),
    portfolioSummary: validateDashboardSummary(parsed.portfolioSummary)
  }
}
