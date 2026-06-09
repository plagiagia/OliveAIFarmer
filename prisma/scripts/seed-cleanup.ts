/**
 * Removes all seed data created by prisma/scripts/seed.ts.
 * Only touches rows whose id starts with "seed-". Real user data is untouched.
 *
 * Run: npm run db:seed:cleanup
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const SEED_PREFIX = 'seed-'

async function main() {
  // Deleting farms cascades to: activities, harvests, weatherRecords,
  // satelliteData, smartRecommendations (all have onDelete: Cascade).
  const farms = await prisma.farm.deleteMany({
    where: { id: { startsWith: SEED_PREFIX } },
  })
  console.log(`🧹 Deleted ${farms.count} seed farms (and all cascaded children).`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Cleanup failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
