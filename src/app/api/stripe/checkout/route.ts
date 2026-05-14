import { prisma } from '@/lib/db'
import type { Plan } from '@/lib/plans'
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/stripe/checkout
// Body: { plan: Plan, returnUrl?: string }
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { plan, returnUrl } = body as { plan: Plan; returnUrl?: string }

  const priceId = STRIPE_PRICE_IDS[plan as keyof typeof STRIPE_PRICE_IDS]
  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
  const successUrl = returnUrl
    ? `${origin}${returnUrl}`
    : `${origin}/dashboard?upgrade=success`
  const cancelUrl = `${origin}/pricing`

  // Re-use existing Stripe customer if available
  const customerId = user.subscription?.stripeCustomerId ?? undefined

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

  return NextResponse.json({ url: session.url })
}
