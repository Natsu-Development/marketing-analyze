# Marketing Analytics Frontend

Modern React application for managing Facebook advertising campaigns and ad accounts with internationalization support.

## 🚀 Tech Stack

- **React 18** - UI framework with hooks
- **TypeScript** - Type safety and better DX
- **Vite** - Lightning fast build tool and dev server
- **React Router 6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality accessible components
- **Radix UI** - Accessible, unstyled UI primitives
- **Lucide React** - Beautiful & consistent icons
- **react-i18next** - Internationalization framework

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components (buttons, cards, etc.)
│   │   ├── navigation.tsx   # Main navigation component
│   │   ├── theme-provider.tsx  # Theme context provider
│   │   ├── language-switcher.tsx  # Language switching
│   │   ├── config-settings.tsx    # Configuration UI
│   │   └── suggestions-list.tsx   # Recommendations UI
│   ├── pages/               # Page components (routes)
│   │   ├── Home.tsx         # Dashboard overview
│   │   ├── Settings.tsx     # Global settings page
│   │   ├── Suggestions.tsx  # Recommendations page
│   │   ├── Sync.tsx         # Facebook sync & auth page
│   │   └── AccountConfig.tsx  # Ad account configuration
│   ├── hooks/               # Custom React hooks
│   │   ├── use-mobile.ts    # Mobile detection hook
│   │   └── use-toast.ts     # Toast notifications hook
│   ├── i18n/               # Internationalization
│   │   ├── index.ts        # i18next configuration
│   │   └── locales/        # Translation files
│   │       ├── en.json     # English translations
│   │       └── vi.json     # Vietnamese translations
│   ├── lib/                # Utility functions
│   │   └── utils.ts        # Common utilities (cn, etc.)
│   ├── styles/             # Global styles
│   │   └── globals.css     # Tailwind imports & global styles
│   ├── App.tsx             # Main app component with routing
│   ├── main.tsx            # Application entry point
│   └── vite-env.d.ts       # Vite type declarations
├── public/                 # Static assets
│   ├── placeholder-logo.png
│   ├── placeholder-user.jpg
│   └── ...other placeholders
├── index.html              # HTML entry point
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── components.json         # shadcn/ui configuration
└── package.json            # Project dependencies
```

## 🎨 Features

### ✅ Dashboard & Analytics
- **Ad Sets Overview** - Scaled campaign performance metrics
- **Account Management** - Multi-account switching and management
- **Sync Status** - Real-time Facebook connection status
- **Performance Metrics** - Campaign insights and analytics

### ✅ Facebook Integration
- **OAuth Authentication** - Secure Facebook login flow
- **Ad Account Sync** - Fetch and manage Facebook ad accounts
- **Account Selection** - Toggle active/inactive ad accounts
- **Connection Status** - Monitor Facebook API connection health

### ✅ Recommendations System
- **Campaign Optimization** - AI-powered campaign suggestions
- **Budget Optimization** - Spending recommendations
- **Audience Insights** - Target audience suggestions
- **Performance Alerts** - Automated performance monitoring

### ✅ User Experience
- **Dark/Light Theme** - Theme switcher with system preference
- **Internationalization** - English & Vietnamese language support
- **Responsive Design** - Mobile-first responsive layout
- **Toast Notifications** - User feedback system
- **Loading States** - Proper loading indicators

### ✅ Developer Experience
- **TypeScript** - Full type safety
- **Modern Build Tool** - Vite for fast development
- **Hot Module Reload** - Instant feedback during development
- **Path Aliases** - Clean imports with `@/` prefix
- **ESLint** - Code quality and consistency

## 🛠️ Setup & Development

### Prerequisites

- Node.js 18+ 
- Yarn or npm
- Backend service running on port 3001

### Installation

1. **Install dependencies:**
```bash
yarn install
```

2. **Start development server:**
```bash
yarn dev
```

3. **Build for production:**
```bash
yarn build
```

4. **Preview production build:**
```bash
yarn preview
```

### Environment Configuration

The frontend automatically connects to the backend at `http://localhost:3001`. For production deployment, update the API base URL in your HTTP client configuration.

## 📄 Available Scripts

- `yarn dev` - Start development server with HMR
- `yarn build` - Build optimized production bundle
- `yarn preview` - Preview production build locally
- `yarn lint` - Run ESLint for code quality

## 🔄 Routing Structure

```
/ (Home)                    # Dashboard overview
├── /settings               # Global application settings
├── /suggestions            # Campaign recommendations
├── /sync                   # Facebook authentication & sync
└── /account-config         # Ad account configuration
```

## 🌐 Internationalization

The app supports multiple languages using react-i18next:

- **English (en)** - Default language
- **Vietnamese (vi)** - Secondary language

Add new translations in `src/i18n/locales/` and they'll be automatically available via the language switcher.

### Adding New Languages

1. Create translation file: `src/i18n/locales/[lang].json`
2. Add language to supported languages list in `src/i18n/index.ts`
3. Update language switcher component if needed

## 🎨 Theming & Styling

### Theme System
- Uses **CSS variables** for consistent theming
- Supports **system preference** detection
- **Persistent theme** selection (stored in localStorage)
- **Smooth transitions** between themes

### Design System
- **shadcn/ui** components for consistency
- **Tailwind CSS** for rapid styling
- **Radix UI** for accessible primitives
- **Custom color palette** defined in `tailwind.config.js`

### Component Architecture
- **Modular components** in `src/components/`
- **Reusable UI components** in `src/components/ui/`
- **Page-level components** in `src/pages/`
- **Custom hooks** for shared logic

## 🔌 Backend Integration

The frontend integrates with the Marketing Analytics Backend for:

### Facebook Authentication
```typescript
// Facebook OAuth flow
POST /api/v1/auth/facebook/session { action: "connect" }
GET /api/v1/auth/facebook/callback?code=...&state=...
GET /api/v1/auth/facebook/status?fbUserId=...
```

### Ad Account Management
```typescript
// Ad account operations
POST /api/v1/auth/facebook/{userId}/refresh-ad-accounts
PUT /api/v1/auth/facebook/{userId}/ad-accounts/{accountId}/active
```

## 📱 Responsive Design

The application is built mobile-first with responsive breakpoints:

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: 1024px+

Key responsive features:
- Collapsible navigation on mobile
- Responsive grid layouts
- Touch-friendly interactions
- Optimized typography scaling

## 🚀 Deployment

### Build Process
```bash
yarn build
```
Generates optimized static files in `dist/` directory.

### Deployment Options
- **Static Hosting**: Vercel, Netlify, GitHub Pages
- **CDN**: CloudFront, Cloudflare
- **Self-hosted**: Nginx, Apache

### Environment Variables
Set these in your deployment environment:
- `VITE_API_BASE_URL` - Backend API URL (if different from localhost:3001)

## 🧪 Testing Strategy

### Testing Stack (Future Implementation)
- **Vitest** - Unit testing framework
- **React Testing Library** - Component testing
- **Playwright** - End-to-end testing

### Test Structure (Planned)
```
src/
├── __tests__/          # Unit tests
├── components/
│   └── __tests__/      # Component tests
└── pages/
    └── __tests__/      # Page tests
```

## 🔧 Development Notes

### Code Organization
- **Functional components** with hooks
- **TypeScript interfaces** for type safety
- **Custom hooks** for shared logic
- **Context providers** for global state

### Performance Optimizations
- **Code splitting** with React.lazy()
- **Image optimization** with proper formats
- **Bundle analysis** with Vite bundle analyzer
- **Tree shaking** for smaller bundles

### Best Practices
- **Consistent naming** conventions
- **Modular component** architecture
- **Proper error boundaries**
- **Accessibility** considerations
- **SEO optimization** for static content

## 📄 Migration Notes

This project was migrated from Next.js to React + Vite:

### Key Changes Made
- ✅ Removed Next.js App Router → React Router 6
- ✅ Removed `next/link` → `react-router-dom` Link
- ✅ Removed `usePathname()` → `useLocation()`
- ✅ Removed `useParams()` from next/navigation → react-router-dom
- ✅ Removed "use client" directives
- ✅ Removed Next.js fonts → Web fonts
- ✅ Added Vite configuration and build setup

## 🤝 Contributing

1. **Follow TypeScript** - Maintain type safety
2. **Use shadcn/ui** - For consistent component styling
3. **Follow naming** - Use descriptive component and function names
4. **Add translations** - For any user-facing text
5. **Test thoroughly** - Ensure responsive design works
6. **Document changes** - Update README for significant changes

## 📄 License

MIT