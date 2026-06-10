-- Olive fruit fly (δάκος) trap monitoring readings
DO $$ BEGIN
  CREATE TYPE "TrapType" AS ENUM ('MCPHAIL', 'YELLOW_STICKY', 'DACUS_TRAP', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "trap_readings" (
  "id" TEXT NOT NULL,
  "farmId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "trapType" "TrapType" NOT NULL DEFAULT 'MCPHAIL',
  "trapCount" INTEGER NOT NULL DEFAULT 1,
  "totalCatch" INTEGER NOT NULL,
  "femaleCatch" INTEGER,
  "daysSincePrev" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "trap_readings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "trap_readings_farmId_idx" ON "trap_readings" ("farmId");
CREATE INDEX IF NOT EXISTS "trap_readings_farmId_date_idx" ON "trap_readings" ("farmId", "date");

DO $$ BEGIN
  ALTER TABLE "trap_readings" ADD CONSTRAINT "trap_readings_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
