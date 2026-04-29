import { Suspense, lazy, useEffect, useState, useContext } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useSearchParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, AuthContext } from '@/contexts/AuthContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/guards/ProtectedRoute'

// ── Eagerly loaded (needed for first paint) ───────────────────────────────────
import { LoginPage }    from '@/pages/auth/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// ── Lazily loaded (loaded only when the user navigates there) ─────────────────
const QRActivationFlow      = lazy(() => import('@/pages/qr/QRActivationFlow').then(m => ({ default: m.QRActivationFlow })))
const LNFQRActivationFlow   = lazy(() => import('@/pages/qr/LNFQRActivationFlow').then(m => ({ default: m.LNFQRActivationFlow })))
const DashboardPage         = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const QRDisplayPage         = lazy(() => import('@/pages/scan-display/QRDisplayPage').then(m => ({ default: m.QRDisplayPage })))
const PersonalProfilePage   = lazy(() => import('@/pages/profile/PersonalProfilePage').then(m => ({ default: m.PersonalProfilePage })))
const EmergencyContactsPage = lazy(() => import('@/pages/profile/EmergencyContactsPage').then(m => ({ default: m.EmergencyContactsPage })))
const MedicalPage           = lazy(() => import('@/pages/profile/MedicalPage').then(m => ({ default: m.MedicalPage })))
const InsurancePage         = lazy(() => import('@/pages/profile/InsurancePage').then(m => ({ default: m.InsurancePage })))
const MyQRCodesPage         = lazy(() => import('@/pages/qr/MyQRCodesPage').then(m => ({ default: m.MyQRCodesPage })))
const QRActivationPage      = lazy(() => import('@/pages/qr/QRActivationPage').then(m => ({ default: m.QRActivationPage })))
const ScannerPage           = lazy(() => import('@/pages/qr/ScannerPage').then(m => ({ default: m.ScannerPage })))
const ScanHistoryPage       = lazy(() => import('@/pages/qr/ScanHistoryPage').then(m => ({ default: m.ScanHistoryPage })))
const AlertsPage            = lazy(() => import('@/pages/alerts/AlertsPage').then(m => ({ default: m.AlertsPage })))
const ItemsPage             = lazy(() => import('@/pages/lost-found/ItemsPage').then(m => ({ default: m.ItemsPage })))
const VehiclesPage          = lazy(() => import('@/pages/vehicles/VehiclesPage').then(m => ({ default: m.VehiclesPage })))
const SettingsPage          = lazy(() => import('@/pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const ChildProfilesPage     = lazy(() => import('@/pages/settings/ChildProfilesPage').then(m => ({ default: m.ChildProfilesPage })))
const LanguageSwitcherPage  = lazy(() => import('@/pages/settings/LanguageSwitcherPage').then(m => ({ default: m.LanguageSwitcherPage })))
const ShopPage              = lazy(() => import('@/pages/shop/ShopPage').then(m => ({ default: m.ShopPage })))
const OnboardingPage        = lazy(() => import('@/pages/onboarding/OnboardingPage').then(m => ({ default: m.OnboardingPage })))

// ── Fallback shown while a lazy chunk loads ───────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        <div className="space-y-2">
          <div className="w-48 h-2 bg-muted animate-pulse rounded-full" />
          <div className="w-32 h-2 bg-muted animate-pulse rounded-full mx-auto" />
        </div>
      </div>
    </div>
  )
}

// ── Blocks render until Firebase Auth resolves — prevents flash ───────────────
function AuthGate({ children }) {
  const { loading } = useContext(AuthContext)
  if (loading) return <PageLoader />
  return children
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
})

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// Reads ?qr= from URL / sessionStorage. When active, renders ONLY the
// QR activation flow — the normal route tree is skipped entirely so there
// is never a double login screen.
function AppRoutes() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [pendingQR, setPendingQR] = useState(
    () => sessionStorage.getItem('wesafe_pending_qr')
  )
  const [pendingLNFQR, setPendingLNFQR] = useState(
    () => sessionStorage.getItem('wesafe_pending_lnfqr')
  )

  useEffect(() => {
    const qr = searchParams.get('qr')
    if (qr?.trim()) {
      sessionStorage.setItem('wesafe_pending_qr', qr.trim())
      setPendingQR(qr.trim())
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const lnfqr = searchParams.get('lnfqr')
    if (lnfqr?.trim()) {
      sessionStorage.setItem('wesafe_pending_lnfqr', lnfqr.trim())
      setPendingLNFQR(lnfqr.trim())
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handleQRDone = () => {
    sessionStorage.removeItem('wesafe_pending_qr')
    setPendingQR(null)
  }

  const handleLNFQRDone = () => {
    sessionStorage.removeItem('wesafe_pending_lnfqr')
    setPendingLNFQR(null)
  }

  // LNF QR activation takes priority — checked before wesafe QR
  if (pendingLNFQR) {
    return <LNFQRActivationFlow passcode={pendingLNFQR} onDone={handleLNFQRDone} />
  }

  // WeSafe QR activation takes over the entire screen — no other route renders
  if (pendingQR) {
    return <QRActivationFlow passcode={pendingQR} onDone={handleQRDone} />
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/auth" element={<LoginPage />} />
        <Route path="/qr/:passcode" element={<QRDisplayPage />} />
        <Route path="*" element={<NotFoundPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          {/* Onboarding — auth required, no bottom nav */}
          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route element={<AppShell />}>
            {/* Dashboard */}
            <Route path="/" element={<DashboardPage />} />

            {/* Profile */}
            <Route path="/profile/personal"  element={<PersonalProfilePage />} />
            <Route path="/profile/emergency" element={<EmergencyContactsPage />} />
            <Route path="/profile/medical"   element={<MedicalPage />} />
            <Route path="/profile/insurance" element={<InsurancePage />} />

            {/* QR */}
            <Route path="/qr-codes"          element={<MyQRCodesPage />} />
            <Route path="/qr-codes/activate" element={<QRActivationPage />} />
            <Route path="/scan"              element={<ScannerPage />} />
            <Route path="/scan-history"      element={<ScanHistoryPage />} />

            {/* Alerts */}
            <Route path="/alerts" element={<AlertsPage />} />

            {/* Lost & Found */}
            <Route path="/items" element={<ItemsPage />} />

            {/* Vehicles */}
            <Route path="/vehicles" element={<VehiclesPage />} />

            {/* Settings */}
            <Route path="/settings"           element={<SettingsPage />} />
            <Route path="/settings/profiles"  element={<ChildProfilesPage />} />
            <Route path="/settings/language"  element={<LanguageSwitcherPage />} />

            {/* Shop */}
            <Route path="/shop" element={<ShopPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ProfileProvider>
            <BrowserRouter>
              <ScrollToTop />
              <AuthGate>
                <AppRoutes />
              </AuthGate>
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                }}
              />
            </BrowserRouter>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
