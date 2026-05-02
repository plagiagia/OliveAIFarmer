-- Add structured coordinates + optional GeoJSON polygon for per-zone NDVI later.
ALTER TABLE "farms" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "farms" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "farms" ADD COLUMN IF NOT EXISTS "polygon" JSONB;

-- Soft-archive AI insights instead of deleting on regeneration; add 24h context-hash cache key.
ALTER TABLE "smart_recommendations" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "smart_recommendations" ADD COLUMN IF NOT EXISTS "contextHash" TEXT;

CREATE INDEX IF NOT EXISTS "smart_recommendations_farmId_isArchived_idx" ON "smart_recommendations"("farmId", "isArchived");
CREATE INDEX IF NOT EXISTS "smart_recommendations_contextHash_idx" ON "smart_recommendations"("contextHash");

-- Token usage ledger for OpenAI calls (per-user monthly budget enforcement + auditing).
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

CREATE INDEX IF NOT EXISTS "ai_usage_userId_createdAt_idx" ON "ai_usage"("userId", "createdAt");
