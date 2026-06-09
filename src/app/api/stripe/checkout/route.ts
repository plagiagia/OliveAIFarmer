import { prisma } from '@/lib/db'
import type { Plan } from '@/lib/plans'
import { isStripeSecretKeyConfigured, stripe, STRIPE_PRICE_IDS } from '@/lib/stripe'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const STRIPE_NOT_CONFIGURED_MSG =
  'Το Stripe δεν είναι ρυθμισμένο. Προσθέστε έγκυρο STRIPE_SECRET_KEY από το Stripe Dashboard στο .env.local και κάντε restart τον dev server.'

// Plans purchasable via self-serve checkout. VIEWER_SEAT is an add-on price,
// not a plan, and MILL is enterprise-only — neither may be checked out here.
const SELF_SERVE_PLANS = ['GROWER', 'PRODUCER'] as const satisfies readonly Plan[]

// POST /api/stripe/checkout
// Body: { plan: Plan, returnUrl?: string }
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
  const { plan, returnUrl } = body as { plan: Plan; returnUrl?: string }

  // Mill is enterprise-only — not available for self-serve checkout
  if (plan === 'MILL') {
    return NextResponse.json({ error: 'Το πλάνο Ελαιουργείο δεν είναι διαθέσιμο online.' }, { status: 400 })
  }

  if (!SELF_SERVE_PLANS.includes(plan as (typeof SELF_SERVE_PLANS)[number])) {
    return NextResponse.json({ error: 'Μη έγκυρο πλάνο.' }, { status: 400 })
  }

  const priceId = STRIPE_PRICE_IDS[plan as keyof typeof STRIPE_PRICE_IDS]
  if (!priceId) {
    return NextResponse.json(
      {
        error:
          plan === 'FREE'
            ? 'Μη έγκυρο πλάνο.'
            : 'Η online πληρωμή δεν είναι διαθέσιμη αυτή τη στιγμή. Επικοινωνήστε με την υποστήριξη.',
      },
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
