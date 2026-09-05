import { prisma } from '@/lib/db'
import { fetchWeatherData } from '@/lib/weather'
import { activityWeatherWarnings, weatherForActivity } from '@/lib/ai/activity-weather'
import { checkRateLimitAsync } from '@/lib/rate-limit'
import { INACTIVE_FARM_MESSAGE } from '@/lib/farm-activation'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
const schema = z.object({
  farmIds: z.array(z.string().min(1).max(100)).min(1).max(20).transform(ids => [...new Set(ids)]),
  activityType: z.enum(['WATERING', 'PRUNING', 'FERTILIZING', 'PEST_CONTROL', 'SOIL_WORK', 'HARVESTING', 'MAINTENANCE', 'INSPECTION', 'OTHER']),
  date: z.union([z.iso.date(), z.iso.datetime({ offset: true })]),
})

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Απαιτείται σύνδεση' }, { status: 401 })
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: 'Ελέγξτε ελαιώνες, εργασία και ημερομηνία.' }, { status: 400 })
    const rate = await checkRateLimitAsync(`activity-suggestions:${userId}`, 30, 60_000)
    if (!rate.allowed) return NextResponse.json({ error: 'Πολλά αιτήματα. Δοκιμάστε ξανά σε λίγο.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } })
    const { farmIds, activityType, date } = parsed.data
    const selected = new Date(date)
    const farms = await prisma.farm.findMany({ where: { id: { in: farmIds }, user: { clerkId: userId } }, include: { activities: {
      where: { type: activityType, completed: true, date: { gte: new Date(selected.getTime() - 3 * 86400_000), lte: selected } },
      orderBy: { date: 'desc' }, take: 1, select: { date: true },
    } } })
    if (farms.length !== farmIds.length) return NextResponse.json({ error: 'Ο ελαιώνας δεν βρέθηκε' }, { status: 404 })
    if (farms.some(f => !f.isActive)) return NextResponse.json({ error: INACTIVE_FARM_MESSAGE }, { status: 403 })
    const batches = await Promise.all(farms.map(async farm => {
      const suggestions: { type: 'warning' | 'info'; icon: string; title: string; message: string }[] = []
      if (farm.activities.length) suggestions.push({ type: 'info', icon: 'activity', title: 'Πρόσφατη καταγραφή', message: `Υπάρχει ολοκληρωμένη εργασία αυτού του τύπου στις ${farm.activities[0].date.toLocaleDateString('el-GR', { timeZone: 'Europe/Athens' })}. Ελέγξτε αν χρειάζεται επανάληψη.` })
      const parts = farm.coordinates?.split(',')
      const coords = parts?.map(s => Number(s.trim()))
      try {
        if (!coords || coords.length !== 2 || parts?.some(p => !p.trim()) || !coords.every(Number.isFinite) || Math.abs(coords[0]) > 90 || Math.abs(coords[1]) > 180) throw new Error('NO_LOCATION')
        const day = weatherForActivity(await fetchWeatherData(coords[0], coords[1]), selected)
        if (!day) throw new Error('NO_DATE_COVERAGE')
        suggestions.push(...activityWeatherWarnings(activityType, day))
      } catch {
        suggestions.push({ type: 'info', icon: 'activity', title: 'Χωρίς καιρική εκτίμηση', message: 'Δεν υπάρχουν διαθέσιμα καιρικά δεδομένα για αυτή την ημερομηνία και θέση. Ελέγξτε την πρόγνωση κοντά στην ημέρα της εργασίας.' })
      }
      return suggestions.map(s => ({ ...s, farmId: farm.id, farmName: farm.name }))
    }))
    return NextResponse.json({ suggestions: batches.flat().sort((a, b) => Number(b.type === 'warning') - Number(a.type === 'warning')) })
  } catch {
    return NextResponse.json({ error: 'Δεν ήταν δυνατή η φόρτωση των υποδείξεων.' }, { status: 503 })
  }
}
