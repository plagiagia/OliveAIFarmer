-- Product refocus: remove satellite (Copernicus) storage, diaspora viewer
-- seats, and collapse the plan ladder to FREE + GROWER (Pro).

-- 1. Satellite data
DROP TABLE IF EXISTS "satellite_data";
DROP TYPE IF EXISTS "StressLevel";
DROP TYPE IF EXISTS "SatelliteSource";

-- 2. Diaspora viewer seats
DROP TABLE IF EXISTS "grove_viewers";
ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "viewerSeatCount";

-- 3. Collapse plans: legacy PRODUCER/MILL subscribers keep paid features as GROWER
UPDATE "subscriptions" SET "plan" = 'GROWER' WHERE "plan" IN ('PRODUCER', 'MILL');

CREATE TYPE "Plan_new" AS ENUM ('FREE', 'GROWER');
ALTER TABLE "subscriptions" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "subscriptions" ALTER COLUMN "plan" TYPE "Plan_new" USING ("plan"::text::"Plan_new");
DROP TYPE "Plan";
ALTER TYPE "Plan_new" RENAME TO "Plan";
ALTER TABLE "subscriptions" ALTER COLUMN "plan" SET DEFAULT 'FREE';
