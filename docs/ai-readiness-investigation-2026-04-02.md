# AI Readiness Investigation (Expert Review) — April 2, 2026

## Executive summary

**Overall AI readiness: 6.3 / 10 (Promising, but not yet scale-ready for paid AI SLAs).**

Your app already has real AI value delivery (farm-level and portfolio-level advisory), clear auth checks, and practical domain prompts in Greek. However, for commercialization at scale, there are gaps in **schema enforcement, guardrails, observability, and evaluation discipline**.

## Scope reviewed

- Core AI orchestration and prompts: `src/lib/openai.ts`
- Farm-level insight generation API: `src/app/api/insights/generate/route.ts`
- Portfolio/dashboard insight generation API: `src/app/api/insights/dashboard/route.ts`
- Insight lifecycle APIs (update/delete): `src/app/api/insights/item/[insightId]/route.ts`
- AI UX surfaces: `src/components/farms/AIGeoponosTab.tsx`, `src/components/dashboard/DashboardAIGeoponos.tsx`

## Readiness scorecard

| Dimension | Score | Why it matters | What I observed |
|---|---:|---|---|
| Product value & domain fit | **8/10** | Determines willingness to pay | Prompts are domain-specific, localized in Greek, and include weather/harvest/satellite context. |
| Security & tenant isolation | **7/10** | Prevents data leakage between farms/users | Auth + ownership checks are generally good in insight APIs. |
| Output reliability (structured generation) | **5/10** | Drives trust and automation safety | JSON mode is used, but strict schema validation is not enforced end-to-end. |
| Safety & agronomic risk controls | **5/10** | Reduces harmful recommendations | No confidence score, no explicit “consult agronomist” safety thresholds, no hard failsafe for uncertain data. |
| Observability & operations | **4/10** | Needed for paid uptime/quality commitments | Logs exist, but no request-level AI metrics, cost tracking, prompt/version telemetry, or eval dashboards. |
| Testing & evaluation | **4/10** | Prevents model regressions over time | Limited automated AI-specific tests/evals; mostly runtime checks. |
| Cost & performance control | **6/10** | Critical as usage scales | Model is reasonably cost-efficient (`gpt-4o-mini`), but no explicit token budget control policy per user/tenant. |

## Strengths (what is already good)

1. **Strong localized prompting and relevant agronomic context**.
   - Farm prompts include activities, weather, harvest history, season, and optional satellite indices, which is exactly the right context packaging strategy for useful recommendations.
2. **Multi-level advisory architecture**.
   - You support both per-farm insights and portfolio-level strategic insights, which is a strong product differentiator for paid tiers.
3. **Authentication and ownership checks in insight mutation routes**.
   - Insight update/delete routes verify user ownership via farm relation before mutation.
4. **Graceful service-degraded responses**.
   - API returns `503`-style behavior when OpenAI fails, which is preferable to silent null behavior.

## Key gaps and risks

### P0 — Must fix before heavy commercialization

1. **No strict runtime schema validation for AI outputs**
   - Current flow parses JSON and checks only minimal structure (`insights` array present), but does not strictly validate enums, lengths, required fields, or portfolio summary integrity.
   - Risk: malformed or semantically invalid AI payloads can leak to UI/database.

2. **No AI guardrail policy for high-risk advice**
   - The app can generate actionable farming recommendations without confidence/risk gates.
   - Risk: overconfident or context-incomplete recommendations may create agronomic/business harm.

3. **No model/versioned prompt telemetry persisted**
   - Generated insights are saved, but prompt/model/version metadata isn’t captured for reproducibility and audit.
   - Risk: impossible to root-cause quality regressions after prompt/model changes.

### P1 — High priority for sustainable paid growth

4. **No evaluation harness (golden set + regression checks)**
   - There is no offline eval suite to detect quality drift (e.g., hallucination, unsafe advice, weak prioritization).

5. **No cost governance policy**
   - No explicit per-user/per-day request budgets, concurrency guardrails, or proactive rate limiting for AI generation endpoints.

6. **No confidence/uncertainty UX**
   - Insights are presented as recommendations but without confidence labels, “data freshness” emphasis, or uncertainty hints.

### P2 — Next wave maturity

7. **Typing debt in dashboard AI route (`any`)**
   - This weakens compile-time guarantees around AI payload handling.

8. **No explicit model fallback strategy**
   - If provider/model fails or response quality drops, there is no fallback chain and no quality-based rerun policy.

## Concrete implementation plan

## Phase A (1–2 weeks): Reliability + Safety baseline

1. Add strict runtime validation for AI responses (e.g., Zod schemas) in both farm and dashboard generation paths.
2. Reject invalid enum values, missing fields, overlong text, and unknown keys.
3. Add a lightweight safety layer:
   - If data is sparse/stale, downgrade urgency and append cautionary text.
   - Block CRITICAL recommendations unless evidence thresholds are met.
4. Store metadata with each generated recommendation:
   - `model`, `promptVersion`, `generatedAt`, `tokenUsage`, `latencyMs`, `requestId`.

## Phase B (2–4 weeks): Evaluation + Operations

5. Build a golden evaluation set (20–50 representative farm scenarios) and run it in CI on prompt/model changes.
6. Add observability dashboards for:
   - generation success rate
   - p50/p95 latency
   - average tokens/cost per generation
   - invalid-response rate
   - user action rate on recommendations
7. Add throttling and budgeting:
   - per-user daily generation caps
   - optional paid-tier quotas

## Phase C (4–8 weeks): Product trust layer

8. Add confidence bands and evidence chips in UI:
   - Example: “Based on weather(30d), harvest(3y), satellite(last 5d)”.
9. Add “why this matters” + “what data was missing” sections on each recommendation.
10. Add an explicit agronomic safety disclaimer and escalation UX for critical disease/pest suggestions.

## Suggested KPIs for commercialization

- **Actionability rate**: % insights marked actioned within 7 days
- **Dismissal rate**: % insights deleted/ignored
- **Safety override rate**: % recommendations downgraded by guardrails
- **Invalid schema rate**: % AI responses rejected by validator
- **Cost per active farm per month**
- **Time-to-value**: minutes from generate click to first accepted action

## Immediate next 5 tasks (highest ROI)

1. Implement strict `AIInsight`/`DashboardAIInsight` runtime schemas and safe parsing.
2. Add prompt version constants and persist them with every generated recommendation.
3. Add request-level structured logs for AI latency + token usage + failure reason.
4. Add per-user throttle for `/api/insights/generate` and `/api/insights/dashboard`.
5. Add UI confidence + data-freshness badge in AI recommendation cards.

## Bottom line

You have a solid AI product foundation and strong domain fit. To be **commercially robust**, focus next on **strict output contracts, safety guardrails, eval discipline, and AI observability**. Once these are in place, you can confidently scale usage and paid plans.

## Progress update (implemented after this audit)

- Added strict runtime validation and sanitization for AI JSON outputs in `src/lib/openai.ts`:
  - enum validation for `type`/`urgency`
  - required trimmed string checks with length limits
  - boolean normalization
  - filtered/limited valid insight count for farm and dashboard generations
- Added dashboard portfolio summary validation with safe numeric normalization.
- Updated `src/app/api/insights/dashboard/route.ts` to consume typed `DashboardAIInsight` objects instead of `any` for AI mapping and persistence.
