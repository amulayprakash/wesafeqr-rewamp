import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { TopNav } from './TopNav'
import { useNotifications } from '@/hooks/useNotifications'

function NotificationManager() {
  useNotifications()
  return null
}

export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <NotificationManager />

      {/* Desktop top navigation */}
      <TopNav />

      {/* Main content — extra bottom padding for floating BottomNav on mobile */}
      <main
        className="lg:pb-0 lg:pt-16"
        style={{ paddingBottom: 'max(7rem, calc(5.5rem + env(safe-area-inset-bottom)))' }}
      >
        <Outlet />
      </main>

      {/* Mobile floating bottom navigation */}
      <BottomNav />
    </div>
  )
}
