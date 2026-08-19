import FarmDetailContent from '@/components/farms/FarmDetailContent'
import { getFarmById, getUserByClerkId } from '@/lib/db'
import { reconcileFarmActivationByClerkId } from '@/lib/farm-activation'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

interface FarmDetailPageProps {
  params: Promise<{
    farmId: string
  }>
}

export default async function FarmDetailPage(props: FarmDetailPageProps) {
  const params = await props.params
  const { userId } = await auth()

  if (!userId) {
    redirect('/')
  }

  // Get user data
  await reconcileFarmActivationByClerkId(userId)
  const user = await getUserByClerkId(userId)

  if (!user) {
    redirect('/dashboard')
  }

  // Get farm data with all relationships, scoped to the current user
  const farm = await getFarmById(params.farmId, userId)

  if (!farm) {
    redirect('/dashboard')
  }

  // Check if user owns this farm
  if (farm.userId !== user.id) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <FarmDetailContent
        farm={farm}
        user={user}
      />
    </div>
  )
}
