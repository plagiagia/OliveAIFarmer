# App Health Check — April 2, 2026

This document captures a first-pass technical review of the current OliveLog codebase and local quality checks.

## What was checked

- Static analysis: `npm run lint`
- Type safety: `npm run type-check`
- Automated tests: `npm run test:run`

## Results

### 1) Type checking and tests are healthy

- TypeScript compilation passes with no errors.
- Vitest suite passes: 71/71 tests green.

### 2) Lint passes but with notable warnings

`next lint` exits successfully, but reports multiple warnings that should be addressed before wider commercialization.

High-impact warning categories:

- Widespread use of `any` (`@typescript-eslint/no-explicit-any`) across API routes, UI components, and utility layers.
- React Hook dependency warnings (`react-hooks/exhaustive-deps`) in a few components, which can lead to stale data or inconsistent behavior.
- `@next/next/no-img-element` warnings in upload UI that may hurt image performance and Core Web Vitals.

## Commercialization readiness (first pass)

### Current strengths

- Modern, maintainable stack (Next.js + TypeScript + Prisma).
- Clear domain model for farms, activities, harvests, analytics.
- Existing test coverage for core utility logic and selected API behavior.
- Helpful README with setup, env, and deployment notes.

### Risks to address before scaling customer usage

1. **Type-safety debt in production paths**
   - Reduce `any` usage in API and analytics code, especially around external integrations and payload parsing.
2. **Potential data consistency issues in UI effects**
   - Fix missing React Hook dependencies and memoization patterns.
3. **Image/performance optimization**
   - Replace raw `<img>` with `next/image` where practical.
4. **Operational hardening**
   - Add basic SLO/error monitoring (e.g., request failures, cron job failures, upload failures).
   - Add CI gate for `type-check` + `test:run` + `lint` and (ideally) fail on new warnings in touched files.

## Suggested 30-day plan

1. **Week 1:** Lint debt triage + typing cleanup in top traffic routes/components.
2. **Week 2:** Introduce error tracking + alerting for API/cron/upload paths.
3. **Week 3:** Performance pass (images, dashboard rendering hotspots, bundle audit).
4. **Week 4:** Commercial readiness checklist (backups, privacy policy, terms, support workflow, onboarding analytics).

## Commands and outputs

- `npm run lint` → pass with warnings
- `npm run type-check` → pass
- `npm run test:run` → pass (71 tests)

## Phase 2 progress (implemented)

- Hardened `POST /api/upload` input validation:
  - Added allowlist validation for `context`.
  - Added required validation for `contextId`.
  - Mapped output extension from MIME type instead of trusting filename input.
- Hardened `DELETE /api/upload` authorization check:
  - Replaced loose `url.includes(userId)` check with strict URL parsing and host/path ownership verification for Vercel Blob URLs.
