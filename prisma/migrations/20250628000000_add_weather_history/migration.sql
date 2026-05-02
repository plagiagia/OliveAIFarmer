-- Historical weather history migration restored for source-controlled replay.
DO $$ BEGIN
  CREATE TYPE "WeatherDataSource" AS ENUM ('API_CURRENT', 'API_FORECAST', 'CRON_DAILY', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
  "condition" TEXT NOT NULL,
  "icon" TEXT,
  "source" "WeatherDataSource" NOT NULL DEFAULT 'API_CURRENT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "windDirection" INTEGER,
  "pressure" INTEGER,
  "clouds" INTEGER,
  "uvIndex" DOUBLE PRECISION,
  CONSTRAINT "weather_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "weather_records_farmId_idx" ON "weather_records" ("farmId");
CREATE INDEX IF NOT EXISTS "weather_records_date_idx" ON "weather_records" ("date");
CREATE INDEX IF NOT EXISTS "weather_records_farmId_date_idx" ON "weather_records" ("farmId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "weather_records_farmId_date_key" ON "weather_records" ("farmId", "date");

DO $$ BEGIN
  ALTER TABLE "weather_records" ADD CONSTRAINT "weather_records_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;