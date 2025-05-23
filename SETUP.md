# OliveLog Setup Guide

## 🚀 Quick Start

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file in the root directory with the following variables:

   ```env
   # Clerk Authentication (get from https://clerk.com)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # Application Settings
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development

         # Database (Required for full functionality)   DATABASE_URL="postgresql://username:password@host:5432/olivelog?sslmode=require"      # Future integrations (for later phases)   # MAPBOX_ACCESS_TOKEN=pk.eyJ1...   # OPENAI_API_KEY=sk-...
   ```

3. **Clerk Setup (Required)**

   **3.1 Create Clerk Account:**

   - Go to [clerk.com](https://clerk.com) and create an account
   - Create a new application
   - Choose "Next.js" as your framework

   **3.2 Configure OAuth Providers:**

   - In your Clerk dashboard, go to "User & Authentication" → "Social Connections"
   - Enable Google OAuth
   - Configure the OAuth settings for your domain

   **3.3 Copy Keys to Environment:**

   - Copy the publishable key and secret key from Clerk dashboard
   - Add them to your `.env.local` file

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🔑 Clerk Integration Details

Our application uses **Clerk App Router** integration with the following components:

### **Middleware (src/middleware.ts)**

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()
```

### **Layout Integration (src/app/layout.tsx)**

```typescript
import { ClerkProvider, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html>
        <body>
          <SignedOut>
            {/* Shows authentication page */}
            {children}
          </SignedOut>
          <SignedIn>
            {/* Shows app with user header */}
            <header>
              <UserButton />
            </header>
            {children}
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

### **Authentication Features**

- ✅ **Email/Password** authentication
- ✅ **Google OAuth** integration
- ✅ **User management** with UserButton
- ✅ **Automatic redirects** between auth and dashboard
- ✅ **Greek language** throughout the interface

## 📱 Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## 🌍 Greek Language Support

The application is configured with Greek as the default language. All UI text is in Greek to serve the target market of Greek olive farmers.

## 🔧 Architecture Overview

### **Clerk App Router Pattern**

We follow the **official Clerk App Router** integration:

1. **clerkMiddleware()** in `src/middleware.ts` (not authMiddleware)
2. **ClerkProvider** wrapping the entire app
3. **SignedIn/SignedOut** components for conditional rendering
4. **Server-side auth()** function from `@clerk/nextjs/server`
5. **Client-side hooks** from `@clerk/nextjs`

### **Authentication Flow**

1. User visits app → sees AuthPage (SignedOut)
2. User signs in/up → automatically redirected to dashboard (SignedIn)
3. User sees header with UserButton and main app content
4. All routes are protected by Clerk middleware

## 📁 Project Structure

```
src/
├── app/                 # Next.js 14 App Router
│   ├── globals.css     # Global styles with Olive theme
│   ├── layout.tsx      # Root layout with Clerk integration
│   ├── page.tsx        # Home page (shows AuthPage)
│   └── dashboard/      # Protected dashboard pages
├── components/          # React components
│   ├── auth/           # Authentication components
│   │   ├── AuthPage.tsx       # Main auth interface
│   │   ├── AuthForm.tsx       # Email/password form
│   │   ├── GoogleSignInButton.tsx # OAuth button
│   │   └── InfoPanel.tsx      # Branding panel
│   └── ui/             # Reusable UI components
├── lib/                # Utility functions
├── types/              # TypeScript definitions
├── hooks/              # Custom React hooks
├── store/              # Zustand stores
└── middleware.ts       # Clerk middleware (clerkMiddleware)
```

## 🎨 Design System

OliveLog uses a custom design system optimized for Greek farmers:

- **Primary Colors**: Olive green palette (#2E7D32, #4CAF50)
- **Typography**: Inter font for excellent Greek character support
- **Mobile-First**: Touch-friendly interface for field use
- **Accessibility**: High contrast, large touch targets (44px minimum)

## 🚀 Next Steps

After setup, you can:

1. **Test Authentication**: Sign up with email or Google
2. **Access Dashboard**: View the protected dashboard area
3. **Add Features**: Start building farm management functionality
4. **Database Integration**: Add Prisma for data persistence

## ⚠️ Important Notes

- **Always use clerkMiddleware()** (not authMiddleware - deprecated)
- **Follow App Router patterns** (not pages/ directory)
- **Import from correct packages**: `@clerk/nextjs` and `@clerk/nextjs/server`
- **Test on mobile devices** - primary target for Greek farmers

## 🗄️ Database Setup (Neon PostgreSQL)

### **Setting up Neon Database**

1. **Create Neon Account:**

   - Go to [neon.tech](https://neon.tech)
   - Sign up with GitHub, Google, or email
   - Choose the **Free** tier (perfect for development)

2. **Create Database Project:**

   - Click "Create a project"
   - Name: "olivelog-database"
   - Select EU region (closest to Greece)
   - Choose latest PostgreSQL version

3. **Get Connection String:**
   - Copy the connection string from dashboard
   - Add to `.env.local`: `DATABASE_URL="your_neon_connection_string"`

### **Initialize Database**

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (first time)
npm run db:push

# Seed with sample Greek olive farm data
npm run db:seed

# Open Prisma Studio to view data
npm run db:studio
```

### **Test Database Connection**

Visit: `http://localhost:3000/api/test-db`

You should see: `{"success": true, "message": "Database connection successful!"}`

### **Database Features**

✅ **Complete Olive Farming Schema:**

- Users (integrated with Clerk)
- Farms/Olive Groves
- Olive Sections (for organization)
- Individual Olive Trees (with varieties like Κορωνέικη, Καλαμών)
- Activities (watering, pruning, fertilizing, etc.)
- Harvest Records
- Tree-specific data tracking

✅ **Greek Language Support:**

- All sample data in Greek
- Greek olive varieties
- Greek locations and descriptions

## 🤖 MCP Servers Configuration

### **Model Context Protocol (MCP) Integration**

OliveLog is configured with MCP servers for enhanced AI-assisted development:

1. **Neon MCP Server**: Database management and operations
2. **Git MCP Server**: Version control and repository management

### **Setup (Automatic)**

The MCP servers are pre-configured in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "Neon": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.neon.tech/sse"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    }
  }
}
```

### **MCP Capabilities**

**With these servers, you can ask the AI assistant to:**

- 🗄️ **Database Operations**: Create tables, run queries, manage schema
- 🌿 **Git Operations**: Commit changes, create branches, push to remote
- 🔄 **Integrated Workflows**: Coordinate database migrations with version control
- 📊 **Performance Analysis**: Optimize queries and monitor database performance

### **Usage Examples**

```
"Add a new table for olive tree diseases"
"Commit all changes with message: Add disease tracking"
"Create a feature branch for harvest management"
"Optimize the slow query for farm analytics"
"Push changes to the main branch"
```

### **Documentation**

For detailed MCP server documentation, see: `docs/MCP_SERVERS.md`

---

For the latest Clerk documentation, visit: https://clerk.com/docs/quickstarts/nextjs
