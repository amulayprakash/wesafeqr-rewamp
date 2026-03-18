import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/guards/ProtectedRoute'

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage'

// Dashboard
import { DashboardPage } from '@/pages/dashboard/DashboardPage'

// Profile Pages
import { PersonalProfilePage } from '@/pages/profile/PersonalProfilePage'
import { EmergencyContactsPage } from '@/pages/profile/EmergencyContactsPage'
import { MedicalPage } from '@/pages/profile/MedicalPage'
import { InsurancePage } from '@/pages/profile/InsurancePage'

// QR Pages
import { MyQRCodesPage } from '@/pages/qr/MyQRCodesPage'
import { ScannerPage } from '@/pages/qr/ScannerPage'
import { ScanHistoryPage } from '@/pages/qr/ScanHistoryPage'

// Other Protected Pages
import { AlertsPage } from '@/pages/alerts/AlertsPage'
import { ItemsPage } from '@/pages/lost-found/ItemsPage'
import { VehiclesPage } from '@/pages/vehicles/VehiclesPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { ChildProfilesPage } from '@/pages/settings/ChildProfilesPage'

// Public Pages
import { QRDisplayPage } from '@/pages/scan-display/QRDisplayPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<LoginPage />} />
              <Route path="/qr/:passcode" element={<QRDisplayPage />} />

              {/* Protected routes with AppShell layout */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  {/* Dashboard */}
                  <Route path="/" element={<DashboardPage />} />

                  {/* Profile */}
                  <Route path="/profile/personal" element={<PersonalProfilePage />} />
                  <Route path="/profile/emergency" element={<EmergencyContactsPage />} />
                  <Route path="/profile/medical" element={<MedicalPage />} />
                  <Route path="/profile/insurance" element={<InsurancePage />} />

                  {/* QR */}
                  <Route path="/qr-codes" element={<MyQRCodesPage />} />
                  <Route path="/scan" element={<ScannerPage />} />
                  <Route path="/scan-history" element={<ScanHistoryPage />} />

                  {/* Alerts */}
                  <Route path="/alerts" element={<AlertsPage />} />

                  {/* Lost & Found */}
                  <Route path="/items" element={<ItemsPage />} />

                  {/* Vehicles */}
                  <Route path="/vehicles" element={<VehiclesPage />} />

                  {/* Settings */}
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/settings/profiles" element={<ChildProfilesPage />} />
                </Route>
              </Route>
            </Routes>

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
    </QueryClientProvider>
  )
}

export default App
