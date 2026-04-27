import { useState, useContext } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { ProfileContext } from '@/contexts/ProfileContext'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getUserItems, toggleItemStatus } from '@/services/itemService'
import { getAllProfilesLNFQRs } from '@/services/lnfQRService'
import { isBackendConfigured } from '@/services/api'
import toast from 'react-hot-toast'

// ─── Animation ────────────────────────────────────────────────────────────────
const container   = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const itemVariant = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className}`} />
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  )
}

// ─── Backend not configured banner ───────────────────────────────────────────
function BackendBanner({ t }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-6 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 mb-3">
        <span className="material-symbols-outlined text-amber-600 text-3xl">cloud_off</span>
      </div>
      <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">{t('items.backend_not_connected')}</h3>
      <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed max-w-xs mx-auto">
        Add <code className="bg-amber-100 dark:bg-amber-800/50 px-1 py-0.5 rounded text-xs font-mono">VITE_BACKEND_URL</code> to your <code className="bg-amber-100 dark:bg-amber-800/50 px-1 py-0.5 rounded text-xs font-mono">.env</code> file to connect to the WeSafe backend.
      </p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
// ─── Linked LNF QR card ───────────────────────────────────────────────────────
function LinkedQRCard({ qr }) {
  const itemLabel = qr.itemType === 'Other' ? (qr.itemTypeName || 'Item') : (qr.itemType || 'Lost & Found Item')
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
    >
      <div
        className="rounded-2xl border-2 p-4"
        style={{ borderColor: 'hsl(38 88% 50% / 0.3)', background: 'hsl(38 88% 50% / 0.04)' }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'hsl(38 88% 50% / 0.12)' }}
          >
            <span className="material-symbols-outlined filled text-xl" style={{ color: 'hsl(38 88% 50%)' }}>
              shopping_bag
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm truncate">{itemLabel}</h3>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                style={{ background: 'hsl(142 71% 45% / 0.1)', color: 'hsl(142 71% 32%)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{qr.passcode}</p>
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

        {qr.description && (
          <p className="text-xs text-muted-foreground mb-2 pl-14 leading-relaxed">{qr.description}</p>
        )}

        {qr.wordFromOwner && (
          <div
            className="mx-0 mb-3 px-3 py-2 rounded-xl text-xs italic leading-relaxed"
            style={{ background: 'hsl(38 88% 50% / 0.07)', color: 'hsl(var(--foreground) / 0.7)' }}
          >
            "{qr.wordFromOwner}"
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {qr.connectedAt
              ? `Registered ${new Date(qr.connectedAt?.toDate?.() || qr.connectedAt).toLocaleDateString()}`
              : 'Recently registered'}
          </span>
          {qr.ownerName && <span className="font-medium">{qr.ownerName}</span>}
        </div>
      </div>
    </motion.div>
  )
}

export function ItemsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()
  const backendReady = isBackendConfigured()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { profiles } = useContext(ProfileContext)

  const { data: items = [], isLoading, isError, error } = useQuery({
    queryKey: ['items'],
    queryFn: getUserItems,
    enabled: backendReady,
    staleTime: 2 * 60_000,
  })

  const { data: allLNFQRs = [], isLoading: loadingLNF } = useQuery({
    queryKey: ['lnf-qr-codes', user?.uid, profiles.map((p) => p.id).join(',')],
    queryFn: () => getAllProfilesLNFQRs(user.uid, profiles),
    enabled: !!user?.uid && profiles.length > 0,
    staleTime: 2 * 60_000,
  })
  const linkedLostQRs = allLNFQRs.filter((qr) => qr.type === 'lostfound')

  const { mutate: toggleStatus, isPending: toggling } = useMutation({
    mutationFn: ({ itemId, currentStatus }) =>
      toggleItemStatus(itemId, currentStatus === 'lost' ? 'secured' : 'lost'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      toast.success(t('items.status_updated'))
    },
    onError: (err) => toast.error(err.message || 'Failed to update status'),
  })

  const filteredItems = items.filter((i) =>
    i.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const securedCount = items.filter((i) => i.status === 'secured').length
  const lostCount    = items.filter((i) => i.status === 'lost').length

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={t('items.title')}
        rightAction={
          <Link to="/settings" className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-accent transition-colors">
            <span className="material-symbols-outlined">person</span>
          </Link>
        }
      />

      <div className="px-4 py-6 max-w-2xl mx-auto lg:px-6 lg:py-8">
        {/* Header info */}
        <div className="mb-5">
          <h1 className="text-xl font-bold mb-1">{t('items.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('items.subtitle')}</p>
        </div>

        {/* Stats chips */}
        {!isLoading && backendReady && items.length > 0 && (
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {securedCount} {t('items.secured')}
            </span>
            {lostCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                {lostCount} {t('items.lost')}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{items.length} {t('items.total')}</span>
          </div>
        )}

        {/* Search */}
        {backendReady && !isLoading && items.length > 0 && (
          <div className="relative mb-6">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ fontSize: '20px' }}>
              search
            </span>
            <Input
              placeholder={t('items.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
        )}

        {/* Loading */}
        {isLoading && <SkeletonList />}

        {/* Backend not configured */}
        {!backendReady && <BackendBanner t={t} />}

        {/* Error */}
        {isError && backendReady && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <span className="material-symbols-outlined text-destructive text-3xl">error</span>
            </div>
            <h3 className="font-semibold mb-1">{t('items.failed_load')}</h3>
            <p className="text-muted-foreground text-sm">{error?.message || 'Please try again later.'}</p>
          </div>
        )}

        {/* Items list */}
        {!isLoading && backendReady && !isError && (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {filteredItems.map((itemData) => {
              const isLost = itemData.status === 'lost'
              return (
                <motion.div key={itemData.id ?? itemData._id} variants={itemVariant}>
                  <Card className={`border-l-4 overflow-hidden hover:shadow-md transition-all ${isLost ? 'border-l-destructive' : 'border-l-emerald-400'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 ${isLost ? 'bg-destructive/10' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                            <span className={`material-symbols-outlined ${isLost ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              inventory_2
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{itemData.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                              ID: {itemData.itemId ?? itemData.id ?? itemData._id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isLost ? 'bg-destructive/10 text-destructive' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isLost ? 'bg-destructive' : 'bg-emerald-500'}`} />
                            {isLost ? t('items.lost') : t('items.secured')}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs hidden sm:flex"
                            disabled={toggling}
                            onClick={() => toggleStatus({ itemId: itemData.id ?? itemData._id, currentStatus: itemData.status })}
                          >
                            {isLost ? t('items.cancel_report') : t('items.report_lost')}
                          </Button>
                        </div>
                      </div>
                      {/* Mobile action */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 h-8 text-xs sm:hidden"
                        disabled={toggling}
                        onClick={() => toggleStatus({ itemId: itemData.id ?? itemData._id, currentStatus: itemData.status })}
                      >
                        {isLost ? t('items.cancel_report') : t('items.report_lost')}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Linked LNF QR Tags section */}
        {(loadingLNF || linkedLostQRs.length > 0) && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined filled text-lg" style={{ color: 'hsl(38 88% 50%)' }}>tag</span>
              <h2 className="text-sm font-bold text-foreground">Linked QR Tags</h2>
              {!loadingLNF && (
                <span className="ml-auto text-xs text-muted-foreground">{linkedLostQRs.length} tag{linkedLostQRs.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            {loadingLNF ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {linkedLostQRs.map((qr) => <LinkedQRCard key={qr.id || qr.passcode} qr={qr} />)}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && backendReady && filteredItems.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
              <span className="material-symbols-outlined text-4xl text-muted-foreground/50">inventory_2</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('items.no_items')}</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? t('items.no_match') : t('items.no_items_desc')}
            </p>
          </div>
        )}
      </div>

      {/* FAB — only shown when backend is ready */}
      {backendReady && (
        <Link to="/items/add">
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="fixed bottom-24 right-4 lg:bottom-8 w-14 h-14 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 hover:shadow-primary/40 transition-all"
          >
            <span className="material-symbols-outlined text-2xl">add</span>
          </motion.button>
        </Link>
      )}
    </div>
  )
}
