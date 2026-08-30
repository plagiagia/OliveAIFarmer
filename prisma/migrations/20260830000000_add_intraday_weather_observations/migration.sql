-- Store timestamped weather samples so daily averages are based on
-- observations collected throughout the day rather than one reading.
ALTER TYPE "WeatherDataSource" ADD VALUE IF NOT EXISTS 'CRON_INTRADAY';

CREATE TABLE "weather_observations" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sampleSlot" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" INTEGER NOT NULL,
    "rainfall" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "windGust" DOUBLE PRECISION,
    "windDirection" INTEGER,
    "pressure" INTEGER,
    "clouds" INTEGER,
    "condition" TEXT NOT NULL,
    "icon" TEXT,
    "source" "WeatherDataSource" NOT NULL DEFAULT 'API_CURRENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weather_observations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "weather_observations_farmId_date_sampleSlot_key"
    ON "weather_observations"("farmId", "date", "sampleSlot");
CREATE INDEX "weather_observations_farmId_date_idx"
    ON "weather_observations"("farmId", "date");
CREATE INDEX "weather_observations_observedAt_idx"
    ON "weather_observations"("observedAt");

ALTER TABLE "weather_observations"
    ADD CONSTRAINT "weather_observations_farmId_fkey"
    FOREIGN KEY ("farmId") REFERENCES "farms"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
