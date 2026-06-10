import { env } from '@/env'
import { reconcileFarmActivationForUser } from '@/lib/farm-activation'
import { prisma } from '@/lib/db'
import { normalizePlan } from '@/lib/plans'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'

// POST /api/stripe/webhook
// Stripe sends events here. We use it to keep Subscription records in sync.
export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET ?? ''
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Stripe webhook signature verification failed:', message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(sub)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(sub)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }
      default:
        // Unhandled event types are fine
        break
    }
  } catch (err) {
    console.error(`Error handling Stripe event ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// Since Stripe API 2025-03-31 (Basil) current_period_start/end live on the
// subscription item, not the subscription. Fall back to the legacy top-level
// fields for webhook endpoints pinned to older API versions.
function getBillingPeriod(stripeSubscription: Stripe.Subscription): {
  periodStart: Date | null
  periodEnd: Date | null
} {
  const item = stripeSubscription.items.data[0] as unknown as Record<string, number> | undefined
  const legacy = stripeSubscription as unknown as Record<string, number>
  const start = item?.['current_period_start'] ?? legacy['current_period_start']
  const end = item?.['current_period_end'] ?? legacy['current_period_end']
  return {
    periodStart: start ? new Date(start * 1000) : null,
    periodEnd: end ? new Date(end * 1000) : null,
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  if (!userId) return

  const stripeSubscriptionId = session.subscription as string
  const stripeCustomerId = session.customer as string
  const plan = normalizePlan(session.metadata?.plan)

  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
  const priceId = stripeSubscription.items.data[0]?.price.id ?? null
  const { periodStart, periodEnd } = getBillingPeriod(stripeSubscription)

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      status: 'ACTIVE',
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId: priceId,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
    update: {
      plan,
      status: 'ACTIVE',
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId: priceId,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  })

  await reconcileFarmActivationForUser(userId, plan)
}

async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  const stripeSubId = stripeSubscription.id

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubId },
  })
  if (!subscription) return

  // Derive plan from metadata (normalized for legacy tiers) or keep current
  const plan = stripeSubscription.metadata?.plan
    ? normalizePlan(stripeSubscription.metadata.plan)
    : subscription.plan

  const statusMap: Record<string, 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE'> = {
    active: 'ACTIVE',
    trialing: 'TRIALING',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'CANCELED',
    unpaid: 'PAST_DUE',
    paused: 'PAST_DUE',
  }

  const { periodStart, periodEnd } = getBillingPeriod(stripeSubscription)
  await prisma.subscription.update({
    where: { stripeSubscriptionId: stripeSubId },
    data: {
      plan,
      status: statusMap[stripeSubscription.status] ?? 'ACTIVE',
      currentPeriodStart: periodStart ?? undefined,
      currentPeriodEnd: periodEnd ?? undefined,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      stripePriceId: stripeSubscription.items.data[0]?.price.id ?? null,
    },
  })

  await reconcileFarmActivationForUser(subscription.userId, plan)
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
    select: { userId: true },
  })

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: stripeSubscription.id },
    data: {
      plan: 'FREE',
      status: 'CANCELED',
      stripeSubscriptionId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
    },
  })

  if (subscription) {
    await reconcileFarmActivationForUser(subscription.userId, 'FREE')
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Since Stripe API 2025-03-31 (Basil) the subscription reference lives at
  // invoice.parent.subscription_details.subscription; keep the legacy
  // top-level invoice.subscription as a fallback for older API versions.
  const subRef =
    invoice.parent?.subscription_details?.subscription ??
    (invoice as unknown as { subscription?: string | Stripe.Subscription }).subscription ??
    null
  const stripeSubId = typeof subRef === 'string' ? subRef : subRef?.id ?? null
  if (!stripeSubId) return

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: stripeSubId },
    data: { status: 'PAST_DUE' },
  })
}
