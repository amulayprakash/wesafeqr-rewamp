import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { getUserAlerts, markAlertRead, markAllAlertsRead } from '@/services/alertService'
import toast from 'react-hot-toast'

// ─── Type config ──────────────────────────────────────────────────────────────

const typeConfig = {
  weather:   { iconBg: 'bg-amber-100 dark:bg-amber-900/30',    iconColor: 'text-amber-600 dark:text-amber-400',    border: 'border-l-amber-400' },
  health:    { iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', border: 'border-l-emerald-400' },
  system:    { iconBg: 'bg-primary/10',                          iconColor: 'text-primary',                          border: 'border-l-primary' },
  scan:      { iconBg: 'bg-violet-100 dark:bg-violet-900/30',   iconColor: 'text-violet-600 dark:text-violet-400',   border: 'border-l-violet-400' },
  emergency: { iconBg: 'bg-destructive/10',                     iconColor: 'text-destructive',                      border: 'border-l-destructive' },
}

function getCfg(type) {
  return typeConfig[type] ?? typeConfig.system
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'JUST NOW'
  if (mins < 60)  return `${mins}M AGO`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}H AGO`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'YESTERDAY'
  if (days < 7)   return `${days} DAYS AGO`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase()
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className}`} />
}

// ─── Animation ────────────────────────────────────────────────────────────────

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item      = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }

// ─── Component ────────────────────────────────────────────────────────────────

export function AlertsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const { data: alerts = [], isLoading, isError } = useQuery({
    queryKey: ['alerts', user?.uid],
    queryFn: () => getUserAlerts(user.uid),
    enabled: !!user?.uid,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  const { mutate: readOne } = useMutation({
    mutationFn: ({ alertId, childId }) => markAlertRead(user.uid, childId, alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', user.uid] })
      queryClient.invalidateQueries({ queryKey: ['alerts-unread', user.uid] })
    },
  })

  const { mutate: readAll, isPending: markingAll } = useMutation({
    mutationFn: () => markAllAlertsRead(user.uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', user.uid] })
      queryClient.invalidateQueries({ queryKey: ['alerts-unread', user.uid] })
      toast.success(t('alerts.marked_all_read'))
    },
  })

  const newCount = alerts.filter((a) => !a.isRead).length

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={t('alerts.title')}
        rightAction={
          newCount > 0 && (
            <Badge variant="destructive" className="px-2">{newCount} {t('alerts.new')}</Badge>
          )
        }
      />

      <div className="px-4 py-6 max-w-2xl mx-auto lg:px-6 lg:py-8">

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <span className="material-symbols-outlined text-destructive text-3xl">error</span>
            </div>
            <h3 className="font-semibold mb-1">{t('alerts.failed_load')}</h3>
            <p className="text-muted-foreground text-sm">{t('alerts.try_again')}</p>
          </div>
        )}

        {/* Loaded */}
        {!isLoading && !isError && (
          <>
            {/* New alerts summary banner */}
            {newCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-destructive/90 to-rose-600 text-white p-5 mb-6"
              >
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none select-none">
                  <span className="material-symbols-outlined filled" style={{ fontSize: '80px' }}>notifications_active</span>
                </div>
                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined filled text-white text-2xl">warning</span>
                    </div>
                    <div>
                      <p className="text-white/75 text-xs font-semibold uppercase tracking-wider mb-0.5">{t('alerts.attention_required')}</p>
                      <p className="text-white font-bold text-lg leading-tight">
                        {t(newCount > 1 ? 'alerts.new_alerts_plural' : 'alerts.new_alerts', { count: newCount })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shrink-0 h-8 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                    onClick={() => readAll()}
                    disabled={markingAll}
                  >
                    {t('alerts.mark_all_read')}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Empty state */}
            {alerts.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                  <span className="material-symbols-outlined text-4xl text-muted-foreground/50">notifications_off</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('alerts.no_alerts')}</h3>
                <p className="text-muted-foreground text-sm">{t('alerts.all_caught_up_full')}</p>
              </div>
            )}

            {/* Alert list */}
            {alerts.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    {t('alerts.all_notifications')}
                  </p>
                  {newCount > 0 && (
                    <button
                      onClick={() => readAll()}
                      disabled={markingAll}
                      className="text-xs text-primary hover:underline disabled:opacity-50"
                    >
                      {t('alerts.mark_all_read')}
                    </button>
                  )}
                </div>

                <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
                  {alerts.map((alert) => {
                    const cfg = getCfg(alert.type)
                    return (
                      <motion.div key={alert.id} variants={item}>
                        <Card
                          className={`border-l-4 ${cfg.border} overflow-hidden transition-shadow hover:shadow-md cursor-pointer ${
                            alert.isRead ? 'bg-card/70 opacity-80' : 'bg-card shadow-sm'
                          }`}
                          onClick={() => !alert.isRead && readOne({ alertId: alert.id, childId: alert.childId })}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className={`flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 ${cfg.iconBg}`}>
                                <span className={`material-symbols-outlined filled ${cfg.iconColor}`}>
                                  {alert.icon || 'notifications'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold leading-tight">{alert.title}</h3>
                                    {!alert.isRead && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                        {t('alerts.new_badge')}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
                                    {timeAgo(alert.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{alert.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
