import FarmDetailContent from '@/components/farms/FarmDetailContent'
import { getFarmById, getUserByClerkId } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

interface FarmDetailPageProps {
  params: {
    farmId: string
  }
}

export default async function FarmDetailPage({ params }: FarmDetailPageProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/')
  }

  // Get user data
  const user = await getUserByClerkId(userId)
  if (!user) {
    redirect('/dashboard')
  }

  // Get farm data with all relationships
  const farm = await getFarmById(params.farmId)
  
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