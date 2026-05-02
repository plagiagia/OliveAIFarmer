# OliveLog Review Findings - 2026-05-02

This document consolidates the local code review plus the Vercel/Neon checks so the remaining work is easy to track.

## Current Status

- Latest committed fix: `9350997 Remove AI image upload feature`.
- Current workspace fix: harvest model/migration drift resolved locally; production migration has not been applied yet.
- Vercel production deployment for that commit is `READY` and aliased to `olive-ai-farmer.vercel.app`.
- No Neon schema/data changes were made during the AI image removal.
- All checks after the removal passed locally: `type-check`, `test:run`, `lint`, and `build`.

## Fixed

### AI Image Recognition And Upload

Status: done.

The AI image diagnosis and upload feature was removed end to end:

- Removed `/api/diagnose` and `/api/upload` route handlers.
- Removed the upload UI components.
- Removed OpenAI vision helpers and diagnosis schemas.
- Removed Vercel Blob configuration, docs, and dependency.
- Removed `BLOB_READ_WRITE_TOKEN` and `OPENAI_VISION_MODEL` from app-level env validation/examples.

Follow-up outside the repo:

- Remove `BLOB_READ_WRITE_TOKEN` and `OPENAI_VISION_MODEL` from Vercel project environment variables.
- Delete/disconnect the Vercel Blob store if this app was the only consumer.

### Harvest Model And Migration Drift

Status: fixed in workspace.

The app now treats `Harvest` as a collection row, and the UI/API group those rows by farm/year as a harvest season.

- Removed the `@@unique([farmId, year])` constraint from the Prisma schema.
- Updated the pending performance-index migration so it no longer tries to add farm/year uniqueness.
- Added a follow-up migration that drops the old uniqueness if any environment already applied it.
- Added collection-friendly harvest indexes.
- Updated the harvest create API to write `collectionDate` directly through Prisma.
- Added an API regression test for collection-row creation.

Production note:

- Neon currently has one harvest row, no duplicate farm/year groups, and no farm/year unique constraint.
- The migration SQL was tested successfully on temporary Neon branch `br-icy-sky-a92abxef`, then that branch was deleted.
- The production database still needs the normal migration reconciliation/deploy flow before this workspace fix is live there.

## Remaining Findings

### 1. Production Database Migration Drift

Severity: high.

Neon project `GroveWise` main has migration history that does not match the workspace:

- Live Neon has `20250530170558_add_clerk_id`.
- Live Neon has `20250628000000_add_weather_history`.
- Live Neon has `20260418120000_add_ai_usage_archive_geo`.
- The workspace contains `20260418000000_add_indexes_and_harvest_unique`, but Neon has not applied it.
- The live `20250628000000_add_weather_history` migration was not visible in the workspace migration list.

Recommended fix:

- Reconcile migration history before adding automatic deploy migrations.
- Keep the harvest collection migration in the reconciliation plan.
- Bring the missing migration files/schema history back into source control or mark the live-only migration state intentionally.

### 2. Vercel Deploy Does Not Run Database Migrations

Severity: high.

Vercel is building with `npm run build`, and the repo build script is `prisma generate && next build`. Build logs did not show `prisma migrate deploy`. This explains why production schema drift can persist.

Recommended fix:

- Do not add migration deploy blindly yet.
- First reconcile the migration history now that the harvest model decision is fixed in the workspace.
- Then update the production deploy flow to run migrations in a controlled way, for example a prebuild/deploy step that runs `prisma migrate deploy` against the pooled production database.

### 3. Missing Production Indexes

Severity: medium.

Because the missing migration was not applied, production is also missing several supporting indexes for farms, activities, harvests, smart recommendations, and related lookups.

Current impact:

- Data volume is still small.
- `pg_stat_statements` did not show an application query hotspot.

Risk:

- Query performance will degrade as usage grows.
- Fixing this should be part of the migration reconciliation work.

### 4. Neon Main Branch Is Not Protected

Severity: medium.

The production Neon branch `br-rapid-field-a98oxlrz` is marked as not protected.

Recommended fix:

- Enable branch protection for the production database before making migration workflows more automatic.

### 5. Vercel Node Version Is Floating To 24.x

Severity: low to medium.

Vercel reports Node `24.x`. The repo only declares `"node": ">=18.0.0"`, so Vercel can keep auto-upgrading major Node versions.

Recommended fix:

- Pin a stable major runtime, preferably Node 20 or Node 22, in `package.json` and/or Vercel project settings.

### 6. API Rate Limits Are Not Distributed

Severity: medium.

The app has an Upstash-capable async limiter, but some AI/cost-sensitive routes use the in-memory `checkRateLimit`. On Vercel serverless, in-memory limits are per instance, so the real production cap can be higher than intended.

Recommended fix:

- Switch AI and other cost-sensitive routes to the async distributed limiter.
- In production, fail closed or warn loudly if Upstash is not configured.

### 7. Dashboard Page Auth Is Inconsistent

Severity: medium.

Some dashboard pages redirect server-side when signed out, while the main dashboard and analytics surfaces depend on client/API behavior after rendering. APIs still protect data, so this is not a direct data leak, but the page access policy is inconsistent and creates confusing signed-out UX.

Recommended fix:

- Enforce dashboard auth in a dashboard layout or Clerk route matcher middleware.
- Keep individual API auth checks as defense in depth.

### 8. Manual Satellite Refresh Can Fail On Duplicate Dates

Severity: medium.

Satellite data is unique by farm/date/source. The GET refresh path uses an upsert-style helper, but the manual POST path creates directly. If Copernicus returns the same observation date on retry, the manual route can throw a unique constraint error.

Recommended fix:

- Make manual POST use the same upsert/save helper as GET.

### 9. Coordinates Are Split Between Legacy Text And Structured Columns

Severity: low to medium.

Cloud checks showed all 20 farms have legacy text `coordinates`, while structured `latitude` and `longitude` are empty. Some code still parses text coordinates; newer schema fields exist but are not populated.

Recommended fix:

- Write structured latitude/longitude on create/update.
- Backfill existing farms from valid legacy coordinates.
- Gradually move weather/satellite code to structured coordinates with text parsing as a fallback.

### 10. TypeScript 7 Future Warning

Severity: low.

VS Code reports `baseUrl` in `tsconfig.json` as deprecated for TypeScript 7. The repo's current CLI type check passes today.

Recommended fix:

- Add `ignoreDeprecations` for now or plan the TypeScript 7 migration later.

## Healthy Signals

- Vercel production deployment is ready after the AI image/upload removal.
- Runtime logs had no warning/error/fatal events in the checked 24-hour window.
- Unauthenticated weather/cron smoke requests returned `401`, which is expected.
- Neon is in a nearby region for the Vercel Frankfurt deployment.
- The app uses a pooled Neon database host.
- Local verification passed after the image/upload removal.

## Suggested Fix Order

1. Clean Vercel env vars for removed AI image/upload feature.
2. Reconcile Prisma migration history between repo and Neon.
3. Apply safe index/schema migrations to production.
4. Add controlled migration execution to deployment.
5. Protect the Neon production branch.
6. Pin Node runtime.
7. Fix distributed rate limiting for cost-sensitive routes.
8. Normalize dashboard auth enforcement.
9. Fix satellite manual refresh upsert behavior.
10. Backfill and standardize farm coordinates.
