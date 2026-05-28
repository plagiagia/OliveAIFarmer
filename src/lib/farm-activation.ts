/**
 * Keeps farm active/inactive state in sync with subscription plan limits.
 * On downgrade, only the most recently created farms stay active.
 */
import { prisma } from '@/lib/db'
import { ForbiddenError, NotFoundError } from '@/lib/errors'
import type { Plan } from '@/lib/plans'
import { getPlanConfig } from '@/lib/plans'

export const INACTIVE_FARM_MESSAGE =
  'Αυτός ο ελαιώνας είναι ανενεργός λόγω ορίων προγράμματος. Αναβαθμίστε για να τον ενεργοποιήσετε ξανά.'

/** Throws if the farm is missing or inactive (for write operations). */
export function assertFarmIsActive(
  farm: { isActive: boolean } | null | undefined,
  resource = 'Ελαιώνας'
): asserts farm is { isActive: boolean } {
  if (!farm) {
    throw new NotFoundError(resource)
  }
  if (!farm.isActive) {
    throw new ForbiddenError(INACTIVE_FARM_MESSAGE)
  }
}

/**
 * Mark farms active/inactive based on plan maxFarms.
 * Most recently created farms (createdAt desc) are kept active.
 */
export async function reconcileFarmActivationForUser(
  userId: string,
  plan: Plan
): Promise<{ activated: number; deactivated: number }> {
  const { maxFarms } = getPlanConfig(plan)

  const farms = await prisma.farm.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  if (maxFarms === -1) {
    const result = await prisma.farm.updateMany({
      where: { userId, isActive: false },
      data: { isActive: true },
    })
    return { activated: result.count, deactivated: 0 }
  }

  const activeIds = new Set(farms.slice(0, maxFarms).map((f) => f.id))
  const inactiveIds = farms.slice(maxFarms).map((f) => f.id)

  const activeIdList = [...activeIds]

  const activated = await prisma.farm.updateMany({
    where: { userId, id: { in: activeIdList }, isActive: false },
    data: { isActive: true },
  })

  let deactivatedCount = 0
  if (inactiveIds.length > 0) {
    const deactivated = await prisma.farm.updateMany({
      where: { userId, id: { in: inactiveIds }, isActive: true },
      data: { isActive: false },
    })
    deactivatedCount = deactivated.count
  }

  return { activated: activated.count, deactivated: deactivatedCount }
}

/** Reconcile farms for a Clerk user using their current subscription plan. */
export async function reconcileFarmActivationByClerkId(clerkId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      subscription: { select: { plan: true } },
    },
  })

  if (!user) return

  const plan = (user.subscription?.plan ?? 'FREE') as Plan
  await reconcileFarmActivationForUser(user.id, plan)
}

/** Load an owned farm; optionally require it to be active. */
export async function getOwnedFarm(
  farmId: string,
  clerkId: string,
  options?: { requireActive?: boolean }
) {
  const farm = await prisma.farm.findFirst({
    where: {
      id: farmId,
      user: { clerkId },
    },
  })

  if (!farm) return null

  if (options?.requireActive) {
    assertFarmIsActive(farm)
  }

  return farm
}
