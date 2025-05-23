import { createUser, getUserByClerkId, getUserByClerkIdBasic } from '@/lib/db'
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get full user data from Clerk
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already exists in our database (basic check)
    let basicUser = await getUserByClerkIdBasic(userId)
    
    if (!basicUser) {
      // Create new user in our database
      basicUser = await createUser({
        id: clerkUser.id,
        emailAddresses: clerkUser.emailAddresses,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
      })
      
      console.log('✅ New user created in database:', basicUser?.email)
    } else {
      console.log('✅ Existing user found:', basicUser.email)
    }

    // Now get the full user data with farms
    const user = await getUserByClerkId(userId)

    if (!user) {
      return NextResponse.json({ error: 'Failed to get user data' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        farmsCount: user.farms?.length || 0,
        hasCompletedOnboarding: (user.farms?.length || 0) > 0
      }
    })
  } catch (error) {
    console.error('❌ User sync error:', error)
    return NextResponse.json({
      success: false,
      error: 'User sync failed'
    }, { status: 500 })
  }
} 