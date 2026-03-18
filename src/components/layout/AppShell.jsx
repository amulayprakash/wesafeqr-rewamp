import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { TopNav } from './TopNav'

export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop top navigation (hidden on mobile) */}
      <TopNav />

      {/* Main content — extra bottom padding on mobile for BottomNav, top padding on desktop for TopNav */}
      <main className="pb-20 lg:pb-0 lg:pt-16">
        <Outlet />
      </main>

      {/* Mobile bottom navigation (hidden on desktop via lg:hidden inside BottomNav) */}
      <BottomNav />
    </div>
  )
}
