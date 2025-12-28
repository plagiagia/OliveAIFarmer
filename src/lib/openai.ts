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

ΟΔΗΓΙΕΣ:
1. Δώσε 3-5 εξατομικευμένες συμβουλές βασισμένες ΑΠΟΚΛΕΙΣΤΙΚΑ στα παραπάνω δεδομένα
2. Λάβε υπόψη την τοποθεσία, την ποικιλία, και την ηλικία των δέντρων
3. Σχολίασε τις πρόσφατες δραστηριότητες - τι λείπει ή τι πρέπει να επαναληφθεί
4. Βασίσου στις καιρικές συνθήκες για συστάσεις άρδευσης και φυτοπροστασίας
5. Σύγκρινε με προηγούμενες συγκομιδές για βελτιστοποίηση απόδοσης
6. Να είσαι συγκεκριμένος και πρακτικός - όχι γενικές συμβουλές

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

  const parsed = JSON.parse(content) as AIInsightsResponse

  // Validate the response structure
  if (!parsed.insights || !Array.isArray(parsed.insights)) {
    throw new Error('Invalid response structure from OpenAI')
  }

  return parsed
}
