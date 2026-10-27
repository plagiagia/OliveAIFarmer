import LandingPage from '@/components/LandingPage'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import ProductSchema from '@/components/pricing/ProductSchema'

export const metadata = { alternates: { canonical: '/' } }

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')
  return <><ProductSchema /><LandingPage /></>
}
