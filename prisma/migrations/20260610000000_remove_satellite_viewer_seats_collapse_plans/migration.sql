-- Product refocus: remove satellite (Copernicus) storage, diaspora viewer
-- seats, and collapse the plan ladder to FREE + GROWER (Pro).

-- 1. Satellite data
DROP TABLE IF EXISTS "satellite_data";
DROP TYPE IF EXISTS "StressLevel";
DROP TYPE IF EXISTS "SatelliteSource";

-- 2. Diaspora viewer seats
DROP TABLE IF EXISTS "grove_viewers";
ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "viewerSeatCount";

-- 3. Collapse plans: legacy PRODUCER/MILL subscribers keep paid features as
--    GROWER. The Postgres enum type intentionally keeps its old values so
--    deployments running the previous code (and any stray writes of legacy
--    values) don't break — the application enum only uses FREE/GROWER.
UPDATE "subscriptions" SET "plan" = 'GROWER' WHERE "plan" IN ('PRODUCER', 'MILL');
