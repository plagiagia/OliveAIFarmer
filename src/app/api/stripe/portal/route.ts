import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

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

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.subscription.stripeCustomerId,
    return_url: returnUrl,
  })

  return NextResponse.json({ url: portalSession.url })
}
