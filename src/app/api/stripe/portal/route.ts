import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// POST /api/stripe/portal
// Opens the Stripe customer portal for subscription management
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  })

  if (!user?.subscription?.stripeCustomerId) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
  }

  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
  const returnUrl = `${origin}/dashboard`

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: returnUrl,
    })
    return NextResponse.json({ url: portalSession.url })
  } catch (err) {
    // A stored customer can be invalid for the current Stripe account — e.g. a
    // leftover test-mode customer after the live-key cutover, or a customer
    // deleted in the Dashboard. Mirror the checkout route: don't 500, tell the
    // user to re-subscribe so a fresh live customer is created.
    if (err instanceof Stripe.errors.StripeInvalidRequestError && err.code === 'resource_missing') {
      console.error('[stripe/portal] stale customer for user', user.id, err.message)
      return NextResponse.json(
        {
          error:
            'Δεν βρέθηκε ενεργή συνδρομή για διαχείριση. Δοκιμάστε να αναβαθμίσετε ξανά για να συνδεθεί ο λογαριασμός σας.',
        },
        { status: 409 },
      )
    }
    console.error('[stripe/portal]', err)
    return NextResponse.json(
      { error: 'Αποτυχία σύνδεσης με το Stripe. Δοκιμάστε ξανά.' },
      { status: 500 },
    )
  }
}
