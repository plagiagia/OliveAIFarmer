import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Converting existing area data from hectares to stremmata...')

  // Convert farm areas (hectares to stremmata: multiply by 10)
  const farms = await prisma.farm.findMany({
    where: {
      totalArea: {
        not: null
      }
    }
  })

  for (const farm of farms) {
    if (farm.totalArea) {
      const areaInStremmata = farm.totalArea * 10
      await prisma.farm.update({
        where: { id: farm.id },
        data: { totalArea: areaInStremmata }
      })
      console.log(`✅ Updated farm "${farm.name}": ${farm.totalArea} hectares → ${areaInStremmata} stremmata`)
    }
  }

  console.log('🎉 Area conversion completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during migration:', e)
    await prisma.$disconnect()
    process.exit(1)
  }) 