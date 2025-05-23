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
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

   # Database (Neon PostgreSQL)
   DATABASE_URL="postgresql://username:password@host:5432/olivelog?sslmode=require"
   DIRECT_URL="postgresql://username:password@host:5432/olivelog?sslmode=require"

   # Application Settings
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

3. **Database Setup**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🔑 Services Setup

### Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy the publishable key and secret key to your `.env.local`
4. Configure OAuth providers (Google) in the Clerk dashboard

### Neon Database

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project
3. Copy the connection string to your `.env.local`

## 📱 Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## 🌍 Greek Language Support

The application is configured with Greek as the default language. All UI text should be in Greek to serve the target market of Greek olive farmers.

## 📁 Project Structure

```
src/
├── app/                 # Next.js 14 App Router
├── components/          # Reusable UI components
├── lib/                # Utility functions and configurations
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
└── store/              # Zustand state management
```
