import DashboardContent from '@/components/dashboard/DashboardContent'
import { getUserByClerkId } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/')
  }

  // Get user data from database
  const user = await getUserByClerkId(userId)
  
  // If user doesn't exist in database, we'll handle this in the client component
  const userData = user ? {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    farms: user.farms?.map(farm => ({
      id: farm.id,
      name: farm.name,
      location: farm.location,
      totalArea: farm.totalArea,
      treesCount: farm.trees?.length || 0,
      sectionsCount: farm.sections?.length || 0,
      lastActivityDate: farm.activities?.[0]?.date || null,
      activitiesCount: farm.activities?.length || 0,
      harvestsCount: farm.harvests?.length || 0,
    })) || []
  } : null

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardContent 
        user={userData}
        clerkUserId={userId}
      />
    </div>
  )
} 