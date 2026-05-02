-- Harvests are collection rows; the app groups them by farm/year as a season.
-- Drop the old farm/year uniqueness if any environment already applied it.
ALTER TABLE "harvests" DROP CONSTRAINT IF EXISTS "harvests_farmId_year_key";
DROP INDEX IF EXISTS "harvests_farmId_year_key";

CREATE INDEX IF NOT EXISTS "harvests_farmId_year_completed_idx" ON "harvests" ("farmId", "year", "completed");
CREATE INDEX IF NOT EXISTS "harvests_farmId_collectionDate_idx" ON "harvests" ("farmId", "collectionDate");
