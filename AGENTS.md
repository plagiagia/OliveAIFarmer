# OliveLog — Agent Instructions

This repo includes persistent AI context so agents don't re-explover the codebase every session.

## Start here

1. **Always-on rule**: `.cursor/rules/olivelog-core.mdc` — stack, file map, conventions (~40 lines)
2. **Deep guide**: `.cursor/skills/olivelog/SKILL.md` — task workflows, patterns, anti-patterns
3. **Lookup tables**: `.cursor/skills/olivelog/reference.md` — API/page/component maps

## Working efficiently

- Match existing patterns in the file you're editing before inventing new ones
- Use targeted search (`grep` model/route name) instead of broad exploration
- Extend `src/env.ts` for new environment variables
- Plan limits live only in `src/lib/plans.ts`
- User-facing strings: Greek; keep consistent with `src/lib/errors.ts`

## Database & Neon MCP

**Neon project for this app:** GroveWise (`orange-haze-64565597`).

When running migrations or inspecting the DB:

1. Use the **Neon MCP** server (`plugin-neon-postgres-neon`) if `DATABASE_URL` is not in the shell (common: credentials only in `.env.local`, while Prisma reads `.env`).
2. Read tool schemas in `mcps/plugin-neon-postgres-neon/tools/` before calling.
3. Full workflow: `.cursor/skills/olivelog/SKILL.md` → section **Database migrations (Neon MCP)**.

Quick checks:

- `list_projects` → confirm GroveWise project ID
- `run_sql` → `SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;`
- Apply new DDL via `prepare_database_migration` + `complete_database_migration`, or `run_sql` on main if migration already recorded

Always commit a matching file under `prisma/migrations/` when changing `schema.prisma`.

## Stripe billing

Architecture, local CLI setup, Vercel webhooks, and production cutover: **`docs/STRIPE.md`**.

Quick local loop: `stripe login` → `npm run stripe:listen` (terminal 2) → set `STRIPE_WEBHOOK_SECRET` + `STRIPE_SECRET_KEY` in `.env.local` → restart `npm run dev`. Without webhooks, checkout succeeds but plan stays FREE.

Cursor rule when editing Stripe code: `.cursor/rules/stripe-billing.mdc`.

## Verify changes

```bash
npm run type-check
npm run test:run
npm run lint
```
