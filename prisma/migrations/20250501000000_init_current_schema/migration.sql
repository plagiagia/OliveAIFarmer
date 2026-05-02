-- Baseline schema for OliveLog.
-- This migration is intentionally idempotent because production was originally
-- built through a mixture of db push/manual migrations before all migration
-- files were committed.

DO $$ BEGIN
  CREATE TYPE "ActivityType" AS ENUM ('WATERING', 'PRUNING', 'FERTILIZING', 'PEST_CONTROL', 'SOIL_WORK', 'HARVESTING', 'MAINTENANCE', 'INSPECTION', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PriceUnit" AS ENUM ('PER_KG', 'PER_TON', 'PER_LITER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RecommendationType" AS ENUM ('TASK_REMINDER', 'WEATHER_ALERT', 'SEASONAL_TIP', 'CARE_SUGGESTION', 'RISK_WARNING', 'OPTIMIZATION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InsightSource" AS ENUM ('RULE_BASED', 'AI_GENERATED', 'WEATHER_ALERT', 'USER_CREATED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "WeatherDataSource" AS ENUM ('API_CURRENT', 'API_FORECAST', 'CRON_DAILY', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StressLevel" AS ENUM ('HEALTHY', 'MILD_STRESS', 'MODERATE_STRESS', 'SEVERE_STRESS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SatelliteSource" AS ENUM ('SENTINEL_1', 'SENTINEL_2', 'SENTINEL_3');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL,
  "clerkId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "farms" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "coordinates" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "polygon" JSONB,
  "totalArea" DOUBLE PRECISION,
  "treeCount" INTEGER,
  "oliveVariety" TEXT,
  "treeAge" INTEGER,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "activities" (
  "id" TEXT NOT NULL,
  "type" "ActivityType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "duration" INTEGER,
  "cost" DOUBLE PRECISION,
  "weather" TEXT,
  "notes" TEXT,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "farmId" TEXT NOT NULL,
  CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "harvests" (
  "id" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "collectionDate" TIMESTAMP(3),
  "totalYield" DOUBLE PRECISION,
  "totalYieldTons" DOUBLE PRECISION,
  "pricePerKg" DOUBLE PRECISION,
  "pricePerTon" DOUBLE PRECISION,
  "priceUnit" "PriceUnit" NOT NULL DEFAULT 'PER_KG',
  "totalValue" DOUBLE PRECISION,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "yieldPerTree" DOUBLE PRECISION,
  "yieldPerStremma" DOUBLE PRECISION,
  "notes" TEXT,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "farmId" TEXT NOT NULL,
  CONSTRAINT "harvests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "smart_recommendations" (
  "id" TEXT NOT NULL,
  "type" "RecommendationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "actionRequired" BOOLEAN NOT NULL DEFAULT false,
  "urgency" "Priority" NOT NULL,
  "source" "InsightSource" NOT NULL DEFAULT 'RULE_BASED',
  "reasoning" TEXT,
  "triggerConditions" JSONB,
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validUntil" TIMESTAMP(3),
  "farmId" TEXT,
  "weatherBased" BOOLEAN NOT NULL DEFAULT false,
  "seasonBased" BOOLEAN NOT NULL DEFAULT false,
  "contextHash" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "isActioned" BOOLEAN NOT NULL DEFAULT false,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "actionedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "smart_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_usage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "promptTokens" INTEGER NOT NULL DEFAULT 0,
  "completionTokens" INTEGER NOT NULL DEFAULT 0,
  "totalTokens" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "weather_records" (
  "id" TEXT NOT NULL,
  "farmId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tempHigh" DOUBLE PRECISION NOT NULL,
  "tempLow" DOUBLE PRECISION NOT NULL,
  "tempAvg" DOUBLE PRECISION NOT NULL,
  "humidity" INTEGER NOT NULL,
  "rainfall" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "windSpeed" DOUBLE PRECISION NOT NULL,
  "windGust" DOUBLE PRECISION,
  "windDirection" INTEGER,
  "pressure" INTEGER,
  "clouds" INTEGER,
  "uvIndex" DOUBLE PRECISION,
  "condition" TEXT NOT NULL,
  "icon" TEXT,
  "source" "WeatherDataSource" NOT NULL DEFAULT 'API_CURRENT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "weather_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "satellite_data" (
  "id" TEXT NOT NULL,
  "farmId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ndvi" DOUBLE PRECISION,
  "ndmi" DOUBLE PRECISION,
  "evi" DOUBLE PRECISION,
  "healthScore" INTEGER,
  "stressLevel" "StressLevel",
  "soilMoisture" DOUBLE PRECISION,
  "cloudCoverage" DOUBLE PRECISION,
  "source" "SatelliteSource" NOT NULL DEFAULT 'SENTINEL_2',
  "resolution" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "satellite_data_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_clerkId_key" ON "users"("clerkId");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "farms_userId_idx" ON "farms"("userId");
CREATE INDEX IF NOT EXISTS "activities_farmId_idx" ON "activities"("farmId");
CREATE INDEX IF NOT EXISTS "activities_farmId_date_idx" ON "activities"("farmId", "date");
CREATE INDEX IF NOT EXISTS "harvests_farmId_idx" ON "harvests"("farmId");
CREATE INDEX IF NOT EXISTS "harvests_farmId_year_idx" ON "harvests"("farmId", "year");
CREATE INDEX IF NOT EXISTS "harvests_farmId_year_completed_idx" ON "harvests"("farmId", "year", "completed");
CREATE INDEX IF NOT EXISTS "harvests_farmId_collectionDate_idx" ON "harvests"("farmId", "collectionDate");
CREATE INDEX IF NOT EXISTS "smart_recommendations_farmId_idx" ON "smart_recommendations"("farmId");
CREATE INDEX IF NOT EXISTS "smart_recommendations_farmId_validUntil_idx" ON "smart_recommendations"("farmId", "validUntil");
CREATE INDEX IF NOT EXISTS "smart_recommendations_farmId_isRead_idx" ON "smart_recommendations"("farmId", "isRead");
CREATE INDEX IF NOT EXISTS "smart_recommendations_farmId_isArchived_idx" ON "smart_recommendations"("farmId", "isArchived");
CREATE INDEX IF NOT EXISTS "smart_recommendations_contextHash_idx" ON "smart_recommendations"("contextHash");
CREATE INDEX IF NOT EXISTS "ai_usage_userId_createdAt_idx" ON "ai_usage"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "weather_records_farmId_idx" ON "weather_records"("farmId");
CREATE INDEX IF NOT EXISTS "weather_records_date_idx" ON "weather_records"("date");
CREATE INDEX IF NOT EXISTS "weather_records_farmId_date_idx" ON "weather_records"("farmId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "weather_records_farmId_date_key" ON "weather_records"("farmId", "date");
CREATE INDEX IF NOT EXISTS "satellite_data_farmId_idx" ON "satellite_data"("farmId");
CREATE INDEX IF NOT EXISTS "satellite_data_date_idx" ON "satellite_data"("date");
CREATE INDEX IF NOT EXISTS "satellite_data_farmId_date_idx" ON "satellite_data"("farmId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "satellite_data_farmId_date_source_key" ON "satellite_data"("farmId", "date", "source");

DO $$ BEGIN
  ALTER TABLE "farms" ADD CONSTRAINT "farms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "activities" ADD CONSTRAINT "activities_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "harvests" ADD CONSTRAINT "harvests_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "smart_recommendations" ADD CONSTRAINT "smart_recommendations_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "weather_records" ADD CONSTRAINT "weather_records_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "satellite_data" ADD CONSTRAINT "satellite_data_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;