<div align="center">

# 🫒 OliveLog · ΕλαιοLog

**A modern, Greek-language platform for managing olive groves end‑to‑end —
farms, activities, harvests, analytics, mapping, and AI‑assisted agronomy.**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Mapbox](https://img.shields.io/badge/Mapbox-GL-000000?style=flat-square&logo=mapbox&logoColor=white)](https://www.mapbox.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square&logo=clerk&logoColor=white)](https://clerk.com/)
[![License](https://img.shields.io/badge/license-Private-lightgrey?style=flat-square)]()

</div>

---

## 📖 Overview

**OliveLog** is a Progressive Web App built for olive grove owners and agronomists.
It centralises field operations, harvest data and decision‑support tools into a
single workspace — with optional integrations for **weather**, **satellite indices
(NDVI / NDMI)** and an **AI Γεωπόνος** assistant powered by OpenAI.

> The UI is fully localised in **Greek 🇬🇷**, with calendars, units and
> terminology tuned for Mediterranean olive farming.

---

## ✨ Features

| Domain                      | Capabilities                                                  |
| --------------------------- | ------------------------------------------------------------- |
| 🔐 **Authentication**       | Clerk‑based sign‑in, sign‑up and user sync                    |
| 🌳 **Farm management**      | Create, edit, geolocate and visualise olive groves            |
| 📅 **Activities**           | Logging, calendar view, cost tracking                         |
| 🧺 **Harvests**             | Yield, pricing and historical performance                     |
| 📊 **Analytics**            | Charts, heatmaps, year‑over‑year comparisons, recommendations |
| 🗺️ **Mapping**              | Mapbox satellite view, autocomplete, location previews        |
| 📦 **Exports**              | CSV and PDF reports                                           |
| 📲 **PWA**                  | Installable, offline fallback, asset caching                  |
| ☀️ **Weather** _(opt.)_     | OpenWeatherMap forecasts and daily history cron               |
| 🛰️ **Satellite** _(opt.)_   | Copernicus NDVI / NDMI indices, weekly cron                   |
| 🤖 **AI Γεωπόνος** _(opt.)_ | OpenAI‑powered insights and recommendations                   |

---

## 🧱 Tech Stack

- **Framework** — Next.js 14 (App Router), React 18, TypeScript 5
- **Styling** — Tailwind CSS, `class-variance-authority`, Lucide icons
- **Data** — Prisma 5 + PostgreSQL (Neon or any Postgres)
- **Auth** — Clerk
- **Maps** — Mapbox GL, react‑map‑gl, Mapbox Geocoder
- **Charts** — Recharts
- **Storage** — Vercel Blob (photo uploads)
- **Scheduling** — Vercel Cron
- **AI** — OpenAI SDK
- **Testing** — Vitest, Testing Library, jsdom

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `>= 18`
- A **PostgreSQL** database (`DATABASE_URL`)
- API keys for the integrations you want to enable

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Generate the Prisma client
npm run db:generate

# 4. Apply database migrations
npm run db:migrate

# 5. (Optional) seed example data
npm run db:seed

# 6. Start the dev server
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## 🔧 Environment Variables

Copy `.env.example` to `.env.local` and fill the values.

| Variable                            | Required | Purpose                                        |
| ----------------------------------- | :------: | ---------------------------------------------- |
| `DATABASE_URL`                      |    ✅    | PostgreSQL connection (Prisma)                 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |    ✅    | Clerk auth (client)                            |
| `CLERK_SECRET_KEY`                  |    ✅    | Clerk auth (server)                            |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`   |    ✅    | Maps + geocoding                               |
| `BLOB_READ_WRITE_TOKEN`             |    ⚠️    | Photo uploads (required if uploads are used)   |
| `CRON_SECRET`                       | 🛡️ prod  | Protects `/api/cron/*` endpoints in production |
| `OPENWEATHER_API_KEY`               | optional | Weather intelligence + cron weather history    |
| `OPENAI_API_KEY`                    | optional | AI insights (AI Γεωπόνος)                      |
| `COPERNICUS_CLIENT_ID`              | optional | Satellite data                                 |
| `COPERNICUS_CLIENT_SECRET`          | optional | Satellite data                                 |

**Optional Clerk overrides**

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` — defaults to `/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` — defaults to `/sign-up`

---

## 🗄️ Database

| Environment | Command              | Description                             |
| ----------- | -------------------- | --------------------------------------- |
| Development | `npm run db:migrate` | Create + apply migrations (recommended) |
| Development | `npm run db:push`    | Push schema directly (prototyping)      |
| Production  | `npm run db:deploy`  | Apply existing migrations only          |
| Tooling     | `npm run db:studio`  | Open Prisma Studio                      |

> ℹ️ `npm run build` does **not** mutate your database.

---

## ⏰ Cron Jobs

Defined in [vercel.json](vercel.json):

| Endpoint                  | Schedule             | Purpose                        |
| ------------------------- | -------------------- | ------------------------------ |
| `GET /api/cron/weather`   | Daily · `06:00`      | Persists daily weather history |
| `GET /api/cron/satellite` | Weekly · Sun `07:00` | Refreshes satellite indices    |

In production both endpoints require:

```http
Authorization: Bearer $CRON_SECRET
```

---

## 🗂️ Project Structure

```text
src/
├── app/
│   ├── api/                 # Route handlers (server)
│   │   ├── activities/  analytics/  chat/  cron/  diagnose/
│   │   ├── export/      farms/      harvests/  insights/
│   │   ├── satellite/   sync-user/  upload/    weather/
│   ├── dashboard/           # App pages
│   └── offline/             # Offline fallback
├── components/              # UI + feature components
├── hooks/                   # Custom hooks
├── lib/                     # Server/client utilities (agronomy, ai, export…)
├── test/                    # Vitest tests
└── types/                   # Shared TypeScript types

prisma/
├── migrations/              # SQL migrations
├── scripts/                 # Seed + maintenance scripts
└── schema.prisma
```

---

## 📜 Scripts

| Category    | Command                 | Description                               |
| ----------- | ----------------------- | ----------------------------------------- |
| **Dev**     | `npm run dev`           | Start Next.js dev server                  |
|             | `npm run build`         | Generate Prisma client + production build |
|             | `npm run start`         | Start the production server               |
| **DB**      | `npm run db:generate`   | Generate Prisma client                    |
|             | `npm run db:migrate`    | Create + apply migrations (dev)           |
|             | `npm run db:deploy`     | Apply migrations (prod)                   |
|             | `npm run db:push`       | Push schema without migration files       |
|             | `npm run db:studio`     | Open Prisma Studio                        |
|             | `npm run db:seed`       | Seed example data                         |
| **Quality** | `npm run lint`          | Run ESLint                                |
|             | `npm run type-check`    | TypeScript type check                     |
|             | `npm run test`          | Vitest in watch mode                      |
|             | `npm run test:run`      | Vitest one‑shot                           |
|             | `npm run test:coverage` | Vitest with coverage report               |

---

## 🧪 Testing

```bash
npm run test:run        # one-shot
npm run test:coverage   # with coverage
```

Tests live next to source files (`*.test.ts`) and under [src/test](src/test).

---

## ☁️ Deployment

**Vercel** is the recommended target (Next.js + Cron + Blob support).

1. Provision a PostgreSQL database (e.g. Neon) and set `DATABASE_URL`.
2. Add every required variable from the [Environment Variables](#-environment-variables) table to the Vercel project.
3. Run `npm run db:deploy` as part of the deploy pipeline.
4. Set a strong `CRON_SECRET` so cron endpoints are protected.
5. Push to your main branch — Vercel will build and deploy automatically.

---

## 🤝 Contributing & Support

- 🐛 **Bugs** — open a GitHub issue with steps to reproduce and logs
  (server **and** browser console).
- 💡 **Feature requests** — describe the use case and the user it benefits.
- 🔒 **Security** — please do not open public issues for security reports.

---

<div align="center">

**Made with 🫒 for Greek olive farmers.**

</div>
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

| Variable                            | Required | Purpose                                        |
| ----------------------------------- | -------: | ---------------------------------------------- |
| `DATABASE_URL`                      |      yes | PostgreSQL connection (Prisma)                 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |      yes | Clerk auth (client)                            |
| `CLERK_SECRET_KEY`                  |      yes | Clerk auth (server)                            |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`   |      yes | Maps + geocoding                               |
| `BLOB_READ_WRITE_TOKEN`             |     no\* | Photo uploads (required if using uploads)      |
| `OPENWEATHER_API_KEY`               |       no | Weather intelligence + cron weather history    |
| `CRON_SECRET`                       |     prod | Protects `/api/cron/*` endpoints in production |
| `OPENAI_API_KEY`                    |       no | AI insights (“AI Γεωπόνος”)                    |
| `COPERNICUS_CLIENT_ID`              |       no | Satellite data                                 |
| `COPERNICUS_CLIENT_SECRET`          |       no | Satellite data                                 |

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
