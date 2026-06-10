-- Track how many samples are folded into each day's weather record so the
-- stored values are true daily averages rather than a single reading.
ALTER TABLE "weather_records"
  ADD COLUMN IF NOT EXISTS "sampleCount" INTEGER NOT NULL DEFAULT 1;
