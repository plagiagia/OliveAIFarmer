/**
 * Realistic demo seed for OliveIQ.
 *
 * Attaches data to the most recently created User in the DB (assumed to be
 * you — the person running the seed locally after signing in once).
 *
 * Idempotent: re-running deletes prior seed records (id prefix "seed-")
 * and re-creates fresh ones with dates relative to today, so the dashboard
 * always shows "recent" activity.
 *
 * To remove all seed data:
 *   pnpm/npm exec prisma studio
 *   delete farms whose id starts with "seed-"
 */

import {
  PrismaClient,
  ActivityType,
  PriceUnit,
  WeatherDataSource,
  RecommendationType,
  Priority,
  InsightSource,
} from '@prisma/client'

const prisma = new PrismaClient()

const SEED_PREFIX = 'seed-'

interface FarmTemplate {
  id: string
  name: string
  location: string
  latitude: number
  longitude: number
  totalArea: number
  treeCount: number
  oliveVariety: string
  treeAge: number
  description: string
}

const FARMS: FarmTemplate[] = [
  {
    id: `${SEED_PREFIX}farm-kalamata`,
    name: 'Ελαιώνας Μεσσηνίας',
    location: 'Καλαμάτα, Μεσσηνία',
    latitude: 37.0421,
    longitude: 22.1121,
    totalArea: 48,
    treeCount: 300,
    oliveVariety: 'Κορωνέικη',
    treeAge: 35,
    description: 'Παραδοσιακός οικογενειακός ελαιώνας στους πρόποδες του Ταϋγέτου.',
  },
  {
    id: `${SEED_PREFIX}farm-chania`,
    name: 'Κτήμα Κολυμπάρι',
    location: 'Κολυμπάρι, Χανιά',
    latitude: 35.5333,
    longitude: 23.7833,
    totalArea: 120,
    treeCount: 850,
    oliveVariety: 'Κορωνέικη',
    treeAge: 45,
    description: 'Εκτεταμένο κτήμα με βιολογική καλλιέργεια. Producer-scale.',
  },
  {
    id: `${SEED_PREFIX}farm-polygyros`,
    name: 'Αγρόκτημα Χαλκιδικής',
    location: 'Πολύγυρος, Χαλκιδική',
    latitude: 40.3782,
    longitude: 23.4429,
    totalArea: 22,
    treeCount: 150,
    oliveVariety: 'Καλαμών',
    treeAge: 28,
    description: 'Μικρός ελαιώνας για βρώσιμη ελιά ποικιλίας Καλαμών.',
  },
]

const ACTIVITY_TEMPLATES: Array<{
  type: ActivityType
  title: string
  description: string
  duration: number
  costPerTree: number
}> = [
  { type: 'WATERING', title: 'Πότισμα', description: 'Πότισμα με σύστημα στάγδην.', duration: 180, costPerTree: 0.15 },
  { type: 'PRUNING', title: 'Κλάδεμα', description: 'Κλάδεμα ξηρών κλαδιών και διαμόρφωση κόμης.', duration: 480, costPerTree: 0.8 },
  { type: 'FERTILIZING', title: 'Λίπανση NPK', description: 'Εφαρμογή σύνθετου λιπάσματος 11-15-15.', duration: 150, costPerTree: 0.4 },
  { type: 'PEST_CONTROL', title: 'Ψεκασμός Δάκου', description: 'Δολωματικός ψεκασμός με spinosad.', duration: 200, costPerTree: 0.25 },
  { type: 'SOIL_WORK', title: 'Φρεζάρισμα', description: 'Φρεζάρισμα για αποξήρανση ζιζανίων.', duration: 240, costPerTree: 0.2 },
  { type: 'INSPECTION', title: 'Επιθεώρηση', description: 'Έλεγχος υγείας δέντρων μετά από βροχόπτωση.', duration: 90, costPerTree: 0 },
  { type: 'MAINTENANCE', title: 'Συντήρηση εξοπλισμού', description: 'Συντήρηση συστήματος ποτίσματος.', duration: 120, costPerTree: 0 },
]

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(8 + Math.floor(Math.random() * 6), 0, 0, 0)
  return d
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

async function findTargetUser() {
  const email = process.env.SEED_TARGET_EMAIL?.trim()
  if (!email) {
    throw new Error(
      'SEED_TARGET_EMAIL is required. Run with: SEED_TARGET_EMAIL=you@example.com npm run db:seed\n' +
      'This prevents accidentally seeding against a random user in the DB.'
    )
  }
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new Error(
      `No User row found for email "${email}". Sign in at least once so /api/sync-user creates the row, then re-run.`
    )
  }
  return user
}

async function wipeSeedData() {
  // Cascades to activities, harvests, weather, recommendations via schema relations.
  const deleted = await prisma.farm.deleteMany({
    where: { id: { startsWith: SEED_PREFIX } },
  })
  console.log(`🧹 Removed ${deleted.count} previous seed farms (cascaded children).`)
}

async function seedFarms(userId: string) {
  for (const f of FARMS) {
    await prisma.farm.create({
      data: {
        id: f.id,
        name: f.name,
        location: f.location,
        coordinates: `${f.latitude},${f.longitude}`,
        latitude: f.latitude,
        longitude: f.longitude,
        totalArea: f.totalArea,
        treeCount: f.treeCount,
        oliveVariety: f.oliveVariety,
        treeAge: f.treeAge,
        description: f.description,
        userId,
      },
    })
  }
  console.log(`🌳 Created ${FARMS.length} farms.`)
}

async function seedActivities() {
  let total = 0
  for (const farm of FARMS) {
    // ~10 activities per farm spread across last 90 days
    for (let i = 0; i < 10; i++) {
      const tpl = ACTIVITY_TEMPLATES[i % ACTIVITY_TEMPLATES.length]
      const dayOffset = Math.floor((i / 10) * 90) + Math.floor(Math.random() * 8)
      const cost = Math.round(tpl.costPerTree * farm.treeCount * 100) / 100
      await prisma.activity.create({
        data: {
          farmId: farm.id,
          type: tpl.type,
          title: tpl.title,
          description: tpl.description,
          date: daysAgo(dayOffset),
          duration: tpl.duration,
          cost: cost > 0 ? cost : null,
          completed: dayOffset > 7, // older ones are done, recent ones may still be open
          notes: dayOffset > 30 ? null : 'Πρόσφατη εργασία — προστέθηκε από seed.',
        },
      })
      total++
    }
  }
  console.log(`📋 Created ${total} activities.`)
}

async function seedHarvests() {
  const currentYear = new Date().getFullYear()
  let total = 0
  for (const farm of FARMS) {
    for (const offset of [3, 2, 1]) {
      // 3 historical harvests: currentYear-3, -2, -1
      const year = currentYear - offset
      const yieldKg = Math.round(farm.treeCount * randomBetween(6, 12) * 100) / 100
      const pricePerKg = +(randomBetween(3.8, 5.2)).toFixed(2)
      const totalValue = Math.round(yieldKg * pricePerKg * 100) / 100
      await prisma.harvest.create({
        data: {
          year,
          startDate: new Date(`${year}-10-15`),
          endDate: new Date(`${year}-11-25`),
          totalYield: yieldKg,
          totalYieldTons: +(yieldKg / 1000).toFixed(3),
          pricePerKg,
          pricePerTon: pricePerKg * 1000,
          priceUnit: PriceUnit.PER_KG,
          totalValue,
          yieldPerTree: +(yieldKg / farm.treeCount).toFixed(2),
          yieldPerStremma: +(yieldKg / farm.totalArea).toFixed(2),
          notes: offset === 1 ? 'Καλή χρονιά παρά την ξηρασία Αυγούστου.' : null,
          completed: true,
          farmId: farm.id,
        },
      })
      total++
    }
  }
  console.log(`🫒 Created ${total} harvests.`)
}

async function seedWeather() {
  let total = 0
  for (const farm of FARMS) {
    // 30 daily weather records for last 30 days
    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() - i)
      d.setUTCHours(0, 0, 0, 0)
      // Realistic May Greek weather
      const tempBase = farm.latitude > 38 ? 18 : 22 // colder in N
      const tempLow = +(tempBase + randomBetween(-3, 2)).toFixed(1)
      const tempHigh = +(tempLow + randomBetween(5, 10)).toFixed(1)
      await prisma.weatherRecord.create({
        data: {
          farmId: farm.id,
          date: d,
          tempLow,
          tempHigh,
          tempAvg: +((tempLow + tempHigh) / 2).toFixed(1),
          humidity: Math.round(randomBetween(45, 75)),
          rainfall: Math.random() < 0.18 ? +randomBetween(1, 8).toFixed(1) : 0,
          windSpeed: +randomBetween(1, 6).toFixed(1),
          windGust: +randomBetween(4, 12).toFixed(1),
          windDirection: Math.round(randomBetween(0, 360)),
          pressure: Math.round(randomBetween(1008, 1022)),
          clouds: Math.round(randomBetween(0, 60)),
          condition: Math.random() < 0.7 ? 'Αίθριος' : 'Νεφώσεις',
          source: WeatherDataSource.CRON_DAILY,
        },
      })
      total++
    }
  }
  console.log(`☀️  Created ${total} weather records.`)
}

async function seedRecommendations() {
  const items: Array<{
    type: RecommendationType
    title: string
    message: string
    urgency: Priority
    farmIdx: number
  }> = [
    {
      type: RecommendationType.WEATHER_ALERT,
      title: 'Προβλέπεται ξηρασία την επόμενη εβδομάδα',
      message: 'Τα μοντέλα δείχνουν 0mm βροχόπτωσης για 7 ημέρες με θερμοκρασίες >30°C. Εξετάστε ποτίσμα στα νεαρά δέντρα.',
      urgency: Priority.HIGH,
      farmIdx: 0,
    },
    {
      type: RecommendationType.RISK_WARNING,
      title: 'Αυξημένος κίνδυνος Δάκου',
      message: 'Συνδυασμός θερμοκρασίας 24-28°C και υγρασίας >65% ευνοεί ωοτοκία Bactrocera oleae. Προγραμματίστε δολωματικό ψεκασμό.',
      urgency: Priority.CRITICAL,
      farmIdx: 1,
    },
    {
      type: RecommendationType.SEASONAL_TIP,
      title: 'Εποχή για φυλλοδιαγνωστική',
      message: 'Μάιος είναι ο βέλτιστος μήνας για δειγματοληψία φύλλων (ανάλυση Ν, Ρ, Κ, Β) πριν την ανθοφορία.',
      urgency: Priority.MEDIUM,
      farmIdx: 2,
    },
    {
      type: RecommendationType.OPTIMIZATION,
      title: 'Βελτιστοποίηση κόστους ψεκασμών',
      message: 'Από τις τελευταίες 4 εργασίες ψεκασμού, η κατανάλωση ανά δέντρο ξεπερνά τον μ.ο. κατά 18%. Εξετάστε μικρότερα ραντίσματα ή ρυθμιστικό σπρέι.',
      urgency: Priority.LOW,
      farmIdx: 0,
    },
    {
      type: RecommendationType.CARE_SUGGESTION,
      title: 'Παρακολούθηση ανθοφορίας',
      message: 'Η ποικιλία Κορωνέικη εισέρχεται σε φάση ανθοφορίας. Αποφύγετε αζωτούχες λιπάνσεις τις επόμενες 3 εβδομάδες.',
      urgency: Priority.MEDIUM,
      farmIdx: 1,
    },
  ]

  for (const r of items) {
    await prisma.smartRecommendation.create({
      data: {
        type: r.type,
        title: r.title,
        message: r.message,
        actionRequired: r.urgency === Priority.HIGH || r.urgency === Priority.CRITICAL,
        urgency: r.urgency,
        source: InsightSource.RULE_BASED,
        farmId: FARMS[r.farmIdx].id,
        weatherBased: r.type === RecommendationType.WEATHER_ALERT,
        seasonBased: r.type === RecommendationType.SEASONAL_TIP,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
  }
  console.log(`💡 Created ${items.length} smart recommendations.`)
}

async function main() {
  console.log('🌱 OliveIQ demo seed starting...\n')

  const user = await findTargetUser()
  console.log(`👤 Target user: ${user.firstName} ${user.lastName} <${user.email}> (id=${user.id})\n`)

  await wipeSeedData()
  await seedFarms(user.id)
  await seedActivities()
  await seedHarvests()
  await seedWeather()
  await seedRecommendations()

  console.log('\n🎉 Seed complete. Refresh your dashboard.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
