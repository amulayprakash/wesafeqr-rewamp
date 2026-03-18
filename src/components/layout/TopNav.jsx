import { NavLink, Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const navItems = [
  { path: '/', icon: 'home', label: 'Home' },
  { path: '/qr-codes', icon: 'qr_code_2', label: 'QR Codes' },
  { path: '/scan', icon: 'qr_code_scanner', label: 'Scan' },
  { path: '/alerts', icon: 'notifications', label: 'Alerts' },
  { path: '/settings', icon: 'settings', label: 'Settings' },
]

export function TopNav() {
  const location = useLocation()
  const { user } = useAuth()

  const displayName = user?.displayName || 'User'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="hidden lg:flex fixed top-0 left-0 right-0 z-50 h-16 bg-card/95 backdrop-blur-md border-b border-border items-center px-8 gap-6 shadow-sm">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 mr-4 flex-shrink-0 group">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
          <span
            className="material-symbols-outlined text-primary-foreground filled"
            style={{ fontSize: '18px' }}
          >
            qr_code_2
          </span>
        </div>
        <span className="font-bold text-lg tracking-tight">WeSafe QR</span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1 flex-1">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <span
                className={cn(
                  'material-symbols-outlined',
                  isActive && 'filled'
                )}
                style={{ fontSize: '20px' }}
              >
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Right side: notification bell + avatar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link
          to="/alerts"
          className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-accent transition-colors"
          aria-label="Alerts"
        >
          <span
            className="material-symbols-outlined text-muted-foreground"
            style={{ fontSize: '20px' }}
          >
            notifications
          </span>
          {/* Unread dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-card" />
        </Link>

        <Link to="/settings">
          <Avatar className="h-9 w-9 ring-2 ring-border hover:ring-primary/50 transition-all duration-200 cursor-pointer">
            <AvatarImage src={user?.photoURL} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
