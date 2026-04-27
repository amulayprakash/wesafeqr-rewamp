import { useContext } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { ProfileContext } from '@/contexts/ProfileContext'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { getUserVehicles, updateVehicle } from '@/services/vehicleService'
import { getAllProfilesLNFQRs } from '@/services/lnfQRService'
import { isBackendConfigured } from '@/services/api'
import toast from 'react-hot-toast'

// ─── Animation ────────────────────────────────────────────────────────────────
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item      = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className}`} />
}

// ─── Backend not configured banner ───────────────────────────────────────────
function BackendBanner() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-6 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 mb-3">
        <span className="material-symbols-outlined text-amber-600 text-3xl">cloud_off</span>
      </div>
      <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Backend Not Connected</h3>
      <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed max-w-xs mx-auto">
        Add <code className="bg-amber-100 dark:bg-amber-800/50 px-1 py-0.5 rounded text-xs font-mono">VITE_BACKEND_URL</code> to your <code className="bg-amber-100 dark:bg-amber-800/50 px-1 py-0.5 rounded text-xs font-mono">.env</code> file to connect to the WeSafe backend.
      </p>
    </div>
  )
}

// ─── Linked vehicle QR card ───────────────────────────────────────────────────
function LinkedVehicleQRCard({ qr }) {
  const ACCENT = 'hsl(197 84% 44%)'
  const vehicleIcon = qr.vehicleType === 'Car' ? 'directions_car' : qr.vehicleType === 'Motorbike' ? 'two_wheeler' : 'directions_car'
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
    >
      <div
        className="rounded-2xl border-2 p-4"
        style={{ borderColor: 'hsl(197 84% 44% / 0.3)', background: 'hsl(197 84% 44% / 0.04)' }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'hsl(197 84% 44% / 0.12)' }}
          >
            <span className="material-symbols-outlined filled text-xl" style={{ color: ACCENT }}>
              {vehicleIcon}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm truncate">{qr.name || qr.vehicleNumber || 'Vehicle'}</h3>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                style={{ background: 'hsl(142 71% 45% / 0.1)', color: 'hsl(142 71% 32%)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
            {qr.vehicleNumber && qr.vehicleNumber !== qr.name && (
              <div
                className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-lg border text-xs font-mono font-semibold tracking-widest"
                style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--muted))' }}
              >
                <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: '11px' }}>confirmation_number</span>
                {qr.vehicleNumber}
              </div>
            )}
            {qr.profileName && (
              <span
                className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))' }}
              >
                {qr.profileName}
              </span>
            )}
          </div>
        </div>

        {qr.vehicleType && (
          <p className="text-xs text-muted-foreground mb-2 pl-14">
            Type: <span className="font-medium text-foreground">{qr.vehicleType}</span>
          </p>
        )}

        {qr.wordFromOwner && (
          <div
            className="mb-3 px-3 py-2 rounded-xl text-xs italic leading-relaxed"
            style={{ background: 'hsl(197 84% 44% / 0.07)', color: 'hsl(var(--foreground) / 0.7)' }}
          >
            "{qr.wordFromOwner}"
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-mono">{qr.passcode}</span>
          <span>
            {qr.connectedAt
              ? `Registered ${new Date(qr.connectedAt?.toDate?.() || qr.connectedAt).toLocaleDateString()}`
              : 'Recently registered'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function VehiclesPage() {
  const queryClient = useQueryClient()
  const backendReady = isBackendConfigured()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { profiles } = useContext(ProfileContext)

  const { data: vehicles = [], isLoading, isError, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getUserVehicles,
    enabled: backendReady,
    staleTime: 2 * 60_000,
  })

  const { data: allLNFQRs = [], isLoading: loadingLNF } = useQuery({
    queryKey: ['lnf-qr-codes', user?.uid, profiles.map((p) => p.id).join(',')],
    queryFn: () => getAllProfilesLNFQRs(user.uid, profiles),
    enabled: !!user?.uid && profiles.length > 0,
    staleTime: 2 * 60_000,
  })
  const linkedVehicleQRs = allLNFQRs.filter((qr) => qr.type === 'vehicle')

  const { mutate: patchVehicle } = useMutation({
    mutationFn: ({ vehicleId, payload }) => updateVehicle(vehicleId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
    onError: (err) => toast.error(err.message || t('vehicles.failed_load')),
  })

  const handleToggle = (vehicleId, field, currentValue) => {
    patchVehicle({ vehicleId, payload: { [field]: !currentValue } })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={t('vehicles.title')}
        showBack
        rightAction={
          backendReady ? (
            <Link to="/vehicles/add">
              <Button size="sm" className="gap-1.5">
                <span className="material-symbols-outlined text-lg">add</span>
                {t('common.add')}
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="px-4 py-6 max-w-2xl mx-auto lg:px-6 lg:py-8">
        <p className="text-sm text-muted-foreground mb-6">
          {t('vehicles.subtitle_full')}
        </p>

        {/* Backend not configured */}
        {!backendReady && <BackendBanner />}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
          </div>
        )}

        {/* Error */}
        {isError && backendReady && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <span className="material-symbols-outlined text-destructive text-3xl">error</span>
            </div>
            <h3 className="font-semibold mb-1">{t('vehicles.failed_load')}</h3>
            <p className="text-muted-foreground text-sm">{error?.message || 'Please try again later.'}</p>
          </div>
        )}

        {/* Vehicle list */}
        {!isLoading && backendReady && !isError && (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {vehicles.map((vehicle) => {
              const id        = vehicle.id ?? vehicle._id
              const isActive  = vehicle.status === 'active'
              const color     = vehicle.color || '#6366F1'
              const typeLC    = vehicle.type?.toLowerCase() ?? ''
              const vehicleIcon =
                typeLC === 'car'   ? 'directions_car' :
                typeLC === 'truck' ? 'local_shipping'  : 'two_wheeler'

              return (
                <motion.div key={id} variants={item}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-1.5 w-full" style={{ background: `linear-gradient(to right, ${color}, ${color}88)` }} />
                    <CardContent className="p-5">
                      {/* Identity */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
                            <span className="material-symbols-outlined filled" style={{ color, fontSize: '26px' }}>{vehicleIcon}</span>
                          </div>
                          <div>
                            <h3 className="font-bold leading-tight">{vehicle.name}</h3>
                            <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border">
                              <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: '12px' }}>confirmation_number</span>
                              <span className="text-xs font-mono font-semibold tracking-widest text-foreground">{vehicle.licensePlate}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                          {isActive ? t('vehicles.active') : t('vehicles.inactive')}
                        </span>
                      </div>

                      {/* Contact settings */}
                      <div className="bg-muted/50 rounded-xl p-3 mb-4 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('vehicles.contact_permissions')}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: '18px' }}>call</span>
                            <span className="text-sm font-medium">{t('vehicles.allow_calls')}</span>
                          </div>
                          <Switch checked={!!vehicle.allowCalls} onCheckedChange={() => handleToggle(id, 'allowCalls', vehicle.allowCalls)} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: '18px' }}>sms</span>
                            <span className="text-sm font-medium">{t('vehicles.allow_messages')}</span>
                          </div>
                          <Switch checked={!!vehicle.allowMessages} onCheckedChange={() => handleToggle(id, 'allowMessages', vehicle.allowMessages)} />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 h-9">
                          <span className="material-symbols-outlined text-base mr-1.5">qr_code_2</span>
                          {t('vehicles.view_qr')}
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 h-9">
                          <span className="material-symbols-outlined text-base mr-1.5">edit</span>
                          {t('common.edit')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Linked Vehicle QR Tags */}
        {(loadingLNF || linkedVehicleQRs.length > 0) && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined filled text-lg" style={{ color: 'hsl(197 84% 44%)' }}>tag</span>
              <h2 className="text-sm font-bold text-foreground">Linked QR Tags</h2>
              {!loadingLNF && (
                <span className="ml-auto text-xs text-muted-foreground">{linkedVehicleQRs.length} tag{linkedVehicleQRs.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            {loadingLNF ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {linkedVehicleQRs.map((qr) => <LinkedVehicleQRCard key={qr.id || qr.passcode} qr={qr} />)}
              </div>
            )}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && backendReady && vehicles.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
              <span className="material-symbols-outlined text-4xl text-muted-foreground/50">directions_car</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('vehicles.no_vehicles')}</h3>
            <p className="text-muted-foreground text-sm mb-4">{t('vehicles.no_vehicles_desc')}</p>
            <Link to="/vehicles/add">
              <Button>
                <span className="material-symbols-outlined mr-2">add</span>
                {t('vehicles.add')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
