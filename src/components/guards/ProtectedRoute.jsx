import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useContext } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ProfileContext } from '@/contexts/ProfileContext'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const { profiles, loadingProfiles } = useContext(ProfileContext)
  const location = useLocation()

  // Wait for BOTH auth AND first Firestore snapshot before deciding
  if (loading || loadingProfiles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  // New user with no profiles → onboarding
  // Guard against /onboarding itself to prevent infinite redirect
  if (profiles.length === 0 && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
