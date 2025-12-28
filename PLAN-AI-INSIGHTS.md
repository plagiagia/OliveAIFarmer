# AI Insights Feature Plan

## Overview
Add an "AI Insights" tab (Προτάσεις AI) to each grove that provides intelligent recommendations based on farm data, weather, activities, and harvests.

---

## 1. OpenAI Model Selection

### Recommended: GPT-4o-mini
| Model | Cost (Input/Output per 1M tokens) | Speed | Quality | Recommendation |
|-------|-----------------------------------|-------|---------|----------------|
| **gpt-4o-mini** | $0.15 / $0.60 | Fast | Good | ✅ **Best for this use case** |
| gpt-4o | $2.50 / $10.00 | Medium | Excellent | Overkill for recommendations |
| gpt-3.5-turbo | $0.50 / $1.50 | Fast | Adequate | Legacy, no benefit over 4o-mini |

**Why gpt-4o-mini?**
- 128K context window (plenty for farm data)
- Excellent structured output support (JSON mode)
- Very cost-effective (~$0.001 per insight generation)
- Fast response times (~1-2 seconds)
- Good reasoning for agricultural recommendations

### Alternative: Claude 3.5 Haiku (via Anthropic)
- Similar pricing, excellent structured output
- Consider if you prefer Anthropic's approach

---

## 2. Vercel Setup

### Environment Variables to Add
```bash
# In Vercel Dashboard → Settings → Environment Variables
OPENAI_API_KEY=sk-proj-...

# Optional: Feature flag
AI_INSIGHTS_ENABLED=true
```

### API Route Structure
```
/api/insights/
├── generate/route.ts    # Generate new insights (POST)
├── [farmId]/route.ts    # Get saved insights for farm (GET)
└── [insightId]/
    └── route.ts         # Mark as read/actioned (PATCH)
```

---

## 3. Database Schema (Already Exists!)

Your `SmartRecommendation` model is perfect:

```prisma
model SmartRecommendation {
  id               String    @id @default(cuid())
  type             RecommendationType  # TASK_REMINDER, WEATHER_ALERT, etc.
  title            String
  message          String
  actionRequired   Boolean   @default(false)
  urgency          Priority  @default(MEDIUM)

  triggerConditions Json?    # Store AI reasoning/context
  validFrom        DateTime  @default(now())
  validUntil       DateTime?

  farmId           String?
  farm             Farm?     @relation(...)

  weatherBased     Boolean   @default(false)
  seasonBased      Boolean   @default(false)

  isRead           Boolean   @default(false)
  isActioned       Boolean   @default(false)
  readAt           DateTime?
  actionedAt       DateTime?

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}
```

### Suggested Schema Addition
Add a field to track AI-generated vs rule-based:
```prisma
// Add to SmartRecommendation model
source           InsightSource  @default(RULE_BASED)

enum InsightSource {
  RULE_BASED      // From existing logic
  AI_GENERATED    // From OpenAI
  WEATHER_ALERT   // From weather conditions
  USER_CREATED    // Manual user notes
}
```

---

## 4. API Call Strategy (Avoiding Constant Calls)

### On-Demand Generation with Caching
```
User clicks "Generate Insights" button
         ↓
Check if recent insights exist (< 24 hours)
         ↓
   ┌─────┴─────┐
   │           │
 Yes          No
   │           │
Return        Call OpenAI API
cached        Generate new insights
insights      Save to SmartRecommendation
              Return new insights
```

### Key Principles:
1. **Never auto-call on page load** - Only when user clicks button
2. **Cache in database** - SmartRecommendation table stores results
3. **Show cached first** - Display existing insights, offer "refresh"
4. **Rate limit** - Max 1 generation per farm per 6 hours
5. **Batch context** - Send all relevant data in one API call

---

## 5. Data Context for AI

### What to Send to OpenAI:
```typescript
interface FarmContext {
  // Farm basics
  name: string;
  location: string;
  totalArea: number;        // stremmata
  treeAge: number;
  variety: string;
  treeCount: number;

  // Recent activities (last 30 days)
  recentActivities: {
    type: string;
    date: string;
    notes?: string;
  }[];

  // Harvest history (last 3 years)
  harvests: {
    year: number;
    totalYield: number;
    yieldPerTree: number;
    pricePerKg?: number;
  }[];

  // Weather summary (last 7 days)
  weather: {
    avgTemp: number;
    totalRainfall: number;
    avgHumidity: number;
  };

  // Current date/season
  currentMonth: number;
  season: string;
}
```

### System Prompt Structure:
```typescript
const systemPrompt = `You are an expert olive farming advisor in Greece.
Analyze the farm data and provide 3-5 actionable recommendations.

Consider:
- Current season and weather conditions
- Recent activity patterns
- Historical yield data
- Olive variety requirements
- Regional best practices for ${location}

Return JSON array with structure:
{
  "insights": [
    {
      "type": "TASK_REMINDER|WEATHER_ALERT|CARE_SUGGESTION|OPTIMIZATION|RISK_WARNING",
      "title": "Brief title in Greek",
      "message": "Detailed recommendation in Greek (2-3 sentences)",
      "urgency": "LOW|MEDIUM|HIGH|CRITICAL",
      "actionRequired": boolean,
      "reasoning": "Brief explanation of why this recommendation"
    }
  ]
}`;
```

---

## 6. UI Design

### New Tab Addition
```typescript
const tabs = [
  { id: 'overview', label: 'Επισκόπηση', icon: BarChart3 },
  { id: 'activities', label: 'Δραστηριότητες', icon: Activity },
  { id: 'harvests', label: 'Συγκομιδές', icon: Wheat },
  { id: 'insights', label: 'AI Insights', icon: Sparkles },  // NEW
]
```

### AI Insights Tab Layout:
```
┌─────────────────────────────────────────────────────────┐
│  🤖 AI Insights                    [🔄 Generate New]   │
├─────────────────────────────────────────────────────────┤
│  Last updated: 2 hours ago                              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 🔴 HIGH PRIORITY                                  │   │
│  │ Κίνδυνος Ξηρασίας                                │   │
│  │ Δεν έχει βρέξει εδώ και 15 ημέρες. Συνιστάται    │   │
│  │ άμεση άρδευση ειδικά για τα νεαρά δέντρα.        │   │
│  │                                    [Mark as Done] │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 🟡 MEDIUM                                         │   │
│  │ Προετοιμασία Συγκομιδής                          │   │
│  │ Με βάση τα δεδομένα παρελθόντων ετών, η συγκομιδή│   │
│  │ πρέπει να ξεκινήσει σε ~3 εβδομάδες.             │   │
│  │                                    [Mark as Done] │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 🟢 TIP                                            │   │
│  │ Βελτιστοποίηση Απόδοσης                          │   │
│  │ Η περσινή απόδοση (45kg/δέντρο) είναι 10% κάτω   │   │
│  │ από τον μέσο όρο. Σκεφτείτε επιπλέον λίπανση.    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Implementation Steps

### Phase 1: Backend Setup
1. [ ] Add `OPENAI_API_KEY` to Vercel environment
2. [ ] Install `openai` npm package
3. [ ] Create `/lib/openai.ts` - OpenAI client configuration
4. [ ] Add `source` field to SmartRecommendation schema
5. [ ] Run Prisma migration

### Phase 2: API Routes
6. [ ] Create `POST /api/insights/generate` - Generate insights
7. [ ] Create `GET /api/insights/[farmId]` - Get farm insights
8. [ ] Create `PATCH /api/insights/[insightId]` - Update insight status

### Phase 3: Frontend
9. [ ] Create `AIInsightsTab.tsx` component
10. [ ] Add "AI Insights" tab to FarmDetailContent
11. [ ] Create `InsightCard.tsx` component
12. [ ] Add loading/error states
13. [ ] Add "Generate" button with rate limit feedback

### Phase 4: Polish
14. [ ] Add insight notification badge on tab
15. [ ] Test with various farm data scenarios
16. [ ] Add error handling for API failures
17. [ ] Add usage tracking/analytics

---

## 8. Cost Estimation

### Per Insight Generation:
- Input: ~1,500 tokens (farm context)
- Output: ~500 tokens (5 insights)
- **Cost per call: ~$0.0005** (half a cent)

### Monthly Estimate:
| Usage | Calls/Month | Monthly Cost |
|-------|-------------|--------------|
| Light (10 farms, weekly) | 40 | ~$0.02 |
| Medium (50 farms, 2x/week) | 400 | ~$0.20 |
| Heavy (200 farms, daily) | 6,000 | ~$3.00 |

**Very affordable!** Even heavy usage is under $5/month.

---

## 9. Security Considerations

1. **API Key Protection**: Only server-side, never exposed to client
2. **Rate Limiting**: Max 1 generation per farm per 6 hours
3. **Input Validation**: Sanitize all farm data before sending to OpenAI
4. **Output Validation**: Verify JSON structure before saving
5. **User Authorization**: Verify farm ownership before generating

---

## 10. Future Enhancements

- **Scheduled Insights**: Weekly cron job to generate for all active farms
- **Push Notifications**: Alert users to critical insights
- **Insight History**: Track which recommendations helped yields
- **Custom Questions**: Let users ask specific questions about their farm
- **Photo Analysis**: Use GPT-4o vision for tree health assessment
- **Comparison Insights**: Compare farm performance to regional averages

---

## Questions to Discuss

1. **Language**: Should insights be in Greek only, or bilingual?
2. **Frequency**: How often should users be able to regenerate? (suggested: 6 hours)
3. **Insight Count**: How many insights per generation? (suggested: 3-5)
4. **Expiration**: How long should insights remain valid? (suggested: 7 days)
5. **Notification**: Should unread insights show a badge?

---

## Ready to Implement?

This plan uses:
- ✅ Your existing SmartRecommendation database model
- ✅ Your existing API patterns
- ✅ Your existing tab component structure
- ✅ Cost-effective GPT-4o-mini model
- ✅ On-demand generation (no constant API calls)
- ✅ Persistent storage for insights
