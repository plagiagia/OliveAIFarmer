# 🫒 ΕλαιοLog - Digital Olive Farm Management

**A modern, Greek-language web application for olive farmers to manage their groves digitally.**

![Next.js](https://img.shields.io/badge/Next.js-14.2.25-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?style=flat-square&logo=prisma)
![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00D9FF?style=flat-square)

## 🎯 **Current Status: Professional Olive Farm Management MVP**✅ **Complete user authentication and farm creation workflow** ✅ **Comprehensive farm detail pages with statistics and analytics** ✅ **Greek agricultural unit system (Στρέμματα) with conversions** ✅ **Beautiful, accessible Greek UI optimized for farmers** ✅ **Neon PostgreSQL database with comprehensive schema** ✅ **Mobile-first responsive design - production ready**

---

## 🚀 **Features**

### **✅ Implemented & Working**

#### **🔐 User Authentication**

- **Clerk Authentication**: Secure sign-up/login system
- **Automatic User Sync**: Users automatically synced to database
- **Session Management**: Persistent login across sessions

#### **🏗️ Farm Management**- **Farm Creation**: Beautiful, comprehensive form with Greek locations- **Farm Detail Pages**: Complete tabbed interface with overview, sections, trees, activities- **Greek Agricultural Units**: Traditional Στρέμματα (stremmata) with unit conversions- **Location Support**: Pre-populated Greek olive-growing regions + custom input- **Data Validation**: Client-side and server-side validation- **GPS Coordinates**: Optional GPS location support

#### **📊 Dashboard**- **Onboarding Flow**: Guided setup for new users- **Farm Overview**: Comprehensive statistics and visual insights- **Farm Analytics**: Tree health distribution, variety breakdown, activity timelines- **Interactive Navigation**: Clickable farm cards leading to detailed pages- **Success Feedback**: Real-time success messages- **Responsive Design**: Perfect on mobile and desktop

#### **🎨 User Experience**- **Greek Language**: Complete Greek localization- **Traditional Units**: Authentic Greek agricultural measurements (Στρέμματα)- **Accessibility**: ARIA labels, keyboard navigation, high contrast- **Mobile Optimized**: Large touch targets, smooth interactions- **Error Handling**: Clear, helpful error messages in Greek#### **🌾 Agricultural Features**- **Greek Land Units**: Primary support for Στρέμματα (stremmata)- **Unit Conversions**: Easy conversion from hectares, square meters, square kilometers- **Cultural Authenticity**: Respects traditional Greek farming practices- **Real-time Preview**: Live conversion preview during farm creation

### **🔄 Ready for Implementation**

#### **🌳 Tree Management**

- Add individual olive trees to farms
- Track tree varieties (Κορωνέικη, Καλαμών, etc.)
- Monitor tree health and status

#### **📝 Activity Logging**

- Record farming activities (πότισμα, κλάδεμα, λίπανση)
- Weather integration
- Cost tracking and notes

#### **🏆 Harvest Management**

- Yearly harvest recording
- Oil production tracking
- Quality assessment

#### **📊 Analytics & Insights**

- Farm performance charts
- Historical data analysis
- Yield optimization insights

---

## 🛠 **Technology Stack**

### **Frontend**

- **Next.js 14.2.25**: React framework with App Router
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon system

### **Backend**

- **Next.js API Routes**: Serverless API endpoints
- **Clerk**: Authentication and user management
- **Prisma ORM**: Type-safe database access

### **Database**

- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Prisma Schema**: Comprehensive olive farming data model

### **Development Tools**

- **MCP Integration**: Neon database management in Cursor
- **ESLint & Prettier**: Code formatting and linting
- **Git**: Version control with comprehensive .gitignore

---

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js 18+
- npm or yarn
- Git

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
│   │   ├── farms/create/        # Farm creation endpoint
│   │   ├── sync-user/           # User synchronization
│   │   └── test-db/             # Database testing
│   ├── dashboard/               # Dashboard pages│   │   └── farms/               # Farm management pages│   │       ├── new/             # Farm creation page│   │       └── [farmId]/        # Individual farm detail pages
│   ├── globals.css              # Global styles
│   └── layout.tsx               # Root layout
├── components/                   # React components
│   ├── dashboard/               # Dashboard components
│   ├── farms/                   # Farm management components
│   ├── auth/                    # Authentication components
│   └── ui/                      # Reusable UI components
├── lib/                         # Utility libraries│   ├── db.ts                    # Database utilities│   └── area-conversions.ts      # Area unit conversion utilities
└── middleware.ts                # Clerk middleware

prisma/
├── schema.prisma               # Database schema
└── seed.ts                     # Sample data

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
}

model Farm {
  id          String   @id @default(cuid())
  name        String
  location    String
  coordinates String?
  totalArea   Float?
  description String?
  user        User     @relation(fields: [userId], references: [id])
  userId      String
  trees       OliveTree[]
  activities  Activity[]
  harvests    Harvest[]
}
```

_See `prisma/schema.prisma` for the complete schema including trees, activities, and harvests._

---

## 🎨 **UI/UX Design**

### **Design Principles**

- **Farmer-First**: Designed for Greek olive farmers with varying tech experience
- **Accessibility**: WCAG 2.1 AA compliant
- **Mobile-First**: Touch-friendly interface for field use
- **Greek Language**: Complete Greek localization

### **Color Palette**

- **Primary**: Green tones representing olive trees
- **Secondary**: Earth tones for warmth
- **Accent**: Emerald for actions and success states

### **Key Features**

- **Large Touch Targets**: Minimum 44px for mobile
- **Clear Typography**: Bold, readable fonts
- **Visual Feedback**: Loading states, hover effects, animations
- **Error Handling**: Beautiful error messages with helpful guidance

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
3. **MCP Integration**: Configure `.cursor/mcp.json` for database management

---

## 📈 **Roadmap**

### **Phase 3: Advanced Farm Management** (Next Priority)- [x] Farm detail pages with tabbed interface- [x] Comprehensive farm statistics and analytics- [x] Greek agricultural unit system (Στρέμματα)- [ ] Tree management system (individual tree tracking)- [ ] Section management (farm area organization)- [ ] Activity logging (detailed farming operations)- [ ] Harvest tracking (production records)

### **Phase 4: Advanced Features**- [ ] Weather integration- [ ] Advanced analytics dashboard with charts- [ ] Export/reporting capabilities- [ ] Mobile app (React Native)

### **Phase 5: Scale & Optimize**- [ ] Multi-language support (beyond Greek)- [ ] IoT integration (sensors, weather stations)- [ ] Community features (farmer network)- [ ] AI-powered insights and recommendations

---

## 🤝 **Contributing**

We welcome contributions! Please read our contributing guidelines and feel free to submit issues or pull requests.

### **Development Guidelines**

- Follow TypeScript best practices
- Maintain Greek language consistency
- Focus on farmer usability
- Write tests for new features
- Update documentation

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 **Support**

- **Documentation**: See `SETUP.md` for detailed setup instructions
- **Development Log**: See `DEVELOPMENT_LOG.md` for detailed development progress
- **Issues**: Open an issue on GitHub for bugs or feature requests

---

## 🙏 **Acknowledgments**

- Greek olive farmers who inspired this project
- Open source community for excellent tools and libraries
- Neon for serverless PostgreSQL
- Clerk for authentication infrastructure

---

**Made with 🫒 for Greek olive farmers**
