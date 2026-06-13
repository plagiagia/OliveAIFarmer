# Going live with Stripe — simple checklist

> Goal: accept **real payments** from customers.
> Status of the code: **done.** Nothing to program. This is all clicking around in
> Stripe + Vercel. Follow top to bottom.
>
> Your situation: solo founder in **Berlin, Germany**. Activating Stripe as an
> **individual** (no company yet). You'll register a Gewerbe / company later *if*
> the product makes money.
>
> ⚠️ This is a technical checklist, **not tax advice.** For German tax questions
> (Kleinunternehmer §19, VAT, when to register a Gewerbe), ask a Steuerberater.

---

## The big picture (how money flows)

```
Customer clicks "Upgrade"
   → Stripe Checkout page  → customer pays with real card
       → Stripe sends a "webhook" event to our app
           → app writes the new plan (GROWER) into the database
               → customer now has the paid plan
```

If the **webhook** part is misconfigured, the customer pays but the app never
upgrades them. So the webhook is the piece to get right.

---

## What's already built (no action needed)

- Checkout, Customer Portal, webhook handler — all coded and tested.
- Security: webhook signature verification, open-redirect protection.
- Two plans: **FREE** and **GROWER** (paid). Annual €49/yr is the default,
  monthly €6/mo is the fallback.

You only need to **configure** the live keys. That's it.

---

## STEP 1 — Activate the Stripe account ⛔ (blocker)

Until this is done, real payments will fail.

1. Go to https://dashboard.stripe.com/account/onboarding
   (or click the "Activate / Complete your profile" banner).
2. **Business type → Individual** (Einzelperson).
3. Fill in:
   - Full legal name + Berlin address
   - Date of birth
   - **Tax ID** → your personal **Steuer-ID** (11-digit IdNr)
   - **German IBAN** in your name (this is where payouts land)
   - ID document if asked (Personalausweis / passport)
4. Submit and wait for Stripe to show **"Payments enabled."**

✅ **Done when:** dashboard says payments are enabled / account is activated.

---

## STEP 2 — Confirm the LIVE price IDs

> ⚠️ Most common mistake: creating prices in **Test mode** by accident.
> The toggle is **top-left of the Stripe dashboard. Make sure "Test mode" is OFF.**

1. Stripe dashboard, **Test mode OFF**.
2. Go to **Product catalog** → open the **GROWER** product.
3. Copy the two price IDs (they look like `price_1Q...`):
   - **Annual** (€49/yr, recurring yearly) → save as `STRIPE_PRICE_GROWER_ANNUAL`
   - **Monthly** (€6/mo, recurring monthly) → save as `STRIPE_PRICE_GROWER`

✅ **Done when:** you have both live `price_...` IDs written down.

---

## STEP 3 — Get the live secret key + create the webhook

Still in Stripe, **Test mode OFF**.

### 3a. Secret key
1. Go to https://dashboard.stripe.com/apikeys
2. Copy the **live** secret key → starts with `sk_live_...`
   → save as `STRIPE_SECRET_KEY`

### 3b. Webhook
1. Developers → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://www.oliveiq.gr/api/stripe/webhook`
   (canonical live domain — www is the one with a valid cert; the bare apex
   oliveiq.gr is not fully serving, so always use the www host)
3. Select **exactly these 4 events**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Create the endpoint, then click **"Reveal" / "Signing secret"** and copy it
   → starts with `whsec_...` → save as `STRIPE_WEBHOOK_SECRET`

✅ **Done when:** you have `sk_live_...` and `whsec_...` written down.

---

## STEP 4 — Put the live keys into Vercel (Production only)

> 🔒 **Never** put `sk_live_` keys into any file in this repo. They go **only**
> into Vercel's settings. Keep your **test** keys on Preview/Development so
> preview deploys never charge real money.

1. Vercel → your project → **Settings → Environment Variables**.
2. Add these **4 variables**, scope = **Production**:

   | Variable | Value |
   |---|---|
   | `STRIPE_SECRET_KEY` | `sk_live_...` (Step 3a) |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_...` (Step 3b) |
   | `STRIPE_PRICE_GROWER` | live monthly price ID (Step 2) |
   | `STRIPE_PRICE_GROWER_ANNUAL` | live annual price ID (Step 2) |
   | `NEXT_PUBLIC_APP_URL` | `https://www.oliveiq.gr` (no trailing slash; checkout redirect fallback) |

✅ **Done when:** all 4 are saved under the Production environment.

---

## STEP 5 — Enable the Customer Portal (live mode)

This powers the "Manage subscription" button (cancel / update card).

1. Stripe, **Test mode OFF**.
2. Go to https://dashboard.stripe.com/settings/billing/portal
3. Activate / save the portal settings.

✅ **Done when:** the live Customer Portal is active.

---

## STEP 6 — Redeploy and do one real test

1. **Redeploy** the Production site (env var changes only apply after a fresh deploy).
2. On the **live** site, log in and subscribe to GROWER **with a real card**.
3. Check all three:
   - [ ] Your plan flips to **GROWER** in the app
   - [ ] Stripe → Developers → Webhooks shows a **`200`** delivery (not red/4xx)
   - [ ] A row appears in the `subscriptions` table in the database
4. **Refund** that charge in the Stripe dashboard (Payments → the charge → Refund).

✅ **Done when:** real payment upgraded the account and you refunded it.

🎉 You are live.

---

## If something breaks

| What you see | Most likely cause | Fix |
|---|---|---|
| "Stripe not configured" at checkout | `STRIPE_SECRET_KEY` missing/placeholder on Vercel | Re-check Step 4, redeploy |
| Customer paid but plan stays FREE | Webhook not delivering | Step 3b — check the 4 events + signing secret matches Step 4 |
| Webhook shows `400 Invalid signature` | `STRIPE_WEBHOOK_SECRET` doesn't match the live endpoint | Copy the secret from the live webhook again, redeploy |
| "Manage subscription" button errors | Customer Portal not enabled in **live** mode | Step 5 |
| Prices don't load / checkout 503 | Price IDs are from **Test mode**, not live | Step 2 — re-copy with Test mode OFF |

Check **Vercel → your project → Logs** and search for `[stripe/checkout]` or webhook errors.

---

## Later (only once revenue proves the idea)

- **Register a Gewerbe** with the Berlin Gewerbeamt (~€26, online).
- Stay under €25,000/yr → **Kleinunternehmer (§19 UStG)**: no VAT, minimal admin.
- When you grow / sell across the EU → turn on **Stripe Tax** for VAT, and
  consider a GmbH. Stripe lets you switch the account from individual to company
  without starting over.
- Talk to a **Steuerberater** before any of this.

---

## Quick reference — the 4 env vars

```
STRIPE_SECRET_KEY=sk_live_...            # live secret key (Step 3a)
STRIPE_WEBHOOK_SECRET=whsec_...          # live webhook signing secret (Step 3b)
STRIPE_PRICE_GROWER=price_...            # live MONTHLY price (Step 2)
STRIPE_PRICE_GROWER_ANNUAL=price_...     # live ANNUAL price (Step 2)
```

Full technical detail: see [STRIPE.md](STRIPE.md).
