import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    farm: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

import { POST } from '@/app/api/farms/create/route'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

describe('POST /api/farms/create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never)

    const request = new NextRequest('http://localhost/api/farms/create', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Farm', location: 'Athens' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 400 if name is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'test-clerk-id' } as never)

    const request = new NextRequest('http://localhost/api/farms/create', {
      method: 'POST',
      body: JSON.stringify({ location: 'Athens' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Το όνομα και η τοποθεσία είναι υποχρεωτικά')
  })

  it('returns 400 if location is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'test-clerk-id' } as never)

    const request = new NextRequest('http://localhost/api/farms/create', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Farm' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Το όνομα και η τοποθεσία είναι υποχρεωτικά')
  })

  it('returns 404 if user not found in database', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'test-clerk-id' } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/farms/create', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Farm', location: 'Athens' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('User not found')
  })

  it('creates farm successfully with treeCount and oliveVariety', async () => {
    const mockUser = {
      id: 'user-123',
      clerkId: 'test-clerk-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    }

    const mockFarm = {
      id: 'farm-123',
      name: 'Ελαιώνας Καλαμάτας',
      location: 'Καλαμάτα, Μεσσηνία',
      coordinates: '37.0421, 22.1132',
      totalArea: 5.5,
      treeCount: 100,
      oliveVariety: 'Κορωνέικη',
      description: 'Οικογενειακός ελαιώνας',
      activities: [],
      harvests: [],
    }

    vi.mocked(auth).mockResolvedValue({ userId: 'test-clerk-id' } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never)
    vi.mocked(prisma.farm.create).mockResolvedValue(mockFarm as never)

    const request = new NextRequest('http://localhost/api/farms/create', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ελαιώνας Καλαμάτας',
        location: 'Καλαμάτα, Μεσσηνία',
        coordinates: '37.0421, 22.1132',
        totalArea: '5.5',
        treeCount: '100',
        oliveVariety: 'Κορωνέικη',
        description: 'Οικογενειακός ελαιώνας',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.farm.name).toBe('Ελαιώνας Καλαμάτας')
    expect(data.farm.location).toBe('Καλαμάτα, Μεσσηνία')
    expect(data.farm.treeCount).toBe(100)
    expect(data.farm.oliveVariety).toBe('Κορωνέικη')
  })
})
