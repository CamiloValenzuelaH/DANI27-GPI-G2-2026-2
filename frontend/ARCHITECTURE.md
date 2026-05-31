# DANI Platform - Professional SaaS Architecture

## Overview

This is a production-ready, multi-tenant SaaS compliance platform built with React, TypeScript, Tailwind CSS, and react-intl for internationalization.

## Architecture Components

### Core Context & State Management

#### `src/app/contexts/LayoutContext.tsx`
- **Purpose**: Central state management for layout preferences and user plan
- **Features**:
  - Persistent `navView` state (process/module) saved to localStorage
  - Mobile sidebar state management
  - User plan management (free/starter/pro/enterprise)
  - Loading state for JWT validation
  - Auto-close sidebar on desktop resize

#### `src/app/config/menuConfig.tsx`
- **Purpose**: Centralized menu configuration with plan-based access control
- **Features**:
  - Hierarchical plan system (free < starter < pro < enterprise)
  - `hasAccess()` function for permission checks
  - Separate menu arrays for:
    - Process view (compliance journey steps)
    - Module view (core modules, regulatory modules)
    - Intelligence items
    - Settings items
  - Badge support (counts, warnings)
  - Completed step indicators

### UI Components

#### `src/app/components/SidebarPro.tsx`
- **Mobile-First Design**: Drawer pattern with overlay for <1100px screens
- **Smart Active Links**: Uses `useLocation()` to detect active routes including child paths
- **Plan-Based Gating**: Lock icons and tooltips for restricted features
- **i18n Integration**: Full internationalization with react-intl
- **Skeleton Loader**: `SidebarSkeleton` component for loading states
- **Features**:
  - Profile badge with color-coded maturity levels
  - Process/Module navigation toggle
  - Hamburger close button (mobile only)
  - Locked item tooltips showing required plan
  - Step numbers with completion indicators

#### `src/app/components/NavbarPro.tsx`
- **Responsive Header**: Sticky navbar with hamburger menu for mobile
- **Features**:
  - Hamburger menu button (triggers sidebar drawer on mobile)
  - Search bar with i18n placeholder
  - Notification bell with badge
  - User profile dropdown with:
    - User info and email
    - Current plan display (color-coded)
    - Profile actions (view, settings, sign out)
  - Skeleton loader for loading states
  - Full dark mode support

#### `src/app/components/AppShell.tsx`
- **Purpose**: Main application wrapper component
- **Features**:
  - BrowserRouter integration
  - I18nProvider wrapper
  - LayoutProvider wrapper
  - Simulated JWT validation (1.5s loading)
  - Profile overlay modal
  - ChatWidget integration
  - Skeleton loading during auth validation

#### `src/app/components/ChatWidget.tsx`
- **AI Assistant**: Floating chat bubble with intelligent responses
- **Features**:
  - Context-aware responses (ISO, audit, CAPA, risk, evidence keywords)
  - Auto-scroll to latest message
  - Dark mode support
  - i18n for placeholder and button text

### Internationalization

#### `src/app/i18n/index.tsx`
- **I18nProvider**: Wrapper component for react-intl IntlProvider
- **Supported Languages**: EN, ES, PT, DE, FR

#### `src/app/types/index.ts`
- **Translations**: Complete translation objects for all 5 languages
- **Organized by Sections**:
  - Common (search, send, etc.)
  - Header (profile, settings, sign out)
  - Sidebar (org profile, navigation labels)
  - Menu Items (all navigation items)
  - Dashboard (metrics, etc.)

### Pages

#### `src/app/pages/DashboardPage.tsx`
- **Sample Page**: Example of a fully-featured page component
- **Features**:
  - Metric cards with trend indicators
  - Recent activity feed
  - Upcoming tasks list
  - Full i18n integration
  - Responsive grid layout

#### `src/app/AppPro.tsx`
- **Router Configuration**: Main app with all routes configured
- **Routes**:
  - `/dashboard` - DashboardPage
  - All other routes - Placeholder pages
  - Root `/` redirects to `/dashboard`

## Key Features

### 1. Persistent Layout State
- Navigation view preference (process/module) saved to localStorage
- Survives page refreshes and sessions

### 2. Mobile-First Sidebar
- Drawer pattern with backdrop overlay
- Auto-close on navigation (mobile)
- Hamburger menu in navbar
- Smooth transitions
- Touch-friendly on mobile

### 3. Smart Active Links
- Detects active routes including child paths
- Special handling for dashboard (matches both `/` and `/dashboard`)
- Visual indicators (background color, font weight)

### 4. i18n Integration
- react-intl with IntlProvider
- Organized translation keys (e.g., `menu.dashboard`, `header.signOut`)
- Support for placeholders with variables (e.g., `{plan}`)
- 5 languages fully translated

### 5. Skeleton Loaders
- Loading states for sidebar, navbar, and content
- Simulates JWT validation delay
- Smooth transition to actual content
- Prevents layout shift

### 6. Plan-Based Gating
- Hierarchical plan system
- Lock icons on restricted items
- Tooltips showing required plan
- Permission checks before navigation
- Disabled state for locked items

## Usage

### Using the Professional Components

```tsx
import AppPro from './app/AppPro';

// In your root file (e.g., main.tsx)
<AppPro />
```

This automatically includes:
- BrowserRouter
- I18nProvider
- LayoutProvider
- SidebarPro
- NavbarPro
- ChatWidget
- All routing

### Accessing Layout Context

```tsx
import { useLayout } from '../contexts/LayoutContext';

function MyComponent() {
  const { 
    navView, 
    setNavView, 
    isSidebarOpen, 
    toggleSidebar, 
    userPlan,
    isLoading 
  } = useLayout();
  
  // Use the values...
}
```

### Adding New Pages

1. Create page component in `src/app/pages/`
2. Add route in `src/app/AppPro.tsx`
3. Add menu item in `src/app/config/menuConfig.tsx`
4. Add translations in `src/app/types/index.ts`

### Customizing Plans

Edit `src/app/config/menuConfig.tsx`:

```tsx
{
  id: 'my-feature',
  labelKey: 'menu.myFeature',
  path: '/my-feature',
  icon: '🚀',
  requiredPlan: 'pro', // free | starter | pro | enterprise
}
```

## File Structure

```
src/app/
├── contexts/
│   └── LayoutContext.tsx       # State management
├── config/
│   └── menuConfig.tsx          # Menu configuration
├── components/
│   ├── SidebarPro.tsx          # Professional sidebar
│   ├── NavbarPro.tsx           # Professional navbar
│   ├── AppShell.tsx            # App wrapper
│   └── ChatWidget.tsx          # AI assistant
├── pages/
│   └── DashboardPage.tsx       # Sample page
├── i18n/
│   └── index.tsx               # I18n provider
├── types/
│   └── index.ts                # Types & translations
├── AppPro.tsx                  # Router & routes
└── App.tsx                     # Original monolithic version
```

## Migration from App.tsx to AppPro.tsx

The original `App.tsx` is a monolithic 2000+ line component. The new architecture:

**Before (App.tsx)**:
- All code in one file
- Manual state management
- No routing
- Hardcoded translations

**After (AppPro.tsx + components)**:
- Modular components
- React Context for state
- React Router for navigation
- react-intl for i18n
- Plan-based access control
- Mobile-responsive
- Production-ready

## Next Steps

1. Replace `App.tsx` with `AppPro.tsx` in your main entry point
2. Implement actual JWT validation in `AppShell.tsx`
3. Connect to real user plan API
4. Add remaining page components
5. Implement upgrade flow for locked features
6. Add analytics and error tracking
