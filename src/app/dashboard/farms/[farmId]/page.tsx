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
  console.log('[FarmDetailPage] Starting to load farm:', params.farmId)

  try {
    console.log('[FarmDetailPage] Calling auth()...')
    const { userId } = await auth()
    console.log('[FarmDetailPage] auth() returned userId:', userId ? 'present' : 'null')

    if (!userId) {
      console.log('[FarmDetailPage] No userId, redirecting to /')
      redirect('/')
    }

    // Get user data
    console.log('[FarmDetailPage] Getting user by clerkId...')
    const user = await getUserByClerkId(userId)
    console.log('[FarmDetailPage] User found:', user ? 'yes' : 'no')

    if (!user) {
      console.log('[FarmDetailPage] No user found, redirecting to /dashboard')
      redirect('/dashboard')
    }

    // Get farm data with all relationships
    console.log('[FarmDetailPage] Getting farm by id:', params.farmId)
    const farm = await getFarmById(params.farmId)
    console.log('[FarmDetailPage] Farm found:', farm ? 'yes' : 'no')

    if (!farm) {
      console.log('[FarmDetailPage] No farm found, redirecting to /dashboard')
      redirect('/dashboard')
    }

    // Check if user owns this farm
    if (farm.userId !== user.id) {
      console.log('[FarmDetailPage] User does not own farm, redirecting to /dashboard')
      redirect('/dashboard')
    }

    console.log('[FarmDetailPage] Successfully loaded farm, rendering content')
    return (
      <div className="min-h-screen bg-gray-50">
        <FarmDetailContent
          farm={farm}
          user={user}
        />
      </div>
    )
  } catch (error) {
    console.error('[FarmDetailPage] Error loading farm:', error)
    throw error
  }
} 