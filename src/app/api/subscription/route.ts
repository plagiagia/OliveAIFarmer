import { getUserPlanByClerkId } from '@/lib/subscription'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// GET /api/subscription
// Returns the current user's plan, used by the usePlan() hook
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userPlan = await getUserPlanByClerkId(userId)

  return NextResponse.json({
    plan: userPlan.plan,
    status: userPlan.status,
    cancelAtPeriodEnd: userPlan.cancelAtPeriodEnd,
    currentPeriodEnd: userPlan.currentPeriodEnd,
    hasStripe: !!userPlan.stripeCustomerId,
  })
}
