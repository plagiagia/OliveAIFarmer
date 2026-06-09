import LandingPage from '@/components/LandingPage'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')
  return <LandingPage />
}
