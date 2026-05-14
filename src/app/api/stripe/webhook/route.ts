import { env } from '@/env'
import { prisma } from '@/lib/db'
import type { Plan } from '@/lib/plans'
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  if (!userId) return

  const stripeSubscriptionId = session.subscription as string
  const stripeCustomerId = session.customer as string
  const plan = (session.metadata?.plan ?? 'FREE') as Plan

  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
  const priceId = stripeSubscription.items.data[0]?.price.id ?? null
  // Billing period fields may be absent in newer Stripe API versions
  const sub = stripeSubscription as unknown as Record<string, number>
  const periodStart = sub['current_period_start'] ? new Date(sub['current_period_start'] * 1000) : null
  const periodEnd = sub['current_period_end'] ? new Date(sub['current_period_end'] * 1000) : null

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
}

async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  const stripeSubId = stripeSubscription.id

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubId },
  })
  if (!subscription) return

  // Derive plan from metadata or price ID
  const plan = (stripeSubscription.metadata?.plan as Plan | undefined) ?? subscription.plan

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

  const updSub = stripeSubscription as unknown as Record<string, number>
  await prisma.subscription.update({
    where: { stripeSubscriptionId: stripeSubId },
    data: {
      plan,
      status: statusMap[stripeSubscription.status] ?? 'ACTIVE',
      currentPeriodStart: updSub['current_period_start'] ? new Date(updSub['current_period_start'] * 1000) : undefined,
      currentPeriodEnd: updSub['current_period_end'] ? new Date(updSub['current_period_end'] * 1000) : undefined,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      stripePriceId: stripeSubscription.items.data[0]?.price.id ?? null,
    },
  })
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
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
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const stripeSubId = (invoice as unknown as { subscription?: string }).subscription ?? null
  if (!stripeSubId) return

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: stripeSubId },
    data: { status: 'PAST_DUE' },
  })
}
