# Stripe billing — architecture & setup

OliveLog uses **Stripe Checkout** for subscriptions. Stripe holds payment state; **Neon Postgres** (`subscriptions` table) is the app’s source of truth for plan gating. **Clerk** handles auth only — it does not know about billing.

## How the services connect

```
User (browser)
    │
    ├─ Clerk ──────────────► session (clerkId)
    │
    ├─ POST /api/stripe/checkout ──► Stripe Checkout Session
    │                                      │
    │                                      ▼
    │                               User pays on Stripe
    │                                      │
    │                                      ▼
    └─ GET /api/subscription ◄── Neon ◄── POST /api/stripe/webhook ◄── Stripe events
         (reads plan)              (writes Subscription)
```

| Service | Role |
|---------|------|
| **Clerk** | Authenticates users; `User.clerkId` links to Neon `users` |
| **Stripe** | Checkout, subscriptions, Customer Portal, webhook events |
| **Neon** | `subscriptions` row per user — plan, status, Stripe IDs |
| **Vercel** | Runs Next.js API routes; webhook handler writes to Neon via Prisma |

Stripe never talks to Neon directly. Vercel is the hub.

## Code map

| File | Purpose |
|------|---------|
| `src/lib/stripe.ts` | Stripe SDK singleton, `STRIPE_PRICE_IDS`, `isStripeSecretKeyConfigured()` |
| `src/lib/subscription.ts` | `getUserPlanByClerkId()` — server plan lookup (falls back to FREE) |
| `src/lib/plans.ts` | Plan tiers, feature flags, limits (single source of truth) |
| `src/lib/farm-activation.ts` | Deactivates excess farms after downgrade |
| `src/app/api/stripe/checkout/route.ts` | Creates Checkout Session (`metadata`: `userId`, `clerkId`, `plan`) |
| `src/app/api/stripe/portal/route.ts` | Opens Stripe Customer Portal |
| `src/app/api/stripe/webhook/route.ts` | Syncs Stripe events → `Subscription` in Neon |
| `src/app/api/subscription/route.ts` | GET current plan for `usePlan()` hook |
| `src/hooks/usePlan.ts` | Client: `can()`, `upgrade()`, `manageSubscription()` |
| `src/components/settings/SubscriptionSection.tsx` | Settings UI for plan / billing |
| `src/env.ts` | Validates `STRIPE_*` env vars |
| `prisma/schema.prisma` | `Subscription` model on `User` |

## Subscription flow

1. User clicks upgrade → `usePlan().upgrade(plan)` → `POST /api/stripe/checkout`
2. Checkout loads `User` from Neon by Clerk ID, creates Stripe Checkout Session with price from `STRIPE_PRICE_*`
3. User completes payment on Stripe-hosted page
4. Stripe sends webhook(s) to `/api/stripe/webhook`
5. Handler upserts `subscriptions` and calls `reconcileFarmActivationForUser()`
6. UI reads plan via `GET /api/subscription`

**Without webhooks**, checkout succeeds on Stripe but the app stays on `FREE`.

## Webhook events handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Upsert `Subscription` (plan, Stripe IDs, billing period) |
| `customer.subscription.updated` | Sync plan/status/period |
| `customer.subscription.deleted` | Downgrade to `FREE`, status `CANCELED` |
| `invoice.payment_failed` | Set status `PAST_DUE` |

The webhook route is **not** protected by Clerk. Security is Stripe signature verification via `STRIPE_WEBHOOK_SECRET`.

## Environment variables

| Variable | Sandbox (test) | Production (live) |
|----------|----------------|-------------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Per endpoint / CLI session | Per live webhook endpoint |
| `STRIPE_PRICE_GROWER` | Test price ID (Pro monthly, €6/mo) | Live price ID |
| `STRIPE_PRICE_GROWER_ANNUAL` | Test price ID (Pro annual, €49/yr — promoted default) | Live price ID |

Copy from `.env.example`. **Do not use placeholder values** like `sk_test_...` or `whsec_...` — `isStripeSecretKeyConfigured()` rejects keys containing `...`.

Test and live Stripe data are fully separate: never mix test keys with live price IDs.

## Local development (Stripe CLI)

### Install Stripe CLI (Windows)

If not installed via Scoop/winget, the CLI lives at:

```
%LOCALAPPDATA%\StripeCLI\stripe.exe
```

Download latest from [stripe/stripe-cli releases](https://github.com/stripe/stripe-cli/releases/latest) or:

```powershell
# One-time install (PowerShell)
$installDir = Join-Path $env:LOCALAPPDATA "StripeCLI"
# ... download stripe_*_windows_x86_64.zip, extract to $installDir, add to user PATH
```

### Login (once per machine)

```powershell
stripe login
```

Press Enter to authenticate in the browser.

### Run webhook forwarding

**Terminal 1** — dev server:

```powershell
npm run dev
```

**Terminal 2** — forward Stripe events to local webhook:

```powershell
npm run stripe:listen
# or: stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_...` signing secret from the `Ready!` line into `.env.local`:

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

Also set a real `STRIPE_SECRET_KEY=sk_test_...` from [Stripe Dashboard → API keys (test mode)](https://dashboard.stripe.com/test/apikeys).

**Restart `npm run dev`** after changing `.env.local`.

> **Important:** Each new `stripe listen` session may emit a **new** `whsec_...`. Update `.env.local` and restart the dev server when you restart the listener.

### Test payment

- Card: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any 3 digits

After redirect, plan should show GROWER (Pro). Check Terminal 2 for webhook delivery (`200` = success).

### Enable Customer Portal (Dashboard)

Settings → Billing → [Customer portal](https://dashboard.stripe.com/test/settings/billing/portal) — required for “Manage subscription” in Settings.

## Vercel (preview / staging)

For deployed test-mode billing (not localhost):

1. Stripe Dashboard (test mode) → Developers → Webhooks → **Add endpoint**
2. URL: `https://YOUR-VERCEL-URL/api/stripe/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy signing secret → Vercel env (`STRIPE_WEBHOOK_SECRET`) for Preview (or Development)
5. Set `STRIPE_SECRET_KEY` (test) and `STRIPE_PRICE_*` (test) on the same Vercel environment
6. Redeploy

Use **Preview** env for test keys; reserve **Production** env for live keys only.

## Production cutover

1. Complete Stripe account activation (business details, bank account)
2. Create **live** products/prices (mirror test catalog)
3. Add **live** webhook: `https://yourdomain.com/api/stripe/webhook` with the four events above
4. Vercel **Production** env: `sk_live_...`, live `whsec_...`, live `STRIPE_PRICE_*`
5. Enable Customer Portal in **live** mode
6. Run one real payment test, then refund in Dashboard
7. See [Stripe go-live checklist](https://docs.stripe.com/get-started/checklist/go-live)

Keep test keys on Preview/Development so preview deploys never hit live Stripe.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| “Stripe not configured” on checkout | Placeholder or invalid `STRIPE_SECRET_KEY` in `.env.local` |
| Payment succeeds, plan stays FREE | Webhook not running (`stripe listen`) or wrong `STRIPE_WEBHOOK_SECRET` |
| Webhook `400 Invalid signature` | Mismatch between listener secret and `.env.local`; restart dev server after fix |
| Portal button fails | Customer Portal not enabled in Stripe Dashboard, or no `stripeCustomerId` yet |
| Works locally, fails on Vercel | Missing env vars on Vercel or webhook endpoint not configured for deploy URL |

Check Vercel function logs for `[stripe/checkout]` or webhook handler errors.

## Plans reference

Defined in `src/lib/plans.ts`. Two tiers: **FREE** and **GROWER** (Pro). Checkout accepts `{ plan: 'GROWER', interval: 'year' | 'month' }`; annual is the promoted default. Legacy PRODUCER/MILL subscription metadata normalizes to GROWER via `normalizePlan()`.

Stripe price IDs map via `STRIPE_PRICE_IDS` in `src/lib/stripe.ts`.
