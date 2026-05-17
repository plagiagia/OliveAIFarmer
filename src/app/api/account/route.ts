import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/account
 *
 * Hard-deletes the authenticated user's account:
 *   1. Cancels Stripe subscription if any (best-effort, non-blocking)
 *   2. Deletes orphan AIUsage rows (no FK relation on schema)
 *   3. Deletes Prisma User row (cascades to farms, activities, harvests,
 *      subscription, weather/satellite records via schema relations)
 *   4. Deletes the Clerk user (invalidates the session)
 *
 * Fulfils the GDPR Article 17 promise made in /legal/privacy.
 */
export async function DELETE() {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { subscription: true },
  })

  if (user?.subscription?.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId)
    } catch (err) {
      console.error('[account-delete] stripe cancel failed (continuing):', err)
    }
  }

  try {
    await prisma.aIUsage.deleteMany({ where: { userId: clerkId } })
  } catch (err) {
    console.error('[account-delete] AIUsage cleanup failed (continuing):', err)
  }

  if (user) {
    try {
      await prisma.user.delete({ where: { id: user.id } })
    } catch (err) {
      console.error('[account-delete] prisma user delete failed:', err)
      return NextResponse.json(
        { error: 'Αποτυχία διαγραφής δεδομένων. Δοκιμάστε ξανά ή επικοινωνήστε μαζί μας.' },
        { status: 500 }
      )
    }
  }

  try {
    const client = await clerkClient()
    await client.users.deleteUser(clerkId)
  } catch (err) {
    console.error('[account-delete] clerk user delete failed:', err)
    return NextResponse.json(
      {
        error: 'Τα δεδομένα σας διαγράφηκαν αλλά απέτυχε η διαγραφή λογαριασμού σύνδεσης. Επικοινωνήστε στο hello@oliveiq.gr.',
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
