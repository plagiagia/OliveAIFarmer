# OliveLog (ΕλαιοLog)

A Greek-language web application for managing olive groves: farms, trees, activities, harvests, analytics, mapping, exports, and optional AI/Weather/Satellite insights.

![Next.js](https://img.shields.io/badge/Next.js-14.2.25-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-00D9FF?style=flat-square&logo=postgresql)
![Mapbox](https://img.shields.io/badge/Mapbox-GL-000000?style=flat-square&logo=mapbox)

## Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Cron Jobs](#cron-jobs)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment](#deployment)

## Features

- Authentication via Clerk
- Farm management (create/edit/delete, location + coordinates)
- Activity logging (with calendar view) and basic cost tracking
- Harvest tracking (collections, yield + pricing)
- Analytics dashboard (farms, activities, harvest performance)
- Mapbox-powered workflows (satellite view, autocomplete, previews)
- Export (CSV + PDF)
- Progressive Web App (offline fallback + caching)
- Optional integrations:
  - OpenWeatherMap: weather intelligence + history
  - Copernicus Data Space: satellite indices (NDVI/NDMI/etc.)
  - OpenAI: “AI Γεωπόνος” insights

## Tech Stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS
- Prisma + PostgreSQL (Neon or any Postgres)
- Clerk (auth)
- Mapbox GL
- Vercel Blob (uploads), Vercel Cron (scheduled jobs)
- Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js `>= 18`
- A PostgreSQL database (`DATABASE_URL`)
- API keys for the integrations you want to enable (Clerk / Mapbox / etc.)

### Setup

```bash
# Install dependencies
npm install

# Create local environment file
cp .env.example .env.local

# Generate Prisma client
npm run db:generate

# Apply migrations (recommended)
npm run db:migrate

# Optional: seed example data
npm run db:seed

# Start dev server
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill the values.

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | yes | PostgreSQL connection (Prisma) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | yes | Clerk auth (client) |
| `CLERK_SECRET_KEY` | yes | Clerk auth (server) |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | yes | Maps + geocoding |
| `BLOB_READ_WRITE_TOKEN` | no* | Photo uploads (required if using uploads) |
| `OPENWEATHER_API_KEY` | no | Weather intelligence + cron weather history |
| `CRON_SECRET` | prod | Protects `/api/cron/*` endpoints in production |
| `OPENAI_API_KEY` | no | AI insights (“AI Γεωπόνος”) |
| `COPERNICUS_CLIENT_ID` | no | Satellite data |
| `COPERNICUS_CLIENT_SECRET` | no | Satellite data |

Optional Clerk route overrides:

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (default: `/sign-in`)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (default: `/sign-up`)

## Database

Local development:

- `npm run db:migrate` (recommended) applies migrations with Prisma Migrate
- `npm run db:push` pushes schema directly (useful for quick prototyping)

Production:

- `npm run db:deploy` applies existing migrations (`prisma migrate deploy`)

Note: `npm run build` does **not** mutate your database.

## Cron Jobs

This repo includes Vercel cron schedules in `vercel.json`:

- Weather job: `GET /api/cron/weather` (daily at `06:00`)
- Satellite job: `GET /api/cron/satellite` (weekly on Sunday at `07:00`)

In production, both endpoints require:

- Header `Authorization: Bearer $CRON_SECRET`

## Project Structure

```
src/
├── app/
│   ├── api/                 # Route handlers (server)
│   │   ├── activities/
│   │   ├── analytics/
│   │   ├── cron/
│   │   ├── export/
│   │   ├── farms/
│   │   ├── harvests/
│   │   ├── insights/
│   │   ├── satellite/
│   │   ├── sync-user/
│   │   ├── upload/
│   │   └── weather/
│   ├── dashboard/           # App pages
│   └── offline/             # Offline fallback page
├── components/              # UI + feature components
├── hooks/                   # Custom hooks
├── lib/                     # Server/client utilities
├── test/                    # Tests
└── types/                   # TypeScript types

prisma/
├── migrations/
├── schema.prisma
└── scripts/
```

## Scripts

```bash
# Dev / build
npm run dev
npm run build
npm run start

# Database
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:push
npm run db:studio
npm run db:seed

# Quality / testing
npm run lint
npm run type-check
npm run test
npm run test:run
npm run test:coverage
```

## Testing

```bash
npm run test:run
```

## Deployment

Vercel is the easiest path (Next.js + cron + Blob integration). At minimum:

1. Configure the environment variables from `.env.example`.
2. Ensure migrations are applied (`npm run db:deploy`) during deploy.
3. Configure `CRON_SECRET` so cron endpoints are protected.

---

Support: open a GitHub issue with steps to reproduce + logs (server + browser console).
