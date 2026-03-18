import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const mockScans = [
  { id: 1, qrName: 'Medical ID Card',  scannedAt: '2026-03-18T10:32:00Z', location: 'Mumbai, Maharashtra',     scannerType: 'Emergency Responder' },
  { id: 2, qrName: 'Medical ID Card',  scannedAt: '2026-03-16T14:15:00Z', location: 'Delhi, India',            scannerType: 'Unknown' },
  { id: 3, qrName: 'Leather Wallet',   scannedAt: '2026-03-15T09:00:00Z', location: 'Bangalore, Karnataka',   scannerType: 'Public' },
]

const scannerTypeConfig = {
  'Emergency Responder': { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500' },
  'Public':              { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500' },
  'Unknown':             { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' • ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }

export function ScanHistoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header title="Scan History" showBack />

      <div className="px-4 py-6 max-w-2xl mx-auto lg:px-6 lg:py-8">
        {mockScans.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
              <span className="material-symbols-outlined text-4xl text-muted-foreground/30">qr_code_scanner</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Scans Yet</h3>
            <p className="text-muted-foreground text-sm">When someone scans your QR code, it will appear here.</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">
              {mockScans.length} scan{mockScans.length !== 1 ? 's' : ''} recorded
            </p>

            {/* Timeline list */}
            <motion.div variants={container} initial="hidden" animate="show" className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-5 top-6 bottom-6 w-px bg-border" />

              <div className="space-y-3">
                {mockScans.map((scan, index) => {
                  const scfg = scannerTypeConfig[scan.scannerType] || scannerTypeConfig['Unknown']
                  return (
                    <motion.div key={scan.id} variants={item} className="relative pl-12">
                      {/* Timeline dot */}
                      <div className="absolute left-3.5 top-4 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-background bg-primary ring-2 ring-primary/20" />

                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-start gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-primary filled" style={{ fontSize: '18px' }}>
                              qr_code_scanner
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <p className="font-semibold truncate">{scan.qrName}</p>
                              {/* Color-coded scanner type */}
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${scfg.bg} ${scfg.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${scfg.dot}`} />
                                {scan.scannerType}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{formatDate(scan.scannedAt)}</p>
                            {scan.location && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>location_on</span>
                                {scan.location}
                              </p>
                            )}
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
          Scan logs are stored securely and used only for your safety monitoring.
        </p>
      </div>
    </div>
  )
}
