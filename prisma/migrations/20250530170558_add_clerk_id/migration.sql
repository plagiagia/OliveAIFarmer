-- Historical production migration restored for source-controlled replay.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clerkId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_clerkId_key" ON "users" ("clerkId");

-- Production has this column as NOT NULL. Keep the statement idempotent for
-- databases that already started from the current-schema baseline.
ALTER TABLE "users" ALTER COLUMN "clerkId" SET NOT NULL;