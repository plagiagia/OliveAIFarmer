/**
 * Server-side helper: get the current user's subscription plan.
 * Falls back to FREE if no subscription record exists.
 * Use this in Server Components and API route handlers.
 */
import { prisma } from '@/lib/db'
import type { Plan, PlanConfig } from '@/lib/plans'
import { getEntitledPlan, getPlanConfig } from '@/lib/plans'
import { auth } from '@clerk/nextjs/server'

export interface UserPlan {
  plan: Plan
  config: PlanConfig
  status: string
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: Date | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

/**
 * Get the subscription plan for the currently authenticated user.
 * Returns FREE plan if not subscribed.
 */
export async function getCurrentUserPlan(): Promise<UserPlan> {
  const { userId } = await auth()
  if (!userId) {
    return freePlan()
  }
  return getUserPlanByClerkId(userId)
}

/**
 * Get the subscription plan for a specific Clerk user ID.
 * Useful in API routes where you already have the clerkId.
 */
export async function getUserPlanByClerkId(clerkId: string): Promise<UserPlan> {
  // A failed plan lookup (e.g. a legacy enum value in an un-migrated
  // database) must degrade to FREE, never crash the page render.
  let user
  try {
    user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, subscription: true },
    })
  } catch (err) {
    console.error('[subscription] plan lookup failed, defaulting to FREE:', err)
    return freePlan()
  }

  if (!user?.subscription) {
    return freePlan()
  }

  const sub = user.subscription
  const plan = getEntitledPlan(sub.plan, sub.status)

  return {
    plan,
    config: getPlanConfig(plan),
    status: sub.status,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    currentPeriodEnd: sub.currentPeriodEnd,
    stripeCustomerId: sub.stripeCustomerId,
    stripeSubscriptionId: sub.stripeSubscriptionId,
  }
}

function freePlan(): UserPlan {
  return {
    plan: 'FREE',
    config: getPlanConfig('FREE'),
    status: 'ACTIVE',
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  }
}
