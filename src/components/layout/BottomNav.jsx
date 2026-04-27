import { NavLink, useLocation } from 'react-router-dom'
import { motion, LayoutGroup } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { getUnreadCount } from '@/services/alertService'

const NAV_ITEMS = [
  { path: '/', icon: 'home', key: 'home' },
  { path: '/qr-codes', icon: 'qr_code_2', key: 'qr' },
  { path: '/scan', icon: 'qr_code_scanner', key: 'scan' },
  { path: '/alerts', icon: 'notifications', key: 'alerts', showBadge: true },
  { path: '/shop', icon: 'shopping_bag', key: 'shop' },
  { path: '/settings', icon: 'settings', key: 'settings' },
]

export function BottomNav() {
  const location = useLocation()
  const { user } = useAuth()
  const { t } = useTranslation()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['alerts-unread', user?.uid],
    queryFn: () => getUnreadCount(user.uid),
    enabled: !!user?.uid,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      {/* Floating pill island */}
      <div className="bg-card/92 backdrop-blur-2xl border border-border/50 rounded-[22px] shadow-xl overflow-hidden"
        style={{ boxShadow: '0 4px 24px hsl(237 46% 62% / 0.12), 0 1px 3px hsl(237 46% 62% / 0.08)' }}
      >
        <LayoutGroup id="bottom-nav">
          <div className="flex items-center justify-around h-[62px] px-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path))
              const hasBadge = item.showBadge && unreadCount > 0

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="relative flex flex-col items-center justify-center flex-1 py-2 min-w-0 rounded-xl"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {/* Sliding active pill */}
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-pill"
                      className="absolute inset-1 bg-primary/10 rounded-[14px]"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  )}

                  {/* Icon with badge */}
                  <div className="relative z-10">
                    <span
                      className={cn(
                        'material-symbols-outlined transition-all duration-200',
                        isActive ? 'filled text-primary' : 'text-muted-foreground',
                      )}
                      style={{ fontSize: '22px' }}
                    >
                      {item.icon}
                    </span>
                    {hasBadge && (
                      <span className="absolute -top-1 -right-1.5 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 rounded-full bg-destructive text-white text-[8px] font-bold leading-none ring-2 ring-card">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      'relative z-10 text-[9.5px] font-semibold leading-none mt-0.5 transition-colors duration-200',
                      isActive ? 'text-primary' : 'text-muted-foreground/70',
                    )}
                  >
                    {t(`nav.${item.key}`)}
                  </span>
                </NavLink>
              )
            })}
          </div>
        </LayoutGroup>
      </div>
    </nav>
  )
}
