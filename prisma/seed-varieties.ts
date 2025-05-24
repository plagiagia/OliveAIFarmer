import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedOliveVarieties() {
  console.log('🌱 Seeding olive variety knowledge base...')

  // === 1. ΚΟΡΩΝΈΙΚΗ (Koroneiki) ===
  const koroneiki = await prisma.oliveVariety.upsert({
    where: { name: 'Κορωνέικη' },
    update: {},
    create: {
      name: 'Κορωνέικη',
      scientificName: 'Olea europaea var. Koroneiki',
      alternativeNames: ['Κορωνέϊκη', 'Κορωνάικη', 'Λαδολιά'],
      primaryRegions: ['Καλαμάτα', 'Μεσσηνία', 'Κρήτη', 'Πελοπόννησος'],
      treeSize: 'MEDIUM',
      fruitType: 'OIL',
      oilContent: 22.5,
      maturityPeriod: 'Οκτώβριος - Δεκέμβριος',
      avgYieldPerTree: 15.0,
      avgYieldPerStremma: 250.0,
      productionStart: 3,
      peakProduction: 8,
      oilQuality: 'Εξαιρετικά υψηλή ποιότητα, πλούσια γεύση, χαμηλή οξύτητα',
      flavor: 'Έντονη, πικάντικη, φρουτώδης με νότες πιπεριού',
      storageLife: '2-3 χρόνια σε σκοτεινό και δροσερό μέρος',
      climateNeeds: {
        temperature: 'Μέσος όρος 15-20°C, αντέχει μέχρι -10°C',
        humidity: 'Μέτρια υγρασία 50-70%',
        rainfall: '400-600mm ετησίως',
        windTolerance: 'Καλή αντοχή σε αέρα'
      },
      soilNeeds: {
        ph: '6.5-8.0',
        drainage: 'Απαραίτητη καλή στράγγιση',
        composition: 'Προτιμά πετρώδη, ασβεστώδη εδάφη',
        depth: 'Βαθύ έδαφος για καλύτερη ανάπτυξη ριζών'
      },
      waterNeeds: 'MEDIUM',
      sunlightNeeds: 'FULL',
      windTolerance: 'HIGH',
      diseaseResistance: {
        anthrancnose: 'Μέτρια',
        peacockSpot: 'Καλή',
        oliveKnot: 'Μέτρια',
        rootRot: 'Χαμηλή'
      },
      pestResistance: {
        oliveFruit: 'Μέτρια',
        oliveScale: 'Καλή',
        blackScale: 'Μέτρια',
        oliveMoth: 'Χαμηλή'
      },
      pruningNeeds: 'MODERATE',
      fertilizingNeeds: 'MEDIUM',
      irrigationNeeds: 'REGULAR'
    }
  })

  // === 2. ΚΑΛΑΜΏΝ (Kalamata) ===
  const kalamata = await prisma.oliveVariety.upsert({
    where: { name: 'Καλαμών' },
    update: {},
    create: {
      name: 'Καλαμών',
      scientificName: 'Olea europaea var. Kalamon',
      alternativeNames: ['Κλαμάτα', 'Καλλαμάτα', 'Καλαμάτα'],
      primaryRegions: ['Καλαμάτα', 'Μεσσηνία', 'Λακωνία'],
      treeSize: 'LARGE',
      fruitType: 'TABLE',
      oilContent: 15.0,
      maturityPeriod: 'Οκτώβριος - Νοέμβριος',
      avgYieldPerTree: 25.0,
      avgYieldPerStremma: 400.0,
      productionStart: 4,
      peakProduction: 10,
      oilQuality: 'Καλή ποιότητα για παραγωγή λαδιού δεύτερης επιλογής',
      flavor: 'Μαλακή, φρουτώδης με ελαφρά πικρή γεύση',
      storageLife: 'Ως επιτραπέζια: 6-12 μήνες σε άλμη',
      climateNeeds: {
        temperature: 'Μέσος όρος 16-22°C, αντέχει μέχρι -8°C',
        humidity: 'Μέτρια υγρασία 55-75%',
        rainfall: '500-700mm ετησίως',
        windTolerance: 'Μέτρια αντοχή σε αέρα'
      },
      soilNeeds: {
        ph: '6.0-7.5',
        drainage: 'Καλή στράγγιση αλλά όχι ξηρό έδαφος',
        composition: 'Γόνιμα, αργιλο-αμμώδη εδάφη',
        depth: 'Βαθύ έδαφος απαραίτητο'
      },
      waterNeeds: 'HIGH',
      sunlightNeeds: 'FULL',
      windTolerance: 'MEDIUM',
      diseaseResistance: {
        anthrancnose: 'Χαμηλή',
        peacockSpot: 'Μέτρια',
        oliveKnot: 'Χαμηλή',
        rootRot: 'Μέτρια'
      },
      pestResistance: {
        oliveFruit: 'Χαμηλή',
        oliveScale: 'Μέτρια',
        blackScale: 'Χαμηλή',
        oliveMoth: 'Χαμηλή'
      },
      pruningNeeds: 'INTENSIVE',
      fertilizingNeeds: 'HIGH',
      irrigationNeeds: 'INTENSIVE'
    }
  })

  // === 3. ΧΟΝΔΡΟΛΙΆ ΧΑΛΚΙΔΙΚΉΣ (Chondrolia Chalkidikis) ===
  const chondrolia = await prisma.oliveVariety.upsert({
    where: { name: 'Χονδρολιά Χαλκιδικής' },
    update: {},
    create: {
      name: 'Χονδρολιά Χαλκιδικής',
      scientificName: 'Olea europaea var. Chondrolia',
      alternativeNames: ['Χονδρολιά', 'Χαλκιδική', 'Πράσινη Χαλκιδικής'],
      primaryRegions: ['Χαλκιδική', 'Θεσσαλονίκη', 'Μακεδονία'],
      treeSize: 'LARGE',
      fruitType: 'TABLE',
      oilContent: 12.0,
      maturityPeriod: 'Σεπτέμβριος - Οκτώβριος',
      avgYieldPerTree: 30.0,
      avgYieldPerStremma: 450.0,
      productionStart: 4,
      peakProduction: 12,
      oilQuality: 'Μέτρια ποιότητα λαδιού, κυρίως για επιτραπέζια χρήση',
      flavor: 'Μαλακή, ελαφρώς αλμυρή, ιδανική για γέμιση',
      storageLife: 'Ως επιτραπέζια: 8-12 μήνες σε άλμη',
      climateNeeds: {
        temperature: 'Μέσος όρος 14-18°C, αντέχει μέχρι -12°C',
        humidity: 'Υψηλή υγρασία 60-80%',
        rainfall: '600-800mm ετησίως',
        windTolerance: 'Καλή αντοχή σε κρύο αέρα'
      },
      soilNeeds: {
        ph: '6.5-7.8',
        drainage: 'Μέτρια στράγγιση',
        composition: 'Αργιλώδη, γόνιμα εδάφη',
        depth: 'Μέτριο βάθος επαρκές'
      },
      waterNeeds: 'HIGH',
      sunlightNeeds: 'FULL',
      windTolerance: 'HIGH',
      diseaseResistance: {
        anthrancnose: 'Καλή',
        peacockSpot: 'Καλή',
        oliveKnot: 'Μέτρια',
        rootRot: 'Καλή'
      },
      pestResistance: {
        oliveFruit: 'Μέτρια',
        oliveScale: 'Καλή',
        blackScale: 'Καλή',
        oliveMoth: 'Μέτρια'
      },
      pruningNeeds: 'MODERATE',
      fertilizingNeeds: 'HIGH',
      irrigationNeeds: 'INTENSIVE'
    }
  })

  console.log('✅ Created olive varieties:', koroneiki.name, kalamata.name, chondrolia.name)

  // Add monthly tasks for Κορωνέικη
  await createMonthlyTasks(koroneiki.id, 'Κορωνέικη')
  
  // Add monthly tasks for Καλαμών  
  await createMonthlyTasks(kalamata.id, 'Καλαμών')
  
  // Add monthly tasks for Χονδρολιά
  await createMonthlyTasks(chondrolia.id, 'Χονδρολιά Χαλκιδικής')

  // Add risk factors for all varieties
  await createRiskFactors(koroneiki.id, kalamata.id, chondrolia.id)

  // Add care guidelines for all varieties
  await createCareGuidelines(koroneiki.id, kalamata.id, chondrolia.id)

  console.log('🎉 Olive variety knowledge base seeded successfully!')
}

async function createMonthlyTasks(varietyId: string, varietyName: string) {
  const tasks = [
    // JANUARY
    { month: 1, taskType: 'PRUNING', title: 'Κλάδεμα διαμόρφωσης', description: 'Κλάδεμα για διαμόρφωση κόμης και αφαίρεση βλαστών', priority: 'HIGH', timing: 'Μέσα μήνα', duration: '2-3 ώρες ανά δέντρο', tools: ['Κλαδευτήρι', 'Πριόνι', 'Στεγνωτικό'], temperatureRange: '5-15°C' },
    
    // FEBRUARY  
    { month: 2, taskType: 'FERTILIZING', title: 'Χειμερινή λίπανση', description: 'Εφαρμογή οργανικού λιπάσματος και φωσφόρου', priority: 'HIGH', timing: 'Αρχές μήνα', duration: '1 ώρα ανά δέντρο', tools: ['Σκαπάνη', 'Λίπασμα'], temperatureRange: '8-18°C' },
    
    // MARCH
    { month: 3, taskType: 'SOIL_PREPARATION', title: 'Προετοιμασία εδάφους', description: 'Όργωμα και βελτίωση εδάφους γύρω από τα δέντρα', priority: 'MEDIUM', timing: 'Τέλος μήνα', duration: '30 λεπτά ανά δέντρο', tools: ['Τσάπα', 'Κομπόστ'] },
    
    // APRIL
    { month: 4, taskType: 'WATERING', title: 'Έναρξη ποτίσματος', description: 'Έναρξη τακτικού ποτίσματος μετά τον χειμώνα', priority: 'HIGH', timing: 'Αρχές μήνα', duration: '15 λεπτά ανά δέντρο', tools: ['Λάστιχο', 'Ποτιστήρια'] },
    
    // MAY
    { month: 5, taskType: 'PEST_CONTROL', title: 'Έλεγχος παρασίτων', description: 'Παρακολούθηση για δάκο και άλλα παράσιτα', priority: 'HIGH', timing: 'Όλο τον μήνα', duration: '20 λεπτά επιθεώρησης', tools: ['Μεγεθυντικός φακός', 'Παγίδες'] },
    
    // JUNE
    { month: 6, taskType: 'WATERING', title: 'Εντατικό πότισμα', description: 'Αύξηση συχνότητας ποτίσματος λόγω ζέστης', priority: 'CRITICAL', timing: 'Κάθε 2-3 μέρες', duration: '20 λεπτά ανά δέντρο', tools: ['Σύστημα άρδευσης'] },
    
    // JULY
    { month: 7, taskType: 'MONITORING', title: 'Παρακολούθηση καρπών', description: 'Έλεγχος ανάπτυξης καρπών και προσαρμογή φροντίδας', priority: 'MEDIUM', timing: 'Εβδομαδιαία', duration: '15 λεπτά ανά δέντρο', tools: ['Σημειωματάριο'] },
    
    // AUGUST
    { month: 8, taskType: 'WATERING', title: 'Συνεχές πότισμα', description: 'Διατήρηση υγρασίας κατά τη ζεστή περίοδο', priority: 'CRITICAL', timing: 'Καθημερινά', duration: '25 λεπτά ανά δέντρο', tools: ['Αυτόματο πότισμα'] },
    
    // SEPTEMBER
    { month: 9, taskType: 'HARVESTING', title: 'Προετοιμασία συγκομιδής', description: 'Ελαφρό κλάδεμα και προετοιμασία εργαλείων συγκομιδής', priority: 'HIGH', timing: 'Αρχές μήνα', duration: '1 ώρα ανά δέντρο', tools: ['Δίχτυα', 'Κλαδευτήρια'] },
    
    // OCTOBER  
    { month: 10, taskType: 'HARVESTING', title: 'Συγκομιδή ελιών', description: 'Συλλογή ώριμων ελιών για λάδι ή επιτραπέζια χρήση', priority: 'CRITICAL', timing: 'Όλο τον μήνα', duration: '3-4 ώρες ανά δέντρο', tools: ['Δίχτυα', 'Χτένες', 'Κάδοι'] },
    
    // NOVEMBER
    { month: 11, taskType: 'HARVESTING', title: 'Τέλος συγκομιδής', description: 'Ολοκλήρωση συγκομιδής και καθαρισμός ελαιώνα', priority: 'HIGH', timing: 'Αρχές μήνα', duration: '2 ώρες ανά δέντρο', tools: ['Σάρωθρα', 'Δίχτυα'] },
    
    // DECEMBER
    { month: 12, taskType: 'GENERAL_CARE', title: 'Χειμερινή προστασία', description: 'Προετοιμασία δέντρων για χειμώνα και προστασία από παγετό', priority: 'MEDIUM', timing: 'Μέσα μήνα', duration: '30 λεπτά ανά δέντρο', tools: ['Κάλυμμα', 'Αντιπαγετικά'] }
  ]

  for (const task of tasks) {
    await prisma.monthlyTask.upsert({
      where: {
        varietyId_month_taskType: {
          varietyId,
          month: task.month,
          taskType: task.taskType as any
        }
      },
      update: {},
      create: {
        ...task,
        varietyId,
        weatherConditions: task.temperatureRange ? { idealTemperature: task.temperatureRange } : {},
      }
    })
  }

  console.log(`✅ Created monthly tasks for ${varietyName}`)
}

async function createRiskFactors(koroneikiId: string, kalamataId: string, chondroliaId: string) {
  const riskFactors = [
    {
      varietyIds: [koroneikiId, kalamataId, chondroliaId],
      riskType: 'WEATHER',
      title: 'Παγετός άνοιξης',
      description: 'Κίνδυνος παγετού κατά την άνθιση που μπορεί να καταστρέψει την παραγωγή',
      severity: 'SEVERE',
      seasonality: ['Μάρτιος', 'Απρίλιος'],
      triggers: { temperature: 'Κάτω από 0°C', timing: 'Κατά την άνθιση' },
      prevention: 'Χρήση αντιπαγετικών, κάλυμμα δέντρων, καπνιστήρες',
      treatment: 'Άμεση αφαίρεση κατεστραμμένων ανθέων και κλαδιών'
    },
    {
      varietyIds: [koroneikiId, kalamataId, chondroliaId],
      riskType: 'PEST',
      title: 'Δάκος ελιάς',
      description: 'Το κυριότερο παράσιτο της ελιάς που προσβάλλει τους καρπούς',
      severity: 'HIGH',
      seasonality: ['Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος'],
      triggers: { temperature: '20-30°C', humidity: 'Υψηλή υγρασία' },
      prevention: 'Παγίδες φερομονών, βιολογικός έλεγχος, καθαρό περιβάλλον',
      treatment: 'Στοχευμένοι ψεκασμοί, αφαίρεση προσβεβλημένων καρπών'
    }
  ]

  for (const risk of riskFactors) {
    for (const varietyId of risk.varietyIds) {
      await prisma.riskFactor.create({
        data: {
          varietyId,
          riskType: risk.riskType as any,
          title: risk.title,
          description: risk.description,
          severity: risk.severity as any,
          seasonality: risk.seasonality,
          triggers: risk.triggers,
          prevention: risk.prevention,
          treatment: risk.treatment
        }
      })
    }
  }

  console.log('✅ Created risk factors for all varieties')
}

async function createCareGuidelines(koroneikiId: string, kalamataId: string, chondroliaId: string) {
  const guidelines = [
    {
      varietyIds: [koroneikiId, kalamataId, chondroliaId],
      category: 'WATERING',
      title: 'Σωστό πότισμα ελιάς',
      content: 'Η ελιά χρειάζεται βαθύ και αραιό πότισμα. Ποτίστε 1-2 φορές την εβδομάδα το καλοκαίρι με μεγάλη ποσότητα νερού.',
      importance: 'HIGH',
      seasonality: ['Άνοιξη', 'Καλοκαίρι']
    },
    {
      varietyIds: [koroneikiId, kalamataId, chondroliaId],
      category: 'PRUNING',
      title: 'Κλάδεμα για καλύτερη παραγωγή',
      content: 'Κλαδέψτε τα δέντρα το χειμώνα για να διαμορφώσετε την κόμη και να αφαιρέσετε τους άρρωστους κλάδους.',
      importance: 'HIGH',
      seasonality: ['Χειμώνας']
    }
  ]

  for (const guideline of guidelines) {
    for (const varietyId of guideline.varietyIds) {
      await prisma.careGuideline.create({
        data: {
          varietyId,
          category: guideline.category as any,
          title: guideline.title,
          content: guideline.content,
          importance: guideline.importance as any,
          seasonality: guideline.seasonality
        }
      })
    }
  }

  console.log('✅ Created care guidelines for all varieties')
}

// Run the seeding
seedOliveVarieties()
  .catch((e) => {
    console.error('❌ Error seeding varieties:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 