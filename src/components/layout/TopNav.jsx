import { NavLink, Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getUnreadCount } from '@/services/alertService'
import { LanguagePicker } from '@/components/ui/LanguagePicker'

const NAV_ITEMS = [
  { path: '/', icon: 'home', key: 'home' },
  { path: '/qr-codes', icon: 'qr_code_2', key: 'qr' },
  { path: '/scan', icon: 'qr_code_scanner', key: 'scan' },
  { path: '/alerts', icon: 'notifications', key: 'alerts' },
  { path: '/shop', icon: 'shopping_bag', key: 'shop' },
  { path: '/settings', icon: 'settings', key: 'settings' },
]

export function TopNav() {
  const location = useLocation()
  const { user } = useAuth()
  const { t } = useTranslation()

  const displayName = user?.displayName || 'User'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['alerts-unread', user?.uid],
    queryFn: () => getUnreadCount(user.uid),
    enabled: !!user?.uid,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  return (
    <header
      className="hidden lg:flex fixed top-0 left-0 right-0 z-50 h-16 items-center px-8 gap-6"
      style={{
        background: 'hsl(var(--background) / 0.88)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        borderBottom: '1px solid hsl(var(--border) / 0.7)',
        boxShadow: '0 1px 0 hsl(var(--border) / 0.5), 0 2px 12px hsl(var(--foreground) / 0.04)',
      }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 mr-4 flex-shrink-0 group">
        <img
          src="/logo1.png"
          alt="WeSafe QR"
          className="w-8 h-8 rounded-lg object-cover transition-shadow duration-200 group-hover:shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
          style={{ boxShadow: '0 2px 8px hsl(var(--primary) / 0.25)' }}
        />
        <span className="font-bold text-lg tracking-tight">WeSafe QR</span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-0.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/80 active:scale-95'
              )}
            >
              <span
                className={cn('material-symbols-outlined', isActive && 'filled')}
                style={{ fontSize: '18px' }}
              >
                {item.icon}
              </span>
              {t(`nav.${item.key}`)}
            </NavLink>
          )
        })}
      </nav>

      {/* Right: language picker + notification bell + avatar */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <LanguagePicker />
        <Link
          to="/alerts"
          className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-accent/80 active:scale-95 transition-all duration-150"
          aria-label="Alerts"
        >
          <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: '20px' }}>
            notifications
          </span>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-destructive text-white text-[9px] font-bold leading-none ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <Link to="/settings">
          <Avatar
            className="h-9 w-9 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'hsl(var(--primary))',
              boxShadow: '0 0 0 2px hsl(var(--primary) / 0.25), 0 2px 8px hsl(var(--primary) / 0.35)',
            }}
          >
            <AvatarImage src={user?.photoURL} alt={displayName} />
            <AvatarFallback
              className="text-xs font-bold"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              {initials || <span className="material-symbols-outlined filled" style={{ fontSize: '18px', color: 'hsl(var(--primary-foreground))' }}>person</span>}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
