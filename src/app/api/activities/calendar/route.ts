import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { buildTaskCalendar } from '@/lib/calendar-export'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Απαιτείται σύνδεση.' }, { status: 401 })
  try {
    const now = new Date()
    // Include today's tasks across timezone boundaries, and the next 90 days.
    const tasks = await prisma.activity.findMany({
      where: {
        farm: { user: { clerkId: userId }, isActive: true },
        completed: false,
        date: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        },
      },
      select: { id: true, title: true, date: true, farmId: true, farm: { select: { name: true } } },
      orderBy: { date: 'asc' },
      take: 1000,
    })
    return new Response(buildTaskCalendar(tasks, now), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="oliveiq-ergasies.ics"',
        'Cache-Control': 'private, no-store',
      },
    })
  } catch {
    return Response.json({ error: 'Δεν ήταν δυνατή η εξαγωγή εργασιών.' }, { status: 500 })
  }
}
