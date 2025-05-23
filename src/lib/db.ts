import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Test database connection
export async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully!')
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT version()`
    console.log('✅ Database query test successful!')
    
    return { success: true, message: 'Database connection successful!' }
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return { 
      success: false, 
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Create a user from Clerk data
export async function createUser(clerkUser: {
  id: string
  emailAddresses: Array<{ emailAddress: string }>
  firstName: string | null
  lastName: string | null
}) {
  try {
    const user = await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
      },
      create: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
      },
    })
    
    console.log('✅ User created/updated:', user.id)
    return user
  } catch (error) {
    console.error('❌ Error creating user:', error)
    throw error
  }
}

// Get user by Clerk ID (basic info only)
export async function getUserByClerkIdBasic(clerkId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId }
    })
    
    return user
  } catch (error) {
    console.error('❌ Error getting user:', error)
    throw error
  }
}

// Get user by Clerk ID (with all related data)
export async function getUserByClerkId(clerkId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        farms: {
          include: {
            sections: true,
            trees: true,
            activities: {
              orderBy: { date: 'desc' },
              take: 1 // Only get the most recent activity for each farm
            },
            harvests: true,
          }
        }
      }
    })
    
    return user
  } catch (error) {
    console.error('❌ Error getting user:', error)
    throw error
  }
}

// Get farm by ID with all related data
export async function getFarmById(farmId: string) {
  try {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        sections: {
          include: {
            trees: {
              include: {
                treeActivities: {
                  include: {
                    activity: true
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 5
                },
                treeHarvests: {
                  include: {
                    harvest: true
                  },
                  orderBy: { harvestDate: 'desc' },
                  take: 3
                }
              }
            }
          },
          orderBy: { name: 'asc' }
        },
        trees: {
          include: {
            section: true,
            treeActivities: {
              include: {
                activity: true
              },
              orderBy: { createdAt: 'desc' },
              take: 3
            },
            treeHarvests: {
              include: {
                harvest: true
              },
              orderBy: { harvestDate: 'desc' },
              take: 2
            }
          },
          orderBy: { treeNumber: 'asc' }
        },
        activities: {
          include: {
            treeActivities: {
              include: {
                tree: true
              }
            }
          },
          orderBy: { date: 'desc' }
        },
        harvests: {
          include: {
            treeHarvests: {
              include: {
                tree: true
              }
            }
          },
          orderBy: { year: 'desc' }
        }
      }
    })
    
    return farm
  } catch (error) {
    console.error('❌ Error getting farm:', error)
    throw error
  }
} 