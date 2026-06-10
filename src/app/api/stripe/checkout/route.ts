import { prisma } from '@/lib/db'
import type { BillingInterval, Plan } from '@/lib/plans'
import { getGrowerPriceId, isStripeSecretKeyConfigured, stripe } from '@/lib/stripe'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const STRIPE_NOT_CONFIGURED_MSG =
  'Το Stripe δεν είναι ρυθμισμένο. Προσθέστε έγκυρο STRIPE_SECRET_KEY από το Stripe Dashboard στο .env.local και κάντε restart τον dev server.'

// POST /api/stripe/checkout
// Body: { plan: 'GROWER', interval?: 'year' | 'month', returnUrl?: string }
// Annual is the promoted default; monthly is offered as a fallback.
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isStripeSecretKeyConfigured()) {
    return NextResponse.json({ error: STRIPE_NOT_CONFIGURED_MSG }, { status: 503 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { plan, interval, returnUrl } = body as {
    plan: Plan
    interval?: BillingInterval
    returnUrl?: string
  }

  if (plan !== 'GROWER') {
    return NextResponse.json({ error: 'Μη έγκυρο πλάνο.' }, { status: 400 })
  }

  // Annual is the default; fall back to monthly if no annual price is configured.
  const requestedInterval: BillingInterval = interval === 'month' ? 'month' : 'year'
  let priceId = getGrowerPriceId(requestedInterval)
  if (!priceId && requestedInterval === 'year') {
    priceId = getGrowerPriceId('month')
  }
  if (!priceId) {
    return NextResponse.json(
      { error: 'Η online πληρωμή δεν είναι διαθέσιμη αυτή τη στιγμή. Επικοινωνήστε με την υποστήριξη.' },
      { status: 503 },
    )
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
  // Only accept same-origin relative paths; anything else (e.g. "@evil.com",
  // "//evil.com") could turn the Stripe success_url into an open redirect.
  const safeReturnPath =
    typeof returnUrl === 'string' && /^\/(?![\/\\])/.test(returnUrl) ? returnUrl : null
  const successUrl = safeReturnPath
    ? `${origin}${safeReturnPath}`
    : `${origin}/dashboard?upgrade=success`
  const cancelUrl = `${origin}/pricing`

  // Re-use existing Stripe customer when valid for this Stripe account
  let customerId = user.subscription?.stripeCustomerId ?? undefined
  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId)
    } catch (err) {
      if (err instanceof Stripe.errors.StripeInvalidRequestError) {
        customerId = undefined
      } else {
        throw err
      }
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        clerkId: userId,
        plan,
      },
      subscription_data: {
        metadata: { userId: user.id, clerkId: userId, plan },
      },
    })

    if (!session.url) {
      return NextResponse.json(
        { error: 'Δεν δημιουργήθηκε σύνδεσμος πληρωμής. Δοκιμάστε ξανά.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout]', err)
    const isDev = process.env.NODE_ENV === 'development'
    let message = 'Αποτυχία σύνδεσης με Stripe. Δοκιμάστε ξανά ή επικοινωνήστε μαζί μας.'
    if (err instanceof Stripe.errors.StripeAuthenticationError) {
      message = STRIPE_NOT_CONFIGURED_MSG
    } else if (isDev && err instanceof Stripe.errors.StripeError) {
      message = err.message
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
