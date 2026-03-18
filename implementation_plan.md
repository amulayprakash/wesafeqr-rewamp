# WeSafe QR Platform — Full Implementation Plan

> **Version:** 1.1 | **Date:** March 16, 2026 | **Status:** ✅ Approved

---

## Goal

Rebuild the WeSafe QR web application with a modern, secure, multi-language architecture while preserving backward compatibility for existing users and their data. The new app uses **Vite + React + shadcn/ui** for the frontend and **Node.js (Express)** for a unified backend API deployed on **Render**.

---

## Confirmed Decisions

| Decision | Choice |
|----------|--------|
| **Platform** | Web only (no Android) |
| **Frontend** | Vite + React + **shadcn/ui** + Tailwind CSS + **Framer Motion** |
| **Backend** | **Option B** — Full rewrite in Node.js (Express) |
| **Backend Hosting** | **Render** (standalone Node.js server) |
| **Payments** | Keep **Razorpay** |
| **WhatsApp Alerts** | Keep current provider (`wts.vision360solutions.co.in`) — migrate to official API later |
| **Database** | Same Firebase project (`wesafe-40d85`) — backward compatible |
| **Languages** | 20 languages: 10 Indian + 10 international |

---

## Phase Overview

| Phase | Scope | Duration Est. |
|-------|-------|---------------|
| **Phase 1** | Project setup, design system, auth, protected routing | 1-2 weeks |
| **Phase 2** | Core dashboard, profile management, child accounts, i18n | 2-3 weeks |
| **Phase 3** | QR management, scan flow, emergency alerts | 2-3 weeks |
| **Phase 4** | Lost & Found, Vehicle QR (ZIDDIQR) | 1-2 weeks |
| **Phase 5** | Security hardening, backend API gateway, migration | 1-2 weeks |
| **Phase 6** | Testing, performance optimization, deployment | 1 week |

---

## Phase 1: Foundation

### Frontend Project Setup

#### [NEW] Vite + React Project

Create a new Vite React project in `c:\Users\ASUS\Desktop\New folder (3)\wesafe-app`:

```
wesafe-app/
├── public/
│   ├── locales/             # i18n translation JSON files
│   │   ├── en/
│   │   ├── hi/
│   │   ├── ta/
│   │   ├── te/
│   │   ├── bn/
│   │   ├── mr/
│   │   ├── gu/
│   │   ├── kn/
│   │   ├── ml/
│   │   └── pa/
│   └── assets/
├── src/
│   ├── main.jsx             # App entrypoint
│   ├── App.jsx              # Root with router + providers
│   ├── i18n.js              # i18next configuration
│   ├── config/
│   │   └── firebase.js      # Firebase initialization
│   ├── contexts/
│   │   ├── AuthContext.jsx   # Firebase auth state provider
│   │   ├── ProfileContext.jsx # Active profile (child) provider
│   │   └── LanguageContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProfile.js
│   │   ├── useQRCodes.js
│   │   └── useTranslation.js
│   ├── services/
│   │   ├── api.js           # Axios instance (unified base URL)
│   │   ├── authService.js
│   │   ├── profileService.js
│   │   ├── qrService.js
│   │   ├── itemService.js
│   │   └── vehicleService.js
│   ├── components/
│   │   ├── ui/              # Reusable design system components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Toggle.jsx
│   │   │   ├── Spinner.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── Badge.jsx
│   │   │   └── LanguageSwitcher.jsx
│   │   ├── layout/
│   │   │   ├── AppShell.jsx  # Sidebar + header + main
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── BottomNav.jsx # Mobile bottom navigation
│   │   │   └── ProfileSwitcher.jsx
│   │   └── guards/
│   │       └── ProtectedRoute.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.jsx
│   │   ├── onboarding/
│   │   │   └── OnboardingPage.jsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx
│   │   ├── profile/
│   │   │   ├── PersonalProfilePage.jsx
│   │   │   ├── EmergencyContactsPage.jsx
│   │   │   ├── MedicalConditionsPage.jsx
│   │   │   ├── MedicationsPage.jsx
│   │   │   ├── AllergiesPage.jsx
│   │   │   ├── VaccinationsPage.jsx
│   │   │   ├── ProceduresPage.jsx
│   │   │   └── InsurancePage.jsx
│   │   ├── qr/
│   │   │   ├── MyQRCodesPage.jsx
│   │   │   ├── QRActivationPage.jsx
│   │   │   ├── ScannerPage.jsx  
│   │   │   └── ScanHistoryPage.jsx   # NEW
│   │   ├── scan-display/
│   │   │   └── QRDisplayPage.jsx     # Public scan page
│   │   ├── lost-found/
│   │   │   ├── ItemsPage.jsx
│   │   │   └── ItemActivationPage.jsx
│   │   ├── vehicles/                  # NEW - ZIDDIQR
│   │   │   ├── VehiclesPage.jsx
│   │   │   └── VehicleActivationPage.jsx
│   │   ├── alerts/                    # NEW
│   │   │   └── AlertsPage.jsx
│   │   └── settings/
│   │       ├── SettingsPage.jsx
│   │       └── ChildProfilesPage.jsx
│   ├── lib/
│   │   └── utils.js          # shadcn/ui cn() utility
│   ├── styles/
│   │   ├── global.css
│   │   ├── variables.css    # CSS custom properties (design tokens)
│   │   └── animations.css
│   └── utils/
│       ├── validators.js
│       ├── formatters.js
│       └── constants.js
├── index.html
├── vite.config.js
├── tailwind.config.js       # Required for shadcn/ui
├── components.json          # shadcn/ui config
├── package.json
└── .env.local

**Key dependencies:**

| Package | Purpose |
|---------|---------|
| `react` + `react-dom` 18.x | UI framework |
| `react-router-dom` v6 | Routing with auth guards |
| `firebase` 11.x | Auth + Firestore + Storage |
| `i18next` + `react-i18next` + `i18next-browser-languagedetector` + `i18next-http-backend` | Multi-language support |
| `axios` | API calls to backend |
| `react-hot-toast` | Single notification library |
| `framer-motion` | Animations (replaces react-reveal) |
| `@tanstack/react-query` | Server state management + caching |
| `lucide-react` | Icons (replaces react-icons) |
| `html5-qrcode` | QR scanning (replaces deprecated react-qr-reader) |
| `zod` | Form validation |
| `zustand` | Lightweight global state |

> [!TIP]
> **Removed:** Tailwind CSS, DaisyUI, React-Bootstrap, sweetalert, uniqid, generate-unique-id, react-reveal. Using **vanilla CSS with custom properties** for maximum control and minimal bundle.

---

### Design System (shadcn/ui + Tailwind CSS)

shadcn/ui uses CSS custom properties for theming. The design tokens live in `global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 40% 98%;       /* #F8FAFC */
    --foreground: 222 84% 5%;        /* #0F172A */
    --card: 0 0% 100%;
    --card-foreground: 222 84% 5%;
    --primary: 221 83% 53%;           /* #2563EB — medical blue */
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;  /* #64748B */
    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 84% 60%;        /* #EF4444 */
    --destructive-foreground: 210 40% 98%;
    --border: 214 32% 91%;           /* #E2E8F0 */
    --input: 214 32% 91%;
    --ring: 221 83% 53%;
    --radius: 0.75rem;
    /* Status colors */
    --success: 160 84% 39%;           /* #10B981 */
    --warning: 38 92% 50%;            /* #F59E0B */
    --info: 187 92% 41%;              /* #06B6D4 */
  }

  .dark {
    --background: 222 84% 5%;        /* #0F172A */
    --foreground: 210 40% 98%;
    --card: 217 33% 17%;              /* #1E293B */
    --card-foreground: 210 40% 98%;
    --primary: 217 91% 60%;           /* #3B82F6 */
    --primary-foreground: 222 84% 5%;
    --border: 217 33% 17%;
    --input: 217 33% 17%;
    --ring: 224 76% 48%;
  }
}

/* Multi-script font stack */
body {
  font-family: 'Inter', 'Noto Sans Devanagari', 'Noto Sans Tamil',
               'Noto Sans Telugu', 'Noto Sans Bengali', system-ui, sans-serif;
}
```

**shadcn/ui components to install:**

```bash
npx shadcn-ui@latest add button card dialog input select tabs
npx shadcn-ui@latest add avatar badge dropdown-menu sheet toast
npx shadcn-ui@latest add form label textarea separator skeleton
npx shadcn-ui@latest add switch popover command navigation-menu
```

**Framer Motion patterns:**

```jsx
// Page transitions
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
  <DashboardPage />
</motion.div>

// Staggered card animations
<motion.div variants={container} initial="hidden" animate="visible">
  {cards.map(card => (
    <motion.div variants={item}>{card}</motion.div>
  ))}
</motion.div>
```

---

### Auth & Routing

#### [NEW] `src/components/guards/ProtectedRoute.jsx`

Every route except `/auth`, `/qr/:passcode`, and legal docs will be wrapped in `ProtectedRoute`. This fixes the critical issue where only `/` was protected.

> [!NOTE]
> The **LanguageSwitcher** component is available on **both** the login screen and the dashboard header, so users can choose their preferred language *before* signing in.

```jsx
// Pseudocode — all routes except public ones are protected
<Routes>
  {/* Public — LoginPage includes LanguageSwitcher in top-right corner */}
  <Route path="/auth" element={<LoginPage />} />
  <Route path="/qr/:passcode" element={<QRDisplayPage />} />
  <Route path="/legal/*" element={<LegalPage />} />
  
  {/* ALL protected routes */}
  <Route element={<ProtectedRoute />}>
    <Route element={<AppShell />}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/profile/*" element={...} />
      <Route path="/qr-codes/*" element={...} />
      <Route path="/items/*" element={...} />
      <Route path="/vehicles/*" element={...} />
      <Route path="/alerts" element={<AlertsPage />} />
      <Route path="/settings/*" element={...} />
    </Route>
  </Route>
</Routes>
```

---

## Phase 2: Dashboard & Profile Management

### Revamped Dashboard UX

The new dashboard replaces the card grid with a **unified, product-aware hub**:

```
┌────────────────────────────────────┐
│  [Avatar] Yash Gupta  ▼           │  ← Profile switcher dropdown
│  [🇮🇳 हिंदी ▼]                     │  ← Language switcher
├────────────────────────────────────┤
│                                    │
│  ┌─ WeSafe QR ─┬─ Lost&Found ─┬─ ZIDDIQR ─┐  ← Product tabs
│  │  [active]   │              │            │
│  └─────────────┴──────────────┴────────────┘
│                                    │
│  [Summary Cards Row]               │
│  ┌──────┐ ┌──────┐ ┌──────┐      │
│  │ 3 QRs│ │0 Scan│ │1 Alert│     │
│  └──────┘ └──────┘ └──────┘      │
│                                    │
│  [Quick Actions Grid]              │
│  ┌──────────┐ ┌──────────┐        │
│  │Personal  │ │Emergency │        │
│  │Profile   │ │Contacts  │        │
│  └──────────┘ └──────────┘        │
│  ┌──────────┐ ┌──────────┐        │
│  │Medical   │ │My QR     │        │
│  │Info      │ │Codes     │        │
│  └──────────┘ └──────────┘        │
│                                    │
│  [Recent Scans Timeline] ← NEW    │
│                                    │
├────────────────────────────────────┤
│  [Home] [QR] [Scan] [Alerts] [⋯]  │  ← Bottom navigation
└────────────────────────────────────┘
```

**Key UX improvements:**
- **Product tabs** at the top — seamlessly switch between WeSafe, L&F, ZIDDIQR
- **Profile switcher** in the header — dropdown with avatars for child profiles
- **Summary cards** showing real-time stats (total QRs, scans this week, active alerts)
- **Recent scans timeline** — NEW feature showing scan activity
- **Bottom navigation** on mobile — persistent navigation without the current splash-screen delays
- **No splash screen** — instant page transitions with skeleton loaders

### Profile Management

#### [MODIFY] Profile editing approach

Replace individual route-per-form pattern (`/mediccond/details`, `/allergies/details`, etc.) with a **tabbed profile page**:

```
/profile
  ├── /personal      → Personal information form
  ├── /emergency     → Emergency contacts list + add
  ├── /medical       → Tabbed: Conditions | Medications | Allergies | Vaccinations | Procedures
  └── /insurance     → Insurance details
```

Each sub-page reads/writes from the **same Firestore path** as the current app (`Users/{uid}/ChildList/{childId}/data/...`) to maintain backward compatibility.

### Child Profile (Multi-Profile) System

#### [MODIFY] Profile switching

Replace prop-drilling `Switcheduser` with a `ProfileContext`:

```jsx
// ProfileContext provides:
{
  activeProfile: { id: "child1", name: "Yash Gupta", ... },
  profiles: [...], // All child profiles
  switchProfile: (childId) => void,
  addProfile: (data) => void,
}
```

This context reads from `Users/{uid}/ChildList/` — the same path the current app uses, so existing profiles appear instantly.

---

## Phase 3: QR Management & Scan Flow

### QR Codes Management Page

#### [NEW] `src/pages/qr/MyQRCodesPage.jsx`

Grouped by product type with status badges:

```
[WeSafe QR]    [Lost&Found QR]    [ZIDDIQR]

┌─────────────────────────────────┐
│ 🟢 My Safety QR                │
│ Passcode: xK9mN2pQ             │
│ Linked to: Yash Gupta          │
│ Last scanned: 2 days ago       │
│ [View] [Disable] [Share]       │
└─────────────────────────────────┘
```

### Scan Display Page (Public)

#### [MODIFY] `src/pages/scan-display/QRDisplayPage.jsx`

**Security fix:** Only display fields the user has explicitly marked as public:

```jsx
// Instead of rendering ALL fields:
// ❌ Old: render userData.bloodGroup, userData.height, userData.weight, etc.
// ✅ New: only render fields from a user-controlled "public_fields" list

const publicFields = profileData.public_fields || ["name", "phone", "blood_group"];
// Only render fields in this list
```

**Data flow change:**
- Current: Frontend calls external API → renders everything
- New: Frontend calls backend → backend filters by `public_fields` → returns only allowed fields

### Scan History & Alerts (NEW)

#### [NEW] `src/pages/qr/ScanHistoryPage.jsx`
#### [NEW] `src/pages/alerts/AlertsPage.jsx`

These are entirely new features. Scan logs will be stored in a `scan_logs` collection (or on the external backend).

---

## Phase 4: Lost & Found + ZIDDIQR

### Lost & Found Items

#### [MODIFY] Items Management

The new Node.js backend on Render replaces the old `REACT_APP_lostAndFound` API:
- Item cards with images (using shadcn/ui Card + framer-motion hover effects)
- Status toggle (Lost / Found) using shadcn/ui Switch
- Scan notifications
- DND toggle preserved

### ZIDDIQR (Vehicle Management)

#### [NEW] Vehicle pages

The current codebase already has a `qrType === "cars"` branch in `Items.js`. The new app surfaces this as a first-class product:
- Vehicle registration form (model, license plate, color) using shadcn/ui Form
- "Contact Owner" page for scanners with call/message actions
- Call/message toggle using shadcn/ui Switch

---

## Phase 5: Security & Backend

### Security Fixes (Priority Order)

| # | Fix | How |
|---|-----|-----|
| 1 | **Protect all routes** | Wrap every non-public route in `ProtectedRoute` component |
| 2 | **Remove API keys from frontend** | Move CRM API key, WhatsApp token to backend environment |
| 3 | **Field-level filtering on scan** | Backend returns only `public_fields` for QR scan display |
| 4 | **Stop PII in localStorage** | Use React state/context only; clear on logout |
| 5 | **Fix JSON string interpolation** | Use `JSON.stringify()` for emergency contact data |
| 6 | **Tighten Firestore rules** | Incremental: first add per-collection rules, then field-level |
| 7 | **Hash PINs** | Use bcrypt on backend before writing to Firestore |
| 8 | **Rate limit scans** | Add rate limiting middleware on the scan API endpoint |

### Proposed Firestore Rules (Phase 1 — Non-Breaking)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /Users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // QR codes: anyone authenticated can read (for activation check)
    // Only owner can write
    match /QRCode/{qrId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource == null || resource.data.UserID == '' || 
         resource.data.UserID.matches(request.auth.uid + '.*'));
    }
    
    // Partners: public read (existing behavior preserved)
    match /Partners/{partnerId} {
      allow read: if true;
    }
  }
}
```

> [!IMPORTANT]
> These rules are web-only safe. Since there is no Android app to worry about, we can deploy tighter rules immediately.

### Backend — Node.js on Render

#### [NEW] Unified backend (replaces both `REACT_APP_domainForDoc` and `REACT_APP_lostAndFound`)

Full backend rewrite deployed on **Render** as a Web Service:

```
wesafe-backend/
├── src/
│   ├── server.js              # Express app entry
│   ├── config/
│   │   └── firebase-admin.js  # Firebase Admin SDK init
│   ├── middleware/
│   │   ├── auth.js            # Firebase token verification
│   │   ├── rateLimiter.js     # express-rate-limit
│   │   ├── cors.js            # CORS whitelist
│   │   └── errorHandler.js    # Centralized error handling
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── qr.routes.js
│   │   ├── profile.routes.js
│   │   ├── scan.routes.js
│   │   ├── item.routes.js
│   │   ├── vehicle.routes.js
│   │   ├── alert.routes.js
│   │   └── payment.routes.js  # Razorpay integration
│   ├── services/
│   │   ├── firestore.js       # Firebase Admin Firestore ops
│   │   ├── whatsapp.js        # WhatsApp API (token server-side only)
│   │   ├── sms.js             # SMS gateway
│   │   ├── razorpay.js        # Razorpay server-side
│   │   └── crm.js             # Partner CRM integration
│   └── utils/
│       ├── validators.js
│       └── constants.js
├── package.json
├── render.yaml                # Render deployment config
└── .env                       # ALL secrets here, never in frontend
```

**Render deployment config (`render.yaml`):**
```yaml
services:
  - type: web
    name: wesafe-api
    runtime: node
    plan: starter
    buildCommand: npm install
    startCommand: node src/server.js
    envVars:
      - key: FIREBASE_SERVICE_ACCOUNT
        sync: false
      - key: WHATSAPP_API_TOKEN
        sync: false
      - key: RAZORPAY_KEY_SECRET
        sync: false
      - key: CRM_API_KEY
        sync: false
      - key: NODE_ENV
        value: production
```

---

## Phase 6: Internationalization (i18n)

### Language Support Matrix — 20 Languages

#### Indian Languages (P0-P1)

| Priority | Language | Code | Script | Font |
|----------|----------|------|--------|------|
| 🟢 P0 | English | `en` | Latin | Inter |
| 🟢 P0 | Hindi | `hi` | Devanagari | Noto Sans Devanagari |
| 🟡 P1 | Tamil | `ta` | Tamil | Noto Sans Tamil |
| 🟡 P1 | Telugu | `te` | Telugu | Noto Sans Telugu |
| 🟡 P1 | Bengali | `bn` | Bengali | Noto Sans Bengali |
| 🟡 P1 | Marathi | `mr` | Devanagari | Noto Sans Devanagari |
| 🟡 P1 | Gujarati | `gu` | Gujarati | Noto Sans Gujarati |
| 🟡 P1 | Kannada | `kn` | Kannada | Noto Sans Kannada |
| 🟡 P1 | Malayalam | `ml` | Malayalam | Noto Sans Malayalam |
| 🟡 P1 | Punjabi | `pa` | Gurmukhi | Noto Sans Gurmukhi |

#### International Languages (P2)

| Priority | Language | Code | Script | Font |
|----------|----------|------|--------|------|
| 🔵 P2 | Spanish | `es` | Latin | Inter |
| 🔵 P2 | French | `fr` | Latin | Inter |
| 🔵 P2 | German | `de` | Latin | Inter |
| 🔵 P2 | Portuguese | `pt` | Latin | Inter |
| 🔵 P2 | Arabic | `ar` | Arabic | Noto Sans Arabic |
| 🔵 P2 | Japanese | `ja` | CJK | Noto Sans JP |
| 🔵 P2 | Chinese (Simplified) | `zh` | CJK | Noto Sans SC |
| 🔵 P2 | Korean | `ko` | Hangul | Noto Sans KR |
| 🔵 P2 | Russian | `ru` | Cyrillic | Inter |
| 🔵 P2 | Turkish | `tr` | Latin | Inter |

> [!NOTE]
> Arabic (`ar`) requires **RTL (right-to-left)** layout support. The app will detect `dir="rtl"` and apply mirrored layouts using Tailwind's `rtl:` variant.

### i18n Implementation

#### [NEW] `src/i18n.js`

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

const SUPPORTED_LANGS = [
  // Indian
  'en','hi','ta','te','bn','mr','gu','kn','ml','pa',
  // International
  'es','fr','de','pt','ar','ja','zh','ko','ru','tr'
];

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGS,
    interpolation: { escapeValue: false },
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
  });
```

#### [NEW] Language switcher (shadcn/ui dropdown)

Using shadcn/ui `DropdownMenu` in the header, grouped by region:
- 🇮🇳 **Indian Languages** — Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi
- 🌍 **International** — Spanish, French, German, Portuguese, Arabic, Japanese, Chinese, Korean, Russian, Turkish

Persists selection to `localStorage` key `i18nextLng`.

**Font strategy:** Dynamic Google Fonts loading — only load the Noto Sans variant needed for the active language to minimize bundle size.

---

## Migration Strategy

### Data Compatibility

| Current Path | New App Reads | Backward Compatible |
|-------------|---------------|---------------------|
| `Users/{uid}` | ✅ Same path | ✅ Yes |
| `Users/{uid}/ChildList/{childId}` | ✅ Same path | ✅ Yes |
| `Users/{uid}/ChildList/{childId}/data/personal_information` | ✅ Same path | ✅ Yes |
| `Users/{uid}/ChildList/{childId}/data/emergencycont/emergencycont/{docId}` | ✅ Same path | ✅ Yes |
| `QRCode/{passcode}` | ✅ Same path | ✅ Yes |
| External API endpoints | ✅ Same URLs (via env vars) | ✅ Yes |

**Key principle:** The new Vite app reads and writes to the **exact same Firestore paths and external APIs** as the current CRA app. No data migration needed.

### Deployment Strategy

1. **Week 1-4:** Build and test on `app.wesafeqr.com` (staging subdomain)
2. **Week 5:** Internal testing with existing users' data (read-only)
3. **Week 6:** Swap DNS — `web.wesafeqr.com` → new app; old app at `legacy.wesafeqr.com`
4. **Week 7+:** Monitor metrics, fix issues, remove legacy fallback

---

## Verification Plan

### Automated Verification

After building each phase, verify with:

```bash
# Build check — ensure no compilation errors
cd wesafe-app
npm run build

# Lint check
npm run lint
```

### Manual Verification (Phase by Phase)

#### Phase 1 Verification
1. Open `http://localhost:5173` — should show login page (no splash screen)
2. Click "Sign in with Google" — should authenticate and redirect to dashboard
3. Try navigating to `/profile/personal` without auth — should redirect to `/auth`
4. Check browser DevTools → Application → Local Storage — should have NO PII stored
5. Open Network tab — should NOT see any API calls with exposed keys

#### Phase 2 Verification
1. Log in → Dashboard should show product tabs (WeSafe, L&F, ZIDDIQR)
2. Click profile switcher → existing child profiles should appear (Yash Gupta, Yg junior, etc.)
3. Switch to a child profile → all data should load from existing Firestore path
4. Edit personal profile → save → verify data persists in Firestore at old path
5. Switch language to Hindi → all UI labels should display in Hindi
6. Refresh page → language preference should persist

#### Phase 3 Verification
1. Navigate to "My QR Codes" → existing QR codes should appear
2. Open `/qr/{existing-passcode}` in incognito → should show restricted profile (only public fields)
3. Verify emergency contacts are NOT fully visible to scanner (only masked numbers)
4. Check scan is logged (if scan_logs endpoint exists)

#### Phase 4 Verification
1. Navigate to Lost & Found tab → existing items should load from L&F API
2. Register a new item → verify it appears on the external L&F backend
3. Navigate to ZIDDIQR tab → vehicle registration form should work

### User Acceptance Testing (UAT)
> [!TIP]
> I recommend deploying the staging app at `app.wesafeqr.com` and having you + a few test users interact with it using their real accounts. Existing data should appear without any manual migration.

---

## What Gets Removed

| Item | Reason |
|------|--------|
| `Documents` feature | User confirmed not needed |
| DaisyUI + React-Bootstrap + React-Bootstrap-v5 | Replaced with shadcn/ui |
| `react-reveal` | Replaced with Framer Motion |
| `sweetalert` + `react-toastify` | Replaced with shadcn/ui Toast |
| `generate-unique-id` + `uniqid` | Use `crypto.randomUUID()` |
| `react-qr-reader` | Replaced with `html5-qrcode` |
| `react-share` | Will use native Web Share API |
| Splash screen (1s delay) | Replaced with instant load + shadcn/ui Skeleton |
| `localStorage` PII storage | Replaced with React context + zustand |
| Frontend WhatsApp API calls | Moved to Render backend |
| Frontend CRM API calls | Moved to Render backend |
| External API servers | Replaced by unified backend on Render |

---

## What Gets Added (NEW Features)

| Feature | Value |
|---------|-------|
| **shadcn/ui Design System** | Beautiful, accessible, customizable component library |
| **Framer Motion Animations** | Smooth page transitions + micro-interactions |
| **Scan History** | Users see who scanned their QR, when, and where |
| **Alerts Dashboard** | Centralized view of all emergency alerts |
| **Product Tabs** | Seamless switching between WeSafe, L&F, ZIDDIQR |
| **ZIDDIQR in Web** | Vehicle management as first-class product |
| **Multi-language** | 20 languages (10 Indian + 10 international) with RTL support |
| **Dark Mode** | shadcn/ui theme toggle with CSS custom properties |
| **Public Field Control** | Users choose which fields are visible on scan |
| **Bottom Navigation** | Mobile-optimized persistent nav |
| **Skeleton Loaders** | shadcn/ui Skeleton for instant perceived performance |
| **Unified Backend on Render** | Single API replacing two external servers |
