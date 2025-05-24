import DashboardContent from '@/components/dashboard/DashboardContent'
import { getUserByClerkId } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const { userId } = await auth()

  // Note: Authentication is handled by layout.tsx, so we don't need to redirect here
  // The layout ensures only signed-in users can access this page
  
  // Get user data from database (userId will be available due to layout auth)
  const user = userId ? await getUserByClerkId(userId) : null
  
  // If user doesn't exist in database, we'll handle this in the client component
  const userData = user ? {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    farms: user.farms?.map(farm => {
      // Calculate the most recent activity date properly
      const mostRecentActivityDate = farm.activities && farm.activities.length > 0 
        ? new Date(Math.max(...farm.activities.map(activity => new Date(activity.date).getTime())))
        : null

      return {
        id: farm.id,
        name: farm.name,
        location: farm.location,
        coordinates: farm.coordinates,
        totalArea: farm.totalArea,
        treesCount: farm.trees?.length || 0,
        lastActivityDate: mostRecentActivityDate,
        activitiesCount: farm.activities?.length || 0,
        harvestsCount: farm.harvests?.length || 0,
      }
    }) || []
  } : null

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardContent 
        user={userData}
        clerkUserId={userId || ''}
      />
    </div>
  )
} 