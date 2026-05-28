import FarmCreationForm from '@/components/farms/FarmCreationForm'
import { prisma } from '@/lib/db'
import { canAddFarm } from '@/lib/plans'
import { getUserPlanByClerkId } from '@/lib/subscription'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function NewFarmPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  })

  if (user) {
    const [userPlan, farmCount] = await Promise.all([
      getUserPlanByClerkId(userId),
      prisma.farm.count({ where: { userId: user.id } }),
    ])

    if (!canAddFarm(userPlan.plan, farmCount)) {
      redirect('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-olive-800">
            Δημιουργία Νέου Ελαιώνα
          </h1>
          <p className="text-gray-600 mt-2">
            Συμπληρώστε τις παρακάτω πληροφορίες για τον ελαιώνα σας
          </p>
        </div>

        <FarmCreationForm userId={userId} />
      </div>
    </div>
  )
}
