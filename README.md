# 🫒 ΕλαιοLog - Digital Olive Farm Management

**A modern, Greek-language web application for olive farmers to manage their groves digitally.**

![Next.js](https://img.shields.io/badge/Next.js-14.2.25-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?style=flat-square&logo=prisma)
![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00D9FF?style=flat-square)
![Mapbox](https://img.shields.io/badge/Mapbox-GL-000000?style=flat-square&logo=mapbox)

## 🎯 **Current Status: Professional Olive Farm Management System**

✅ **Complete user authentication and farm management workflow**  
✅ **Interactive Mapbox integration with location selection and previews**  
✅ **Full CRUD operations for farm management (Create, Read, Update, Delete)**  
✅ **Greek agricultural unit system (Στρέμματα) with intelligent conversions**  
✅ **Beautiful, accessible Greek UI optimized for farmers**  
✅ **Neon PostgreSQL database with comprehensive schema**  
✅ **Mobile-first responsive design - production ready**

---

## 🚀 **Features**

### **✅ Implemented & Working**

#### **🔐 User Authentication**

- **Clerk Authentication**: Secure sign-up/login system with automatic redirect
- **Automatic User Sync**: Users automatically synced to database
- **Session Management**: Persistent login across sessions
- **Protected Routes**: Farm ownership verification on all operations

#### **🏗️ Farm Management**

- **Farm Creation**: Beautiful, comprehensive form with interactive Mapbox integration
- **Farm Detail Pages**: Complete tabbed interface with overview, trees, activities
- **Farm Editing**: Full edit modal with location autocomplete and map selection
- **Farm Deletion**: Secure, with confirmation and redirect
- **Olive Tree Management**: Add, edit, and remove individual trees
- **Activity Tracking**: Log and view farm activities
- **Harvest Records**: Track and analyze harvests
- **Greek Units**: All area and yield in stremmata (στρέμματα)
- **Mobile-First**: Optimized for use in the field

#### **🗺️ Interactive Mapping System**

- **Mapbox Integration**: Satellite imagery and interactive map controls
- **Location Autocomplete**: Real-time search with Greek place names and suggestions
- **Click-to-Select**: Precise coordinate extraction from map interactions
- **Map Previews**: Satellite map previews in dashboard farm cards
- **Greece-Focused**: Bounds restricted to Greece with Greek language support
- **Mobile Optimized**: Touch-friendly controls perfect for field use
- **Graceful Fallbacks**: Works with or without Mapbox API token

#### **📊 Dashboard & Analytics**

- **Onboarding Flow**: Guided setup for new users
- **Farm Overview**: Comprehensive statistics and visual insights
- **Farm Analytics**: Tree health distribution, variety breakdown, activity timelines
- **Interactive Navigation**: Clickable farm cards leading to detailed pages
- **Success Feedback**: Real-time success messages for all operations
- **Responsive Design**: Perfect on mobile and desktop

#### **🎨 User Experience**

- **Greek Language**: Complete Greek localization throughout
- **Traditional Units**: Authentic Greek agricultural measurements (Στρέμματα)
- **Accessibility**: ARIA labels, keyboard navigation, high contrast
- **Mobile Optimized**: Large touch targets, smooth interactions
- **Error Handling**: Clear, helpful error messages in Greek
- **Visual Feedback**: Loading states, animations, and progress indicators

#### **🌾 Agricultural Features**

- **Greek Land Units**: Primary support for Στρέμματα (stremmata)
- **Unit Conversions**: Easy conversion from hectares, square meters, square kilometers
- **Cultural Authenticity**: Respects traditional Greek farming practices
- **Real-time Preview**: Live conversion preview during farm creation and editing
- **Location Intelligence**: Greek region recognition and mapping

### **🔄 Ready for Implementation (Phase 5)**

#### **🌳 Tree Management**

- Add individual olive trees to farms
- Track tree varieties (Κορωνέικη, Καλαμών, etc.)
- Monitor tree health and status
- GPS location tracking for each tree

#### **📝 Activity Logging**

- Record farming activities (πότισμα, κλάδεμα, λίπανση)
- Weather integration
- Cost tracking and notes
- Photo attachments

#### **🏆 Harvest Management**

- Yearly harvest recording
- Oil production tracking
- Quality assessment
- Market price tracking

#### **📊 Advanced Analytics**

- Farm performance charts
- Historical data analysis
- Yield optimization insights
- Weather correlation analysis

---

## 🛠 **Technology Stack**

### **Frontend**

- **Next.js 14.2.25**: React framework with App Router
- **TypeScript**: Full type safety throughout
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon system
- **React Map GL 7.1.7**: Mapbox integration for interactive maps

### **Mapping & Location**

- **Mapbox GL JS**: Interactive satellite maps and location services
- **Mapbox Geocoding**: Location search and autocomplete
- **LocationAutocomplete**: Custom React component for Greek place search
- **Map Utilities**: Coordinate parsing, bounds checking, region mapping

### **Backend**

- **Next.js API Routes**: Serverless API endpoints with full CRUD operations
- **Clerk**: Authentication and user management
- **Prisma ORM**: Type-safe database access with comprehensive schema

### **Database**

- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Prisma Schema**: Comprehensive olive farming data model
- **MCP Integration**: Database management tools in Cursor

### **Development Tools**

- **MCP Servers**: Neon database and Mapbox integration in Cursor
- **ESLint & Prettier**: Code formatting and linting
- **Git**: Version control with comprehensive .gitignore
- **TypeScript**: Full type coverage including map components

---

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js 18+
- npm or yarn
- Git
- Mapbox account (for mapping features)

### **Installation**

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

# Optional: Clerk URLs (for custom domains)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

5. **Set up the database**

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data (optional)
npm run db:seed
```

6. **Start the development server**

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

---

## 📁 **Project Structure**

```
src/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── farms/               # Farm management endpoints
│   │   │   ├── create/          # Farm creation
│   │   │   └── [farmId]/        # Farm CRUD operations
│   │   ├── sync-user/           # User synchronization
│   │   └── test-db/             # Database testing
│   ├── dashboard/               # Dashboard pages
│   │   └── farms/               # Farm management pages
│   │       ├── new/             # Farm creation page
│   │       └── [farmId]/        # Individual farm detail pages
│   ├── globals.css              # Global styles
│   └── layout.tsx               # Root layout
├── components/                   # React components
│   ├── map/                     # Mapbox integration components
│   │   ├── MapboxMap.tsx        # Interactive map component
│   │   ├── LocationAutocomplete.tsx # Location search
│   │   └── MapPreview.tsx       # Static map previews
│   ├── dashboard/               # Dashboard components
│   ├── farms/                   # Farm management components
│   │   ├── FarmCreationForm.tsx # Farm creation form
│   │   ├── FarmEditModal.tsx    # Farm editing modal
│   │   ├── FarmDetailContent.tsx # Farm detail pages
│   │   └── FarmStats.tsx        # Farm statistics
│   ├── auth/                    # Authentication components
│   └── ui/                      # Reusable UI components
├── lib/                         # Utility libraries
│   ├── db.ts                    # Database utilities
│   ├── area-conversions.ts      # Area unit conversion utilities
│   ├── mapbox-utils.ts          # Map utilities and helpers
│   └── utils.ts                 # General utilities
└── middleware.ts                # Clerk middleware

prisma/
├── schema.prisma               # Database schema
├── seed.ts                     # Sample data
└── migrate-to-stremmata.ts     # Migration utilities

.cursor/
└── mcp.json                    # MCP server configuration
```

---

## 📊 **Database Schema**

### **Core Models**

```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  firstName String
  lastName  String
  farms     Farm[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Farm {
  id          String      @id @default(cuid())
  name        String
  location    String
  coordinates String?     // GPS coordinates as "lat, lng"
  totalArea   Float?      // Total farm area in stremmata (στρέμματα)
  description String?
  user        User        @relation(fields: [userId], references: [id])
  userId      String
  trees       OliveTree[]
  activities  Activity[]
  harvests    Harvest[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model OliveTree {
  id         String     @id @default(cuid())
  variety    String
  plantYear  Int?
  health     String     @default("Healthy")
  latitude   Float?
  longitude  Float?
  farm       Farm       @relation(fields: [farmId], references: [id])
  farmId     String
  activities Activity[]
  harvests   Harvest[]
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
}
```

_See `prisma/schema.prisma` for the complete schema including activities and harvests._

---

## 🗺️ **Mapping Features**

### **Mapbox Integration**

- **Interactive Maps**: Satellite imagery with navigation controls
- **Location Search**: Real-time autocomplete with Greek place names
- **Coordinate Extraction**: Click-to-select precise farm locations
- **Map Previews**: Static satellite previews in dashboard cards
- **Greece Focus**: Restricted to Greek geographical bounds

### **Location Intelligence**

- **Greek Regions**: Comprehensive mapping of Greek olive-growing areas
- **Bounds Validation**: Ensures coordinates are within Greece
- **Cultural Context**: Greek language preference for place names
- **Mobile Optimized**: Touch-friendly map controls for field use

### **Technical Implementation**

```typescript
// Example: Location autocomplete with Greek focus
<LocationAutocomplete
  value={location}
  onChange={setLocation}
  onLocationSelect={handleLocationSelect}
  placeholder="Αναζητήστε την τοποθεσία του ελαιώνα σας..."
  required
/>

// Example: Interactive map with click selection
<MapboxMap
  longitude={lng}
  latitude={lat}
  zoom={14}
  interactive={true}
  onLocationSelect={handleMapClick}
  showMarker={true}
/>
```

---

## 🎨 **UI/UX Design**

### **Design Principles**

- **Farmer-First**: Designed for Greek olive farmers with varying tech experience
- **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation
- **Mobile-First**: Touch-friendly interface perfect for field use
- **Greek Language**: Complete Greek localization throughout

### **Color Palette**

- **Primary**: Green tones representing olive trees (#22c55e, #16a34a)
- **Secondary**: Earth tones for warmth
- **Accent**: Emerald for actions and success states
- **Neutral**: Grays for text and backgrounds

### **Key Features**

- **Large Touch Targets**: Minimum 44px for mobile accessibility
- **Clear Typography**: Bold, readable fonts optimized for Greek text
- **Visual Feedback**: Loading states, hover effects, smooth animations
- **Error Handling**: Beautiful error messages with helpful guidance
- **Interactive Maps**: Touch-friendly map controls and selection

---

## 🧪 **Development**

### **Available Scripts**

```bash
# Development
npm run dev                     # Start development server
npm run build                   # Build for production
npm run start                   # Start production server

# Database
npm run db:generate            # Generate Prisma client
npm run db:push               # Push schema to database
npm run db:migrate            # Run migrations
npm run db:studio             # Open Prisma Studio
npm run db:seed               # Seed database with sample data

# Code Quality
npm run lint                  # Run ESLint
npm run type-check           # TypeScript type checking
```

### **Environment Setup**

1. **Neon Database**: Create a new Neon project and get the connection string
2. **Clerk Authentication**: Set up a new Clerk application
3. **Mapbox**: Create a Mapbox account and get an access token
4. **MCP Integration**: Configure `.cursor/mcp.json` for enhanced development

### **Key Environment Variables**

```env
# Required for core functionality
DATABASE_URL=                    # Neon PostgreSQL connection
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= # Clerk authentication
CLERK_SECRET_KEY=               # Clerk server key

# Required for mapping features
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN= # Mapbox GL JS token

# Optional for custom domains
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

---

## 📈 **Roadmap**

### **Phase 5: Advanced Farm Management** (Next Priority)

- [ ] **Tree Management System**: Individual tree tracking with GPS locations
- [ ] **Section Management**: Farm area organization and management
- [ ] **Activity Logging**: Detailed farming operations tracking
- [ ] **Harvest Tracking**: Production records and quality assessment
- [ ] **Photo Integration**: Image attachments for activities and harvests

### **Phase 6: Advanced Features**

- [ ] **Weather Integration**: Real-time weather data and forecasting
- [ ] **Advanced Analytics**: Charts, trends, and performance insights
- [ ] **Export/Reporting**: PDF reports and data export capabilities
- [ ] **Offline Support**: Progressive Web App with offline functionality

### **Phase 7: Scale & Optimize**

- [ ] **Multi-language Support**: Expand beyond Greek
- [ ] **IoT Integration**: Sensors, weather stations, automated monitoring
- [ ] **Community Features**: Farmer network and knowledge sharing
- [ ] **AI-powered Insights**: Machine learning for yield optimization

---

## 🏆 **Recent Achievements**

### **December 2025 Development Session**

✅ **Complete Authentication Flow** - Fixed login redirect issues  
✅ **Comprehensive Farm Detail Pages** - Tabbed interface with statistics  
✅ **Stremmata Conversion System** - Traditional Greek agricultural units  
✅ **Full Mapbox Integration** - Interactive maps and location services  
✅ **Farm Edit & Delete System** - Complete CRUD operations with security  
✅ **Mobile Optimization** - Perfect responsive design for field use  
✅ **Production Ready Build** - Clean, error-free deployment

---

## 🤝 **Contributing**

We welcome contributions! Please read our contributing guidelines and feel free to submit issues or pull requests.

### **Development Guidelines**

- Follow TypeScript best practices
- Maintain Greek language consistency
- Focus on farmer usability
- Write tests for new features
- Update documentation
- Respect agricultural authenticity

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 **Support**

- **Documentation**: See `SETUP.md` for detailed setup instructions
- **Development Log**: See `DEVELOPMENT_LOG.md` for detailed development progress
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Email**: Contact the development team for professional support

---

## 🙏 **Acknowledgments**

- Greek olive farmers who inspired this project
- Open source community for excellent tools and libraries
- **Neon** for serverless PostgreSQL infrastructure
- **Clerk** for authentication services
- **Mapbox** for mapping and location services
- **Next.js** team for the amazing React framework

---

**Made with 🫒 for Greek olive farmers**

_"Digitizing traditional olive farming while respecting cultural heritage"_
