import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { getAllUserScans } from '@/services/qrService'

// ─── Config ───────────────────────────────────────────────────────────────────

const scannerTypeConfig = {
  'Emergency Responder': {
    bg:  'bg-rose-100 dark:bg-rose-900/30',
    text:'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
    icon:'emergency',
  },
  'Public': {
    bg:  'bg-indigo-100 dark:bg-indigo-900/30',
    text:'text-indigo-700 dark:text-indigo-400',
    dot: 'bg-indigo-500',
    icon:'person',
  },
  'Unknown': {
    bg:  'bg-muted',
    text:'text-muted-foreground',
    dot: 'bg-muted-foreground',
    icon:'help',
  },
}

function getScannerConfig(type) {
  return scannerTypeConfig[type] ?? scannerTypeConfig['Unknown']
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return (
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  )
}

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return formatDate(ts)
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className}`} />
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="relative pl-12">
          <div className="absolute left-3.5 top-4 -translate-x-1/2 w-3 h-3 rounded-full bg-muted" />
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </div>
  )
}

// ─── Animation variants ───────────────────────────────────────────────────────

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item      = { hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }

// ─── Component ────────────────────────────────────────────────────────────────

export function ScanHistoryPage() {
  const { user } = useAuth()
  const { t } = useTranslation()

  const { data: scans = [], isLoading, isError } = useQuery({
    queryKey: ['scan-history', user?.uid],
    queryFn: () => getAllUserScans(user.uid),
    enabled: !!user?.uid,
    staleTime: 2 * 60_000, // 2 min — scans update more frequently
  })

  return (
    <div className="min-h-screen bg-background">
      <Header title={t('qr.scan_history')} showBack />

      <div className="px-4 py-6 max-w-2xl mx-auto lg:px-6 lg:py-8">

        {/* Error */}
        {isError && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <span className="material-symbols-outlined text-destructive text-3xl">error</span>
            </div>
            <h3 className="font-semibold mb-1">{t('qr.failed_load_history')}</h3>
            <p className="text-muted-foreground text-sm">{t('alerts.try_again')}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <>
            <Skeleton className="h-4 w-32 mb-5" />
            <div className="relative">
              <div className="absolute left-5 top-6 bottom-6 w-px bg-border" />
              <SkeletonList />
            </div>
          </>
        )}

        {/* Empty state */}
        {!isLoading && !isError && scans.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
              <span className="material-symbols-outlined text-4xl text-muted-foreground/30">qr_code_scanner</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('qr.no_scans')}</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
              {t('qr.no_scans_desc')}
            </p>
          </div>
        )}

        {/* Scan list */}
        {!isLoading && !isError && scans.length > 0 && (
          <>
            {/* Summary header */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                {scans.length} {t('qr.scans_recorded')}
              </p>
              {/* Most recent */}
              <span className="text-xs text-muted-foreground">
                {t('qr.last_label')}: {timeAgo(scans[0]?.scannedAt)}
              </span>
            </div>

            {/* Timeline */}
            <motion.div variants={container} initial="hidden" animate="show" className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-5 top-6 bottom-6 w-px bg-border" />

              <div className="space-y-3">
                {scans.map((scan, index) => {
                  const cfg = getScannerConfig(scan.scannerType)
                  return (
                    <motion.div key={scan.id ?? index} variants={item} className="relative pl-12">
                      {/* Timeline dot */}
                      <div className={`absolute left-3.5 top-4 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-background ring-2 ring-primary/20 ${index === 0 ? 'bg-primary' : 'bg-border'}`} />

                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-start gap-4">
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                            <span className={`material-symbols-outlined filled ${cfg.text}`} style={{ fontSize: '18px' }}>
                              {cfg.icon}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              {/* QR name */}
                              <p className="font-semibold truncate text-sm">{scan.qrName || t('qr.unknown_qr')}</p>
                              {/* Scanner type badge */}
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                {scan.scannerType || 'Unknown'}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{formatDate(scan.scannedAt)}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}

        <p className="text-xs text-muted-foreground text-center mt-8">
          {t('qr.scan_log_note')}
        </p>
      </div>
    </div>
  )
}
