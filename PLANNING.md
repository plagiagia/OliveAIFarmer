# 🌱 Olive Variety Knowledge Base - Planning Document

## 🎯 **Project Overview**

Create an intelligent knowledge base for Greek olive varieties that provides personalized recommendations, seasonal calendars, and smart notifications based on:

- Variety-specific needs and characteristics
- Weather conditions
- Seasonal timing
- Farm-specific context

## 📊 **Database Schema Design**

### **New Models to Add**

```prisma
// Olive variety master data
model OliveVariety {
  id                String   @id @default(cuid())
  name              String   @unique // e.g., "Κορωνέικη"
  scientificName    String?  // e.g., "Olea europaea var. Koroneiki"
  alternativeNames  String[] // Alternative regional names
  primaryRegions    String[] // Main growing regions in Greece

  // Characteristics
  treeSize          TreeSizeCategory
  fruitType         FruitType        // OIL, TABLE, DUAL
  oilContent        Float?           // Oil percentage (for oil varieties)
  maturityPeriod    String           // e.g., "Οκτώβριος-Νοέμβριος"

  // Yield & Production
  avgYieldPerTree   Float?           // kg per tree
  avgYieldPerStremma Float?          // kg per stremma
  productionStart   Int?             // Years until first production
  peakProduction    Int?             // Years to reach peak

  // Quality characteristics
  oilQuality        String?          // Quality description
  flavor            String?          // Flavor profile
  storageLife       String?          // Storage characteristics

  // Climate & Environment
  climateNeeds      Json             // Climate requirements
  soilNeeds         Json             // Soil requirements
  waterNeeds        WaterNeedsLevel
  sunlightNeeds     SunlightLevel
  windTolerance     ToleranceLevel

  // Disease & Pest resistance
  diseaseResistance Json             // Disease resistance levels
  pestResistance    Json             // Pest resistance levels

  // Care requirements
  pruningNeeds      PruningLevel
  fertilizingNeeds  FertilizingLevel
  irrigationNeeds   IrrigationLevel

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  monthlyTasks      MonthlyTask[]
  riskFactors       RiskFactor[]
  careGuidelines    CareGuideline[]
  trees             OliveTree[]

  @@map("olive_varieties")
}

// Monthly care calendar for each variety
model MonthlyTask {
  id          String      @id @default(cuid())
  month       Int         // 1-12
  taskType    TaskType
  title       String      // e.g., "Κλάδεμα χειμερινό"
  description String
  priority    Priority
  timing      String?     // e.g., "Αρχές μήνα", "Μέσα μήνα"
  duration    String?     // Expected duration
  tools       String[]    // Required tools
  notes       String?     // Additional notes

  // Weather dependencies
  weatherConditions Json? // Ideal weather for this task
  temperatureRange  String? // e.g., "5-15°C"

  varietyId   String
  variety     OliveVariety @relation(fields: [varietyId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([varietyId, month, taskType])
  @@map("monthly_tasks")
}

// Risk factors and warnings for each variety
model RiskFactor {
  id            String        @id @default(cuid())
  riskType      RiskType
  title         String        // e.g., "Παγετός άνοιξης"
  description   String
  severity      SeverityLevel
  seasonality   String[]      // Months when risk is high

  // Conditions that trigger this risk
  triggers      Json          // Weather/environmental triggers
  prevention    String        // Prevention measures
  treatment     String?       // Treatment if occurs

  varietyId     String
  variety       OliveVariety @relation(fields: [varietyId], references: [id], onDelete: Cascade)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("risk_factors")
}

// Care guidelines and tips
model CareGuideline {
  id          String          @id @default(cuid())
  category    GuidelineCategory
  title       String
  content     String          // Detailed guidance
  importance  Priority
  seasonality String[]        // When applicable

  // Interactive elements
  hasImages   Boolean @default(false)
  hasVideo    Boolean @default(false)
  hasSteps    Boolean @default(false)
  steps       Json?           // Step-by-step instructions

  varietyId   String
  variety     OliveVariety @relation(fields: [varietyId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("care_guidelines")
}

// Smart recommendations based on context
model SmartRecommendation {
  id              String             @id @default(cuid())
  type            RecommendationType
  title           String
  message         String
  actionRequired  Boolean @default(false)
  urgency         Priority

  // Trigger conditions
  triggerConditions Json             // Complex conditions
  validFrom       DateTime
  validUntil      DateTime?

  // Context
  farmId          String?
  varietyId       String?
  weatherBased    Boolean @default(false)
  seasonBased     Boolean @default(false)

  // Tracking
  isRead          Boolean @default(false)
  isActioned      Boolean @default(false)
  readAt          DateTime?
  actionedAt      DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  farm            Farm? @relation(fields: [farmId], references: [id], onDelete: Cascade)
  variety         OliveVariety? @relation(fields: [varietyId], references: [id])

  @@map("smart_recommendations")
}

// New enums
enum TreeSizeCategory {
  SMALL    // Μικρό
  MEDIUM   // Μεσαίο
  LARGE    // Μεγάλο
}

enum FruitType {
  OIL      // Ελαιοπαραγωγικό
  TABLE    // Επιτραπέζιο
  DUAL     // Διπλής χρήσης
}

enum WaterNeedsLevel {
  LOW      // Χαμηλές
  MEDIUM   // Μέτριες
  HIGH     // Υψηλές
}

enum SunlightLevel {
  PARTIAL  // Μερική
  FULL     // Πλήρης
}

enum ToleranceLevel {
  LOW      // Χαμηλή
  MEDIUM   // Μέτρια
  HIGH     // Υψηλή
}

enum PruningLevel {
  MINIMAL  // Ελάχιστο
  MODERATE // Μέτριο
  INTENSIVE // Εντατικό
}

enum FertilizingLevel {
  LOW      // Χαμηλές
  MEDIUM   // Μέτριες
  HIGH     // Υψηλές
}

enum IrrigationLevel {
  MINIMAL  // Ελάχιστο
  REGULAR  // Τακτικό
  INTENSIVE // Εντατικό
}

enum TaskType {
  PRUNING           // Κλάδεμα
  WATERING          // Πότισμα
  FERTILIZING       // Λίπανση
  PEST_CONTROL      // Έλεγχος παρασίτων
  DISEASE_PREVENTION // Πρόληψη ασθενειών
  SOIL_PREPARATION  // Προετοιμασία εδάφους
  HARVESTING        // Συγκομιδή
  MONITORING        // Παρακολούθηση
  GENERAL_CARE      // Γενική φροντίδα
}

enum Priority {
  LOW      // Χαμηλή
  MEDIUM   // Μέτρια
  HIGH     // Υψηλή
  CRITICAL // Κρίσιμη
}

enum RiskType {
  DISEASE          // Ασθένεια
  PEST             // Παράσιτο
  WEATHER          // Καιρικό φαινόμενο
  ENVIRONMENTAL    // Περιβαλλοντικό
  SEASONAL         // Εποχιακό
}

enum SeverityLevel {
  LOW      // Χαμηλή
  MEDIUM   // Μέτρια
  HIGH     // Υψηλή
  SEVERE   // Σοβαρή
}

enum GuidelineCategory {
  PLANTING         // Φύτευση
  PRUNING          // Κλάδεμα
  WATERING         // Πότισμα
  FERTILIZING      // Λίπανση
  PEST_MANAGEMENT  // Διαχείριση παρασίτων
  HARVESTING       // Συγκομιδή
  GENERAL_CARE     // Γενική φροντίδα
  TROUBLESHOOTING  // Αντιμετώπιση προβλημάτων
}

enum RecommendationType {
  TASK_REMINDER    // Υπενθύμιση εργασίας
  WEATHER_ALERT    // Καιρική προειδοποίηση
  SEASONAL_TIP     // Εποχιακή συμβουλή
  CARE_SUGGESTION  // Πρόταση φροντίδας
  RISK_WARNING     // Προειδοποίηση κινδύνου
  OPTIMIZATION     // Βελτίωση
}
```

### **Update Existing Models**

```prisma
// Add to existing Farm model
model Farm {
  // ... existing fields ...

  // Add recommendations relation
  recommendations SmartRecommendation[]
}

// Update OliveTree model to reference variety
model OliveTree {
  // ... existing fields ...

  // Enhanced variety reference
  varietyId String?
  varietyInfo OliveVariety? @relation(fields: [varietyId], references: [id])

  // Keep the string variety for backward compatibility
  variety String // Will be migrated to varietyId
}
```

## 📚 **Content Strategy**

### **Phase 1: Core Varieties (Priority)**

**Primary Greek Olive Varieties to Document:**

1. **Κορωνέικη (Koroneiki)** - Most important Greek oil variety
2. **Καλαμών (Kalamata)** - World-famous table olive
3. **Χονδρολιά Χαλκιδικής** - Large table olive
4. **Αμφίσσης (Amfissis)** - Dual-purpose variety
5. **Κολοβή Αίγινας** - Local specialty
6. **Μανάκι Χίου** - Unique to Chios
7. **Τσουνάτη Κέρκυρας** - Corfu specialty
8. **Μαστοειδής** - Oil variety from Dodecanese

### **Data Collection Sources**

**Scientific & Agricultural Sources:**

- Greek Ministry of Agriculture
- Agricultural University of Athens research
- Hellenic Agricultural Organization (ELGO-DIMITRA)
- International Olive Council data
- Regional agricultural cooperatives

**Expert Consultation:**

- Local agricultural engineers
- Experienced olive farmers
- Agricultural cooperatives
- Olive oil producers

### **Content Structure for Each Variety**

**Basic Information:**

- Scientific classification
- Regional names and variations
- Geographic distribution
- Historical significance

**Cultivation Requirements:**

- Climate preferences (temperature, humidity, rainfall)
- Soil requirements (pH, drainage, composition)
- Water needs (drought tolerance, irrigation requirements)
- Sunlight requirements
- Spacing recommendations

**Growth Characteristics:**

- Tree size and shape
- Growth rate
- Production timeline (first fruit, peak production)
- Lifespan and longevity factors

**Production Data:**

- Average yield per tree/stremma
- Oil content (for oil varieties)
- Fruit characteristics (size, shape, color)
- Harvest timing
- Processing recommendations

**Care Calendar:**

- Month-by-month care requirements
- Pruning schedules
- Fertilization timing
- Pest/disease monitoring periods
- Irrigation schedules

**Risk Management:**

- Common diseases and prevention
- Pest vulnerabilities
- Weather risks (frost, drought, wind)
- Environmental stressors

**Quality & Uses:**

- Oil quality characteristics
- Table olive preparation
- Storage requirements
- Market considerations

## 🚀 **Implementation Roadmap**

### **Phase 1: Foundation (Weeks 1-2)**

**Database Schema:**

1. Create new Prisma models
2. Run migration
3. Seed with basic variety data

**Basic UI Components:**

1. Variety selector component
2. Variety information display
3. Basic recommendation system

### **Phase 2: Content Population (Weeks 3-4)**

**Data Entry:**

1. Research and document 8 core varieties
2. Create monthly task calendars
3. Define risk factors
4. Write care guidelines

**Validation:**

1. Expert review of content
2. Accuracy verification
3. Greek language proofreading

### **Phase 3: Smart Features (Weeks 5-6)**

**Recommendation Engine:**

1. Context-aware suggestions
2. Weather integration triggers
3. Seasonal calendar automation
4. Notification system

**User Experience:**

1. Variety comparison tools
2. Personalized dashboards
3. Interactive care calendars
4. Progress tracking

### **Phase 4: Advanced Features (Weeks 7-8)**

**Intelligence Layer:**

1. Machine learning for yield prediction
2. Weather pattern analysis
3. Regional adaptation recommendations
4. Community knowledge sharing

**Integration:**

1. Weather API integration
2. Agricultural calendar sync
3. Market price integration
4. Expert consultation platform

## 🎯 **User Experience Flow**

### **For New Farmers:**

```
Farm Creation → Variety Selection →
Personalized Welcome → Care Calendar Setup →
First Recommendations
```

### **For Existing Farmers:**

```
Variety Profile → Current Recommendations →
Seasonal Calendar → Weather Alerts →
Care Suggestions
```

### **Daily Farmer Experience:**

```
Morning: Check weather + recommendations
Afternoon: Log activities + receive tips
Evening: Plan tomorrow's tasks
```

## 📊 **Success Metrics**

**Engagement:**

- Daily active users
- Recommendation click-through rates
- Calendar usage
- Task completion rates

**Agricultural Impact:**

- Yield improvements reported
- Problem prevention instances
- Cost savings documented
- Quality improvements

**Content Quality:**

- Expert validation scores
- User feedback ratings
- Accuracy reports
- Update frequency

## 🔮 **Future Enhancements**

**AI-Powered Features:**

- Computer vision for disease detection
- Predictive analytics for optimal timing
- Personalized yield forecasting
- Climate change adaptation advice

**Community Features:**

- Farmer knowledge sharing
- Regional best practices
- Expert Q&A platform
- Cooperative coordination tools

**Advanced Integrations:**

- IoT sensor data
- Satellite imagery analysis
- Market price forecasting
- Supply chain optimization

---

_This knowledge base will transform OliveLog from a simple farm management tool into an intelligent agricultural advisor specifically tailored for Greek olive farming._
