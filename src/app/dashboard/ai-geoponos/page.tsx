import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import DashboardAIGeoponos from '@/components/dashboard/DashboardAIGeoponos'

export const metadata = {
  title: 'AI Γεωπόνος | ΕλαιοLog',
  description: 'Ο ψηφιακός σας γεωπονικός σύμβουλος για όλους τους ελαιώνες σας'
}

export default async function AIGeoponosPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch user and all their farms with related data
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      farms: {
        include: {
          activities: {
            take: 10,
            orderBy: { date: 'desc' }
          },
          harvests: {
            take: 3,
            orderBy: { year: 'desc' }
          },
          satelliteData: {
            take: 2,
            orderBy: { date: 'desc' }
          },
          weatherRecords: {
            take: 7,
            orderBy: { date: 'desc' }
          }
        }
      }
    }
  })

  if (!user) {
    redirect('/sign-in')
  }

  if (user.farms.length === 0) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardAIGeoponos
          user={user}
          farms={user.farms}
        />
      </div>
    </div>
  )
}
