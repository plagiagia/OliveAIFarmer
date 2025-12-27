# ΕλαιοLog - Digital Olive Farm Management

**A modern, Greek-language web application for olive farmers to manage their groves digitally.**

![Next.js](https://img.shields.io/badge/Next.js-14.2.25-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma)
![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00D9FF?style=flat-square)
![Mapbox](https://img.shields.io/badge/Mapbox-GL-000000?style=flat-square&logo=mapbox)

## Features

### User Authentication
- **Clerk Authentication**: Secure sign-up/login with automatic redirect
- **Automatic User Sync**: Users synced to database automatically
- **Session Management**: Persistent login across sessions
- **Protected Routes**: Farm ownership verification on all operations

### Farm Management
- **Farm Creation**: Comprehensive form with interactive Mapbox integration
- **Farm Detail Pages**: Tabbed interface with overview, trees, activities, and harvests
- **Farm Editing**: Full edit modal with location autocomplete and map selection
- **Farm Deletion**: Secure deletion with confirmation
- **Olive Tree Management**: Add, edit, and remove individual trees with variety tracking
- **Activity Tracking**: Log farming activities (watering, pruning, fertilizing, pest control, etc.)
- **Harvest Records**: Track harvests with yield, pricing, and quality data
- **Greek Units**: All measurements in stremmata

### Interactive Mapping
- **Mapbox Integration**: Satellite imagery with interactive controls
- **Location Autocomplete**: Real-time search with Greek place names
- **Click-to-Select**: Precise coordinate extraction from map interactions
- **Map Previews**: Satellite map previews in dashboard cards
- **Greece-Focused**: Bounds restricted to Greece with Greek language support

### Analytics Dashboard
- **Farm Overview**: Comprehensive statistics and visual insights
- **Activity Charts**: Visualize farming activities over time
- **Harvest Charts**: Track production and yields across seasons
- **Farm Comparison**: Compare performance across multiple farms
- **Monthly Activity Trends**: See activity patterns by month

### Export & Reporting
- **PDF Reports**: Generate detailed farm reports with @react-pdf/renderer
- **CSV Export**: Export data to CSV with PapaParse
- **Data Portability**: Export activities, harvests, and farm data

### Olive Variety Knowledge Base
- **Greek Varieties**: Comprehensive database of olive varieties (Koroneiki, Kalamata, etc.)
- **Care Guidelines**: Variety-specific care instructions
- **Monthly Task Calendar**: Seasonal task recommendations per variety
- **Risk Factors**: Disease and pest resistance information
- **Smart Recommendations**: Context-aware suggestions based on farm and variety

### Progressive Web App
- **Offline Support**: Works offline with service worker caching
- **Installable**: Add to home screen on mobile devices
- **Offline Indicator**: Visual feedback when offline

### User Experience
- **Greek Language**: Complete Greek localization
- **Traditional Units**: Stremmata for land area
- **Accessibility**: ARIA labels, keyboard navigation
- **Mobile-First**: Touch-friendly interface for field use
- **Photo Upload**: Attach images to activities and harvests via Vercel Blob

---

## Technology Stack

### Frontend
- **Next.js 14.2.25**: React framework with App Router
- **TypeScript 5.3**: Full type safety
- **Tailwind CSS 3.3**: Utility-first styling
- **Lucide React**: Icon system
- **React Map GL 7.1.7**: Mapbox integration
- **Recharts 3.6**: Charts and data visualization
- **date-fns 4.1**: Date manipulation

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Clerk**: Authentication and user management
- **Prisma 5.22**: Type-safe database ORM
- **Neon PostgreSQL**: Serverless database

### Export & Documents
- **@react-pdf/renderer**: PDF generation
- **PapaParse**: CSV parsing and generation
- **Vercel Blob**: File storage for uploads

### PWA & Offline
- **@ducanh2912/next-pwa**: Progressive Web App support
- **Service Workers**: Offline caching

### Testing
- **Vitest 4.0**: Test runner
- **Testing Library**: React component testing
- **jsdom**: DOM environment for tests

### Mapping & Location
- **Mapbox GL JS**: Interactive maps
- **Mapbox Geocoding**: Location search and autocomplete

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Mapbox account (for mapping features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/plagiagia/OliveAIFarmer.git
cd OliveAIFarmer
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

4. **Configure your environment**
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database
DATABASE_URL=your_neon_postgresql_url

# Mapbox (for mapping features)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

# Optional: Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

5. **Set up the database**
```bash
npm run db:generate
npm run db:push
npm run db:seed  # Optional: seed with sample data
```

6. **Start the development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── activities/           # Activity CRUD
│   │   ├── analytics/            # Analytics endpoints
│   │   ├── export/               # Export functionality
│   │   ├── farms/                # Farm management
│   │   ├── harvests/             # Harvest operations
│   │   ├── sync-user/            # User synchronization
│   │   ├── upload/               # File uploads
│   │   └── varieties/            # Olive variety data
│   ├── dashboard/                # Dashboard pages
│   │   ├── analytics/            # Analytics page
│   │   └── farms/                # Farm management pages
│   └── offline/                  # Offline fallback page
├── components/
│   ├── activities/               # Activity components
│   ├── analytics/                # Chart components
│   ├── auth/                     # Authentication components
│   ├── dashboard/                # Dashboard components
│   ├── export/                   # Export buttons and reports
│   ├── farms/                    # Farm management components
│   ├── map/                      # Mapbox components
│   ├── trees/                    # Tree management
│   ├── ui/                       # Reusable UI components
│   └── upload/                   # Photo upload components
├── hooks/                        # Custom React hooks
│   └── useOnlineStatus.ts        # Online/offline detection
├── lib/                          # Utility libraries
│   ├── export/                   # CSV and PDF utilities
│   ├── area-conversions.ts       # Area unit conversions
│   ├── db.ts                     # Database client
│   ├── errors.ts                 # Error handling
│   ├── mapbox-utils.ts           # Map utilities
│   └── utils.ts                  # General utilities
├── test/                         # Test files
│   └── api/                      # API tests
└── types/                        # TypeScript types
    ├── activity.ts               # Activity types
    └── index.ts                  # Shared types

prisma/
├── schema.prisma                 # Database schema
└── scripts/
    ├── seed.ts                   # Database seeding
    ├── seed-varieties.ts         # Variety knowledge base
    └── migrate-to-stremmata.ts   # Migration utilities
```

---

## Database Schema

### Core Models

```prisma
model User {
  id        String   @id
  clerkId   String   @unique
  email     String   @unique
  firstName String
  lastName  String
  farms     Farm[]
}

model Farm {
  id          String   @id
  name        String
  location    String
  coordinates String?
  totalArea   Float?   // In stremmata
  trees       OliveTree[]
  activities  Activity[]
  harvests    Harvest[]
}

model OliveTree {
  id           String
  treeNumber   String
  variety      String
  plantingYear Int?
  health       TreeHealth
  status       TreeStatus
  varietyInfo  OliveVariety?
}
```

### Knowledge Base Models
- **OliveVariety**: Greek olive variety characteristics and care requirements
- **MonthlyTask**: Seasonal task calendar per variety
- **RiskFactor**: Disease and pest risk information
- **CareGuideline**: Detailed care instructions
- **SmartRecommendation**: Context-aware farming suggestions

See `prisma/schema.prisma` for the complete schema.

---

## Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database

# Testing
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Run tests with coverage

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
```

---

## UI/UX Design

### Design Principles
- **Farmer-First**: Designed for Greek olive farmers
- **Accessibility**: WCAG 2.1 AA compliant
- **Mobile-First**: Touch-friendly for field use
- **Greek Language**: Complete localization

### Color Palette
- **Primary**: Green tones (#22c55e, #16a34a)
- **Secondary**: Earth tones
- **Accent**: Emerald for actions

---

## Contributing

We welcome contributions! Please:
- Follow TypeScript best practices
- Maintain Greek language consistency
- Write tests for new features
- Update documentation

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Support

- **Issues**: Open an issue on GitHub
- **Documentation**: See `SETUP.md` for detailed setup
- **Troubleshooting**: See `TROUBLESHOOTING.md`

---

**Made with care for Greek olive farmers**

_"Digitizing traditional olive farming while respecting cultural heritage"_
