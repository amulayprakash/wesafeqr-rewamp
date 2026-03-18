import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', icon: 'home', label: 'Home' },
  { path: '/qr-codes', icon: 'qr_code_2', label: 'QR' },
  { path: '/scan', icon: 'qr_code_scanner', label: 'Scan' },
  { path: '/alerts', icon: 'notifications', label: 'Alerts' },
  { path: '/settings', icon: 'settings', label: 'Settings' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn(
                "material-symbols-outlined text-2xl",
                isActive && "filled"
              )}>
                {item.icon}
              </span>
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
