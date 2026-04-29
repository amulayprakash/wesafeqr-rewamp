import { useState, useContext } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { getAllProfilesWeSafeQRs } from '@/services/qrService'
import { getAllProfilesLNFQRs } from '@/services/lnfQRService'
import { ProfileContext } from '@/contexts/ProfileContext'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import toast from 'react-hot-toast'

const typeConfig = {
  wesafe:    { iconBg: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600 dark:text-indigo-400', cardGrad: 'from-indigo-500/5 to-transparent' },
  lostfound: { iconBg: 'bg-amber-100 dark:bg-amber-900/30',  iconColor: 'text-amber-600 dark:text-amber-400',  cardGrad: 'from-amber-500/5 to-transparent' },
  vehicle:   { iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', cardGrad: 'from-emerald-500/5 to-transparent' },
}

const statusKeys = {
  active:   { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', key: 'qr.active' },
  secured:  { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', key: 'qr.secured' },
  inactive: { dot: 'bg-muted-foreground', text: 'text-muted-foreground', bg: 'bg-muted', key: 'qr.inactive' },
}

const tabLabelKeys = {
  wesafe: 'qr.wesafe_tab',
  lostfound: 'qr.lostfound_tab',
  vehicle: 'qr.vehicle_tab',
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

function QRCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4" style={{ boxShadow: '0 1px 3px hsl(var(--foreground)/0.04)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="w-28 h-4 bg-muted animate-pulse rounded-full" />
            <div className="w-20 h-3 bg-muted animate-pulse rounded-full" />
          </div>
        </div>
        <div className="w-16 h-6 bg-muted animate-pulse rounded-full" />
      </div>
      <div className="w-24 h-3 bg-muted animate-pulse rounded-full mb-3" />
      <div className="flex gap-2">
        <div className="flex-1 h-9 bg-muted animate-pulse rounded-xl" />
        <div className="flex-1 h-9 bg-muted animate-pulse rounded-xl" />
      </div>
    </div>
  )
}

export function MyQRCodesPage() {
  const [activeTab, setActiveTab] = useState('all')
  const { user } = useAuth()
  const { profiles } = useContext(ProfileContext)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleShare = async (passcode) => {
    const url = `${window.location.origin}/qr/${passcode}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'WeSafe QR', url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success(t('qr.link_copied'))
      }
    } catch {
      toast.error(t('qr.copy_failed'))
    }
  }

  // Wesafe QRs: read from profile subcollection (new path)
  const { data: wesafeQRs = [], isLoading: loadingWesafe, isError: errorWesafe } = useQuery({
    queryKey: ['wesafe-qr-codes', user?.uid, profiles.map((p) => p.id).join(',')],
    queryFn: () => getAllProfilesWeSafeQRs(user.uid, profiles),
    enabled: !!user?.uid && profiles.length > 0,
  })

  // LNF QRs (lostfound + vehicle): read from Users/{uid}/ChildList/{childId}/lnfqr subcollection
  const { data: lnfQRs = [], isLoading: loadingLNF, isError: errorLNF } = useQuery({
    queryKey: ['lnf-qr-codes', user?.uid, profiles.map((p) => p.id).join(',')],
    queryFn: () => getAllProfilesLNFQRs(user.uid, profiles),
    enabled: !!user?.uid && profiles.length > 0,
  })

  const isLoading = activeTab === 'wesafe' ? loadingWesafe : (activeTab === 'all' ? (loadingWesafe || loadingLNF) : loadingLNF)
  const isError   = activeTab === 'wesafe' ? errorWesafe   : (activeTab === 'all' ? (errorWesafe || errorLNF) : errorLNF)

  const filteredQRs = activeTab === 'all'
    ? [...wesafeQRs, ...lnfQRs]
    : activeTab === 'wesafe'
    ? wesafeQRs
    : lnfQRs.filter((qr) => qr.type === activeTab)

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={t('qr.my_qr_codes')}
        showBack
        rightAction={
          <Link to="/qr-codes/activate">
            <Button size="sm" className="gap-1.5">
              <span className="material-symbols-outlined text-lg">add</span>
              {t('qr.add_new')}
            </Button>
          </Link>
        }
      />

      <div className="px-4 py-6 max-w-2xl mx-auto lg:px-6 lg:py-8">
        {/* Pill Tabs */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="w-full rounded-xl p-1 h-auto">
            <TabsTrigger value="all" onClick={() => setActiveTab('all')} className="flex-1 rounded-lg text-sm">{t('qr.all_tab')}</TabsTrigger>
            <TabsTrigger value="wesafe" onClick={() => setActiveTab('wesafe')} className="flex-1 rounded-lg text-sm">{t('qr.wesafe_tab')}</TabsTrigger>
            <TabsTrigger value="lostfound" onClick={() => setActiveTab('lostfound')} className="flex-1 rounded-lg text-sm">{t('qr.lostfound_tab')}</TabsTrigger>
            <TabsTrigger value="vehicle" onClick={() => setActiveTab('vehicle')} className="flex-1 rounded-lg text-sm">{t('qr.vehicle_tab')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <QRCardSkeleton key={i} />)}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <span className="material-symbols-outlined text-destructive text-3xl">error</span>
            </div>
            <h3 className="font-semibold mb-1">{t('qr.failed_load')}</h3>
            <p className="text-muted-foreground text-sm">{t('qr.failed_load_desc')}</p>
          </div>
        )}

        {/* QR list */}
        {!isLoading && !isError && (
          <>
            {filteredQRs.length > 0 && (
              <p className="text-xs text-muted-foreground mb-4">
                {t('qr.qr_count', { count: filteredQRs.length })}
              </p>
            )}

            <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
              {filteredQRs.map((qr) => {
                const code = qr.passcode || qr.Passcode || qr.id
                const displayName = qr.name || qr.Label || code
                const tcfg = typeConfig[qr.type] || typeConfig.wesafe
                const typeIcon = qr.type === 'vehicle' ? 'directions_car' : qr.type === 'lostfound' ? 'shopping_bag' : 'qr_code_2'
                // Items from wesafeqr subcollection are always active (written only on successful activation)
                const scfg = qr.profileId ? statusKeys.active : (qr.Consumed || qr.UserMapped ? statusKeys.active : statusKeys.inactive)
                return (
                  <motion.div key={code} variants={item}>
                    <div
                      className={`bg-gradient-to-r ${tcfg.cardGrad} border border-border/60 rounded-2xl transition-all cursor-pointer hover:border-primary/30 hover:shadow-md`}
                      style={{ boxShadow: '0 1px 3px hsl(var(--foreground)/0.04)' }}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${tcfg.iconBg}`}>
                              <span className={`material-symbols-outlined filled ${tcfg.iconColor}`}>{typeIcon}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold leading-tight tracking-tight">{displayName}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5 font-mono tracking-wide">{code}</p>
                              {qr.profileName && (
                                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                  style={{ background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))' }}>
                                  {qr.profileName}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${scfg.bg} ${scfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${scfg.dot}`} />
                            {t(scfg.key)}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground mb-3">
                          {qr.connectedAt
                            ? `Connected ${new Date(qr.connectedAt?.toDate?.() || qr.connectedAt).toLocaleDateString()}`
                            : qr.activatedAt
                            ? t('qr.activated_on', { date: new Date(qr.activatedAt?.toDate?.() || qr.activatedAt).toLocaleDateString() })
                            : t('qr.never_scanned')}
                        </p>

                        <div className="flex gap-2">
                          <Button
                            variant="outline" size="sm" className="flex-1 h-9 rounded-xl font-semibold press-scale"
                            onClick={() => handleShare(code)}
                          >
                            <span className="material-symbols-outlined text-base mr-1.5">share</span>
                            {t('qr.share')}
                          </Button>
                          <Button
                            variant="outline" size="sm" className="flex-1 h-9 rounded-xl font-semibold press-scale"
                            onClick={() => {
                              if (qr.type === 'lostfound' || qr.type === 'vehicle') {
                                window.open(`https://lost.wesafeqr.com/${code}`, '_blank')
                              } else {
                                navigate(`/qr/${code}`)
                              }
                            }}
                          >
                            <span className="material-symbols-outlined text-base mr-1.5">open_in_new</span>
                            {t('qr.preview')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>

            {filteredQRs.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                  <span className="material-symbols-outlined text-4xl text-muted-foreground/50">qr_code_2</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('qr.no_qr_codes')}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {activeTab === 'all'
                    ? t('qr.no_qr_desc')
                    : `${t('qr.no_qr_codes')} — ${t(tabLabelKeys[activeTab] || 'qr.all_tab')}`}
                </p>
                <Link to="/qr-codes/activate">
                  <Button>
                    <span className="material-symbols-outlined mr-2">add</span>
                    {t('qr.activate_qr_code')}
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
