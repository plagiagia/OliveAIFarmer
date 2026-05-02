import { PrismaClient } from '@prisma/client'
import { parseCoordinates } from '../../src/lib/mapbox-utils'

const prisma = new PrismaClient()

async function main() {
  const shouldWrite = process.argv.includes('--write')

  const farms = await prisma.farm.findMany({
    where: {
      coordinates: { not: null },
      OR: [
        { latitude: null },
        { longitude: null }
      ]
    },
    select: {
      id: true,
      name: true,
      coordinates: true,
      latitude: true,
      longitude: true
    }
  })

  if (farms.length === 0) {
    console.log('No farms need coordinate backfill.')
    return
  }

  let parsedCount = 0
  let updatedCount = 0
  let invalidCount = 0

  for (const farm of farms) {
    const parsed = farm.coordinates ? parseCoordinates(farm.coordinates) : null
    if (!parsed) {
      invalidCount++
      console.warn(`Skipping ${farm.name} (${farm.id}) due to invalid coordinates: ${farm.coordinates}`)
      continue
    }

    parsedCount++

    if (!shouldWrite) {
      console.log(`Would update ${farm.name} (${farm.id}) -> lat=${parsed.lat}, lon=${parsed.lng}`)
      continue
    }

    await prisma.farm.update({
      where: { id: farm.id },
      data: {
        latitude: parsed.lat,
        longitude: parsed.lng
      }
    })

    updatedCount++
    console.log(`Updated ${farm.name} (${farm.id}) -> lat=${parsed.lat}, lon=${parsed.lng}`)
  }

  console.log('--- Coordinate backfill summary ---')
  console.log(`Candidates: ${farms.length}`)
  console.log(`Parsed: ${parsedCount}`)
  console.log(`Invalid: ${invalidCount}`)
  console.log(`Updated: ${updatedCount}`)

  if (!shouldWrite) {
    console.log('Dry-run only. Re-run with --write to persist changes.')
  }
}

main()
  .catch((error) => {
    console.error('Coordinate backfill failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
