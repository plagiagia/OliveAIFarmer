import { createTrapReading, getTrapReadings, prisma } from '@/lib/db'
import { hasFeature, requiresPlanMessage } from '@/lib/plans'
import { getUserPlanByClerkId } from '@/lib/subscription'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const TRAP_TYPES = ['MCPHAIL', 'YELLOW_STICKY', 'DACUS_TRAP', 'OTHER'] as const
type TrapTypeValue = (typeof TRAP_TYPES)[number]

async function authorize(userId: string | null, farmId: string) {
  if (!userId) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const userPlan = await getUserPlanByClerkId(userId)
  if (!hasFeature(userPlan.plan, 'oliveFlyAlerts')) {
    return {
      error: NextResponse.json(
        { error: requiresPlanMessage('GROWER', { subject: 'Η καταγραφή παγίδων δάκου', verb: 'απαιτεί' }) },
        { status: 403 }
      ),
    }
  }
  const farm = await prisma.farm.findFirst({
    where: { id: farmId, user: { clerkId: userId } },
    select: { id: true, isActive: true },
  })
  if (!farm) {
    return { error: NextResponse.json({ error: 'Farm not found' }, { status: 404 }) }
  }
  return { farm }
}

/**
 * GET /api/farms/[farmId]/trap-readings
 * Returns the farm's recent δάκος trap inspections (last 60 days).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { userId } = await auth()
    const { farmId } = await params
    const result = await authorize(userId, farmId)
    if (result.error) return result.error

    const readings = await getTrapReadings(farmId, {
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      limit: 60,
    })
    return NextResponse.json({ success: true, readings })
  } catch (err) {
    console.error('[trap-readings] GET error', err)
    return NextResponse.json({ error: 'Αποτυχία φόρτωσης καταγραφών παγίδων' }, { status: 500 })
  }
}

/**
 * POST /api/farms/[farmId]/trap-readings
 * Logs a new trap inspection.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const { userId } = await auth()
    const { farmId } = await params
    const result = await authorize(userId, farmId)
    if (result.error) return result.error

    const body = await request.json()
    const totalCatch = Number(body.totalCatch)
    if (!Number.isFinite(totalCatch) || totalCatch < 0) {
      return NextResponse.json(
        { error: 'Ο αριθμός συλλήψεων είναι υποχρεωτικός και πρέπει να είναι ≥ 0.' },
        { status: 400 }
      )
    }

    const trapType: TrapTypeValue = TRAP_TYPES.includes(body.trapType)
      ? body.trapType
      : 'MCPHAIL'
    const trapCount = Number.isFinite(Number(body.trapCount)) ? Number(body.trapCount) : 1
    const femaleRaw = body.femaleCatch
    const femaleCatch =
      femaleRaw === '' || femaleRaw == null ? null : Number(femaleRaw)
    if (femaleCatch != null && (!Number.isFinite(femaleCatch) || femaleCatch < 0 || femaleCatch > totalCatch)) {
      return NextResponse.json(
        { error: 'Τα θηλυκά πρέπει να είναι μεταξύ 0 και του συνόλου συλλήψεων.' },
        { status: 400 }
      )
    }

    const date = body.date ? new Date(body.date) : new Date()
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Μη έγκυρη ημερομηνία.' }, { status: 400 })
    }

    const reading = await createTrapReading({
      farmId,
      date,
      trapType,
      trapCount,
      totalCatch,
      femaleCatch,
      daysSincePrev:
        body.daysSincePrev != null && Number.isFinite(Number(body.daysSincePrev))
          ? Number(body.daysSincePrev)
          : null,
      notes: typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null,
    })

    return NextResponse.json({ success: true, reading }, { status: 201 })
  } catch (err) {
    console.error('[trap-readings] POST error', err)
    return NextResponse.json({ error: 'Αποτυχία καταγραφής παγίδας' }, { status: 500 })
  }
}
