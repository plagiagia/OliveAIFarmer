-- Performance indexes.
-- All statements are idempotent so this migration can be applied even if the
-- production database was previously synced via `prisma db push` (which would
-- have created these objects under different names or not at all).

-- Farm.userId
CREATE INDEX IF NOT EXISTS "farms_userId_idx" ON "farms" ("userId");

-- Activity by farm and (farm, date)
CREATE INDEX IF NOT EXISTS "activities_farmId_idx" ON "activities" ("farmId");
CREATE INDEX IF NOT EXISTS "activities_farmId_date_idx" ON "activities" ("farmId", "date");

-- Harvest supports multiple collection rows per farm/year.
CREATE INDEX IF NOT EXISTS "harvests_farmId_idx" ON "harvests" ("farmId");
CREATE INDEX IF NOT EXISTS "harvests_farmId_year_idx" ON "harvests" ("farmId", "year");

-- SmartRecommendation
CREATE INDEX IF NOT EXISTS "smart_recommendations_farmId_idx" ON "smart_recommendations" ("farmId");
CREATE INDEX IF NOT EXISTS "smart_recommendations_farmId_validUntil_idx" ON "smart_recommendations" ("farmId", "validUntil");
CREATE INDEX IF NOT EXISTS "smart_recommendations_farmId_isRead_idx" ON "smart_recommendations" ("farmId", "isRead");
