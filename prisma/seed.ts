import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with Greek olive farm data...')

  // Create a test user (will be linked to Clerk later)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@olivelog.gr' },
    update: {},
    create: {
      clerkId: 'test-clerk-id',
      email: 'test@olivelog.gr',
      firstName: 'Γιάννης',
      lastName: 'Παπαδόπουλος',
    },
  })

  console.log('✅ Created test user:', testUser.email)

  // Create a test farm
  const testFarm = await prisma.farm.upsert({
    where: { id: 'test-farm-id' },
    update: {},
    create: {
      id: 'test-farm-id',
      name: 'Ελαιώνας Μεσσηνίας',
      location: 'Καλαμάτα, Μεσσηνία',
      coordinates: '37.0421,22.1121',
      totalArea: 52, // 5.2 hectares = 52 stremmata
      description: 'Παραδοσιακός ελαιώνας με κορωνέικη ποικιλία',
      userId: testUser.id,
    },
  })

  console.log('✅ Created test farm:', testFarm.name)

  // Create sample olive trees
  const trees = [
    {
      id: 'tree-001',
      treeNumber: '001',
      variety: 'Κορωνέικη',
      plantingYear: 1995,
      age: 29,
      health: 'GOOD' as const,
    },
    {
      id: 'tree-002',
      treeNumber: '002',
      variety: 'Κορωνέικη',
      plantingYear: 1995,
      age: 29,
      health: 'EXCELLENT' as const,
    },
    {
      id: 'tree-003',
      treeNumber: '003',
      variety: 'Καλαμών',
      plantingYear: 2010,
      age: 14,
      health: 'HEALTHY' as const,
    },
  ]

  for (const tree of trees) {
    await prisma.oliveTree.upsert({
      where: { id: tree.id },
      update: {},
      create: {
        ...tree,
        farmId: testFarm.id,
      },
    })
  }

  console.log('✅ Created sample olive trees')

  // Create sample activities
  const activities = [
    {
      id: 'activity-001',
      type: 'WATERING' as const,
      title: 'Πότισμα Ελαιώνα',
      description: 'Πότισμα των δέντρων του ελαιώνα',
      date: new Date('2024-06-15'),
      duration: 120,
      cost: 50.0,
      weather: 'Ηλιόλουστος, 28°C',
      completed: true,
    },
    {
      id: 'activity-002',
      type: 'PRUNING' as const,
      title: 'Κλάδεμα Χειμερινό',
      description: 'Κλάδεμα για καλύτερη παραγωγή',
      date: new Date('2024-02-10'),
      duration: 480,
      cost: 200.0,
      weather: 'Συννεφιά, 12°C',
      completed: true,
    },
    {
      id: 'activity-003',
      type: 'FERTILIZING' as const,
      title: 'Λίπανση Άνοιξη',
      description: 'Εφαρμογή οργανικού λιπάσματος',
      date: new Date('2024-04-20'),
      duration: 180,
      cost: 150.0,
      weather: 'Μέτριος άνεμος, 20°C',
      completed: true,
    },
  ]

  for (const activity of activities) {
    await prisma.activity.upsert({
      where: { id: activity.id },
      update: {},
      create: {
        ...activity,
        farmId: testFarm.id,
      },
    })
  }

  console.log('✅ Created sample activities')

  // Create sample harvest
  const harvest = await prisma.harvest.upsert({
    where: { id: 'harvest-2023' },
    update: {},
    create: {
      id: 'harvest-2023',
      year: 2023,
      startDate: new Date('2023-11-01'),
      endDate: new Date('2023-11-15'),
      totalYield: 1250.5,
      totalYieldTons: 1.2505,
      pricePerKg: 4.5,
      pricePerTon: 4500,
      priceUnit: 'PER_KG',
      totalValue: 5627.25,
      yieldPerTree: 416.83,
      yieldPerStremma: 24.05,
      notes: 'Εξαιρετική χρονιά με καλή ποιότητα ελαιολάδου',
      completed: true,
      farmId: testFarm.id,
    },
  })

  console.log('✅ Created sample harvest')

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  }) 