<div align="center">

# 🫒 OliveLog · ΕλαιοLog

**A modern, Greek-language field logbook for olive growers —
δάκος risk alerts, activities & costs, harvests, and OPEKEPE-ready PDF exports.**

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

**OliveLog** is a Progressive Web App built for olive grove owners.
It is deliberately focused on what farmers use and pay for: a digital field
logbook with **δάκος (olive fly) risk alerts via push notifications**, harvest
& cost tracking, a simple "my year" money view, and **PDF logbook exports**
ready for ΟΣΔΕ/accountants — plus optional **weather** data and an
**AI Γεωπόνος** insights assistant powered by OpenAI.

> The UI is fully localised in **Greek 🇬🇷**, with calendars, units and
> terminology tuned for Mediterranean olive farming.

---

## ✨ Features

| Domain                      | Capabilities                                                   |
| --------------------------- | -------------------------------------------------------------- |
| 🔐 **Authentication**       | Clerk‑based sign‑in, sign‑up and user sync                     |
| 🌳 **Farm management**      | Create, edit, geolocate and visualise olive groves             |
| 📅 **Activities**           | Field logbook: operations, costs, notes                        |
| 🧺 **Harvests**             | Mill deliveries, pricing, yearly performance                   |
| 🪰 **Δάκος alerts**         | Degree‑day pest model + web push notifications (daily cron)    |
| 📊 **Η Χρονιά μου**         | One simple view: yield, revenue, costs, profit vs. last year   |
| 🗺️ **Mapping**              | Mapbox satellite view, autocomplete, location previews         |
| 📦 **Exports**              | CSV + OPEKEPE‑style PDF field logbook (Ημερολόγιο Αγρού)       |
| 📲 **PWA**                  | Installable, offline fallback, asset caching                   |
| ☀️ **Weather** _(opt.)_     | OpenWeatherMap forecasts and daily history cron                |
| 🤖 **AI Γεωπόνος** _(opt.)_ | OpenAI‑powered farm‑level insights (with rule‑based fallback)  |

---

## 🧱 Tech Stack

- **Framework** — Next.js 14 (App Router), React 18, TypeScript 5
- **Styling** — Tailwind CSS, `class-variance-authority`, Lucide icons
- **Data** — Prisma 5 + PostgreSQL (Neon or any Postgres)
- **Auth** — Clerk
- **Maps** — Mapbox GL, react‑map‑gl, Mapbox Geocoder
- **Charts** — Recharts
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
| `CRON_SECRET`                       | 🛡️ prod  | Protects `/api/cron/*` endpoints in production |
| `OPENWEATHER_API_KEY`               | optional | Weather intelligence + cron weather history    |
| `OPENAI_API_KEY`                    | optional | AI insights (AI Γεωπόνος)                      |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`      | optional | Web push (δάκος alerts)                        |
| `VAPID_PRIVATE_KEY`                 | optional | Web push (δάκος alerts)                        |
| `STRIPE_PRICE_GROWER`               | optional | Pro plan monthly price ID                      |
| `STRIPE_PRICE_GROWER_ANNUAL`        | optional | Pro plan annual price ID (promoted default)    |

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

> ℹ️ `npm run build` does **not** mutate your database locally. On Vercel production deploys, `npm run build:vercel` runs `prisma migrate deploy` before build.

---

## ⏰ Cron Jobs

Defined in [vercel.json](vercel.json):

| Endpoint                | Schedule        | Purpose                                          |
| ----------------------- | --------------- | ------------------------------------------------ |
| `GET /api/cron/weather` | Daily · `06:00` | Persists weather history + sends δάκος alerts    |

In production the endpoint requires:

```http
Authorization: Bearer $CRON_SECRET
```

---

## 🗂️ Project Structure

```text
src/
├── app/
│   ├── api/                 # Route handlers (server)
│   │   ├── activities/  analytics/  cron/      export/
│   │   ├── farms/       harvests/   insights/  push/
│   │   ├── stripe/      sync-user/  weather/
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
