import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const alerts = [
  { id: 1, type: 'weather', icon: 'notifications_active', title: 'Weather Warning', time: 'JUST NOW', description: 'Severe storm alert in Brooklyn, NY area', action: 'View Map', isNew: true },
  { id: 2, type: 'health', icon: 'medical_services', title: 'Health Protocol Update', time: '45M AGO', description: 'Vaccination record updated', action: 'Review Record', isNew: true },
  { id: 3, type: 'system', icon: 'shield', title: 'System Check', time: 'YESTERDAY', description: 'All 3 safety contacts verified', isNew: false },
  { id: 4, type: 'scan', icon: 'qr_code_scanner', title: 'QR Code Scanned', time: '2 DAYS AGO', description: 'Your Medical ID was accessed by First Responder', isNew: false },
]

const typeConfig = {
  weather: { iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400', border: 'border-l-amber-400' },
  health:  { iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', border: 'border-l-emerald-400' },
  system:  { iconBg: 'bg-primary/10', iconColor: 'text-primary', border: 'border-l-primary' },
  scan:    { iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400', border: 'border-l-violet-400' },
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }

export function AlertsPage() {
  const newCount = alerts.filter((a) => a.isNew).length

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Alerts"
        rightAction={
          newCount > 0 && (
            <Badge variant="destructive" className="px-2">{newCount} NEW</Badge>
          )
        }
      />

      <div className="px-4 py-6 max-w-2xl mx-auto lg:px-6 lg:py-8">
        {/* Summary banner */}
        {newCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-destructive/90 to-rose-600 text-white p-5 mb-6"
          >
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none select-none">
              <span className="material-symbols-outlined filled" style={{ fontSize: '80px' }}>notifications_active</span>
            </div>
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined filled text-white text-2xl">warning</span>
              </div>
              <div>
                <p className="text-white/75 text-xs font-semibold uppercase tracking-wider mb-0.5">Attention Required</p>
                <p className="text-white font-bold text-lg leading-tight">
                  {newCount} new alert{newCount > 1 ? 's' : ''} need your review
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          All Notifications
        </p>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {alerts.map((alert) => {
            const cfg = typeConfig[alert.type] || typeConfig.system
            return (
              <motion.div key={alert.id} variants={item}>
                <Card className={`border-l-4 ${cfg.border} overflow-hidden transition-shadow hover:shadow-md ${alert.isNew ? 'bg-card shadow-sm' : 'bg-card/70'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 ${cfg.iconBg}`}>
                        <span className={`material-symbols-outlined filled ${cfg.iconColor}`}>{alert.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold leading-tight">{alert.title}</h3>
                            {alert.isNew && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                New
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">{alert.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{alert.description}</p>
                        {alert.action && (
                          <Button variant="outline" size="sm" className="h-8 text-xs font-medium">{alert.action}</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {alerts.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
              <span className="material-symbols-outlined text-4xl text-muted-foreground/50">notifications_off</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Alerts</h3>
            <p className="text-muted-foreground text-sm">You're all caught up! No new alerts at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
