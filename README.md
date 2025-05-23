# 🫒 ΕλαιοLog - Ψηφιακό Ημερολόγιο Ελαιοδέντρων

> Το ψηφιακό ημερολόγιο που βοηθάει τους Έλληνες αγρότες να διαχειριστούν τον ελαιώνα τους αποτελεσματικά.

## 🌟 Χαρακτηριστικά

- **Σύγχρονη Διεπαφή**: Όμορφο και φιλικό UI βελτιστοποιημένο για κινητά
- **Ελληνική Γλώσσα**: Πλήρης υποστήριξη ελληνικής γλώσσας
- **Ασφαλής Πρόσβαση**: Ολοκληρωμένο σύστημα αυθεντικοποίησης με Clerk
- **Responsive Design**: Λειτουργεί τέλεια σε όλες τις συσκευές
- **PWA Ready**: Προετοιμασμένο για Progressive Web App

## 🚀 Τεχνολογίες

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS με custom olive theme
- **Authentication**: Clerk
- **Database**: PostgreSQL με Prisma ORM
- **State Management**: Zustand
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📱 Εγκατάσταση

1. **Κλωνοποίηση του repository**

   ```bash
   git clone https://github.com/your-username/olivelog.git
   cd olivelog
   ```

2. **Εγκατάσταση dependencies**

   ```bash
   npm install
   ```

3. **Ρύθμιση environment variables**

   Δημιουργήστε ένα αρχείο `.env.local` στο root directory:

   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

   # Database
   DATABASE_URL="your_postgresql_connection_string"
   DIRECT_URL="your_postgresql_direct_connection_string"

   # App Settings
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Εκκίνηση development server**

   ```bash
   npm run dev
   ```

   Ανοίξτε [http://localhost:3000](http://localhost:3000) στον browser σας.

## 🔧 Scripts

- `npm run dev` - Εκκίνηση development server
- `npm run build` - Build για production
- `npm run start` - Εκκίνηση production server
- `npm run lint` - Έλεγχος κώδικα με ESLint
- `npm run type-check` - Έλεγχος TypeScript types

## 📁 Δομή Project

```
src/
├── app/                 # Next.js 14 App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── dashboard/      # Dashboard pages
├── components/          # React components
│   ├── auth/           # Authentication components
│   └── ui/             # Reusable UI components
├── lib/                # Utility functions
├── types/              # TypeScript definitions
├── hooks/              # Custom React hooks
└── store/              # Zustand stores
```

## 🎨 Design System

Το ΕλαιοLog χρησιμοποιεί ένα custom design system βασισμένο στα χρώματα της ελιάς:

- **Primary Colors**: Olive green (#2E7D32, #4CAF50)
- **Secondary Colors**: Earth tones για φυσική αίσθηση
- **Typography**: Inter font για καλή αναγνωσιμότητα
- **Spacing**: Consistent spacing scale
- **Animations**: Subtle animations για καλύτερη UX

## 🌍 Internationalization

Η εφαρμογή είναι σχεδιασμένη με την ελληνική γλώσσα ως προτεραιότητα:

- Όλα τα UI texts είναι στα ελληνικά
- Ελληνικές ημερομηνίες και μορφοποίηση
- Υποστήριξη ελληνικών χαρακτήρων σε όλα τα inputs

## 🤝 Contributing

Καλωσορίζουμε contributions! Παρακαλώ:

1. Fork το repository
2. Δημιουργήστε ένα feature branch (`git checkout -b feature/amazing-feature`)
3. Commit τις αλλαγές σας (`git commit -m 'Add amazing feature'`)
4. Push στο branch (`git push origin feature/amazing-feature`)
5. Ανοίξτε ένα Pull Request

## 📄 License

Αυτό το project είναι licensed υπό την MIT License - δείτε το [LICENSE](LICENSE) αρχείο για λεπτομέρειες.

## 📞 Επικοινωνία

- **Email**: info@olivelog.gr
- **Website**: https://olivelog.gr
- **GitHub**: https://github.com/your-username/olivelog

---

Φτιαγμένο με ❤️ για τους Έλληνες αγρότες 🇬🇷
