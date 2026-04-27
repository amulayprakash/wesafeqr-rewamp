import { useContext } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { ProfileContext } from '@/contexts/ProfileContext'
import { Header } from '@/components/layout/Header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getUserQRCodes, getAllUserScans } from '@/services/qrService'
import { getEmergencyContacts, getPersonalInfo, getMedicalItems } from '@/services/profileService'
import { getUnreadCount } from '@/services/alertService'

// ── Brand hex colors (SVG needs hex, not hsl() CSS syntax) ────────────────────
const BRAND = {
  primary:   '#6C72CC',
  emerald:   '#10B981',
  cyan:      '#06B6D4',
  rose:      '#F03758',
  amber:     '#F59E0B',
  violet:    '#8B5CF6',
}

// ── SVG Progress Ring ──────────────────────────────────────────────────────────
function ProgressRing({ percentage, size = 100, strokeWidth = 9, color = BRAND.primary, label, showLabel = true }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Track circle */}
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" strokeWidth={strokeWidth}
            stroke={color} opacity={0.12} strokeLinecap="round"
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" strokeWidth={strokeWidth}
            stroke={color} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
            style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold leading-none tabular-nums" style={{ color }}>{percentage}%</span>
        </div>
      </div>
      {showLabel && (
        <p className="text-[11px] text-muted-foreground text-center font-medium leading-tight max-w-[80px] text-balance">{label}</p>
      )}
    </div>
  )
}

// ── Horizontal progress bar ────────────────────────────────────────────────────
function HealthBar({ label, icon, percentage, color, loading }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined filled" style={{ fontSize: '14px', color }}>{icon}</span>
          <span className="text-xs font-semibold text-foreground">{label}</span>
        </div>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>
          {loading ? '—' : `${percentage}%`}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}66` }}
          initial={{ width: '0%' }}
          animate={{ width: loading ? '0%' : `${percentage}%` }}
          transition={{ duration: 1, ease: [0.34, 1.2, 0.64, 1], delay: 0.4 }}
        />
      </div>
    </div>
  )
}

function StatSkeleton() {
  return <span className="inline-block w-10 h-8 bg-muted animate-pulse rounded-lg align-middle" />
}

const PROFILE_FIELDS = ['name', 'dob', 'gender', 'bloodGroup', 'height', 'weight', 'phone', 'address']
function calcCompletion(data) {
  if (!data) return 0
  const filled = PROFILE_FIELDS.filter((f) => data[f] && String(data[f]).trim() !== '').length
  return Math.round((filled / PROFILE_FIELDS.length) * 100)
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.23, 1, 0.32, 1] } } }

export function DashboardPage() {
  const { user } = useAuth()
  const { activeProfileId, activeProfile } = useContext(ProfileContext)
  const { t } = useTranslation()

  function formatTimeAgo(date) {
    if (!date || isNaN(date)) return ''
    const diff = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diff < 60) return t('common.just_now')
    if (diff < 3600) return `${Math.floor(diff / 60)}m ${t('common.ago')}`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ${t('common.ago')}`
    return `${Math.floor(diff / 86400)}d ${t('common.ago')}`
  }

  const { data: qrCodes = [], isLoading: loadingQR } = useQuery({
    queryKey: ['qr-codes', user?.uid],
    queryFn: () => getUserQRCodes(user.uid),
    enabled: !!user?.uid,
  })

  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['emergency-contacts', user?.uid, activeProfileId],
    queryFn: () => getEmergencyContacts(user.uid, activeProfileId),
    enabled: !!user?.uid && !!activeProfileId,
  })

  const { data: personalInfo = {}, isLoading: loadingPersonal } = useQuery({
    queryKey: ['personal-info', user?.uid, activeProfileId],
    queryFn: () => getPersonalInfo(user.uid, activeProfileId),
    enabled: !!user?.uid && !!activeProfileId,
  })

  const displayName = personalInfo?.name || activeProfile?.name || user?.displayName || 'User'
  const firstName = displayName.split(' ')[0]
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const avatarSrc = personalInfo?.photoURL || (activeProfileId === 'child1' ? user?.photoURL : '')

  const { data: medicalConditions = [], isLoading: loadingMedical } = useQuery({
    queryKey: ['medical-mediccond', user?.uid, activeProfileId],
    queryFn: () => getMedicalItems(user.uid, activeProfileId, 'mediccond'),
    enabled: !!user?.uid && !!activeProfileId,
  })

  const { data: medicalMedications = [], isLoading: loadingMedications } = useQuery({
    queryKey: ['medical-medications', user?.uid, activeProfileId],
    queryFn: () => getMedicalItems(user.uid, activeProfileId, 'medications'),
    enabled: !!user?.uid && !!activeProfileId,
  })

  const { data: medicalAllergies = [], isLoading: loadingAllergies } = useQuery({
    queryKey: ['medical-allergies', user?.uid, activeProfileId],
    queryFn: () => getMedicalItems(user.uid, activeProfileId, 'allergies'),
    enabled: !!user?.uid && !!activeProfileId,
  })

  const { data: medicalVaccines = [], isLoading: loadingVaccines } = useQuery({
    queryKey: ['medical-vaccinations', user?.uid, activeProfileId],
    queryFn: () => getMedicalItems(user.uid, activeProfileId, 'vaccinations'),
    enabled: !!user?.uid && !!activeProfileId,
  })

  const { data: medicalProcedures = [], isLoading: loadingProcedures } = useQuery({
    queryKey: ['medical-procedures', user?.uid, activeProfileId],
    queryFn: () => getMedicalItems(user.uid, activeProfileId, 'procedures'),
    enabled: !!user?.uid && !!activeProfileId,
  })

  const { data: unreadAlerts = 0 } = useQuery({
    queryKey: ['alerts-unread', user?.uid],
    queryFn: () => getUnreadCount(user.uid),
    enabled: !!user?.uid,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const { data: recentScans = [], isLoading: loadingScans } = useQuery({
    queryKey: ['recent-scans', user?.uid],
    queryFn: () => getAllUserScans(user.uid),
    enabled: !!user?.uid,
    staleTime: 2 * 60_000,
    select: (scans) => scans.slice(0, 3),
  })

  const activeQRCount  = qrCodes.filter((q) => q.status === 'active').length
  const totalQRCount   = qrCodes.length
  const contactCount   = contacts.length
  const profilePct     = calcCompletion(personalInfo)
  const conditionCount = medicalConditions.length
  const contactPct     = Math.min(100, Math.round((contactCount / 4) * 100))
  const medicalPct     = Math.min(100, conditionCount * 20)
  const medicationCount   = medicalMedications.length
  const allergyCount      = medicalAllergies.length
  const vaccineCount      = medicalVaccines.length
  const procedureCount    = medicalProcedures.length

  const MEDICAL_CARDS = [
    { id: 'mediccond',    label: 'Conditions',  icon: 'monitor_heart', color: '#F43F5E', count: conditionCount,  loading: loadingMedical,      desc: conditionCount === 1 ? 'Condition' : 'Conditions' },
    { id: 'medications',  label: 'Medications', icon: 'medication',    color: '#6672C8', count: medicationCount, loading: loadingMedications,   desc: medicationCount === 1 ? 'Medication' : 'Medications' },
    { id: 'allergies',    label: 'Allergies',   icon: 'warning',       color: '#D97706', count: allergyCount,    loading: loadingAllergies,     desc: allergyCount === 1 ? 'Allergen' : 'Allergens' },
    { id: 'vaccinations', label: 'Vaccines',    icon: 'vaccines',      color: '#059669', count: vaccineCount,    loading: loadingVaccines,      desc: vaccineCount === 1 ? 'Vaccine' : 'Vaccines' },
    { id: 'procedures',   label: 'Procedures',  icon: 'surgical',      color: '#7C3AED', count: procedureCount,  loading: loadingProcedures,    desc: procedureCount === 1 ? 'Procedure' : 'Procedures' },
  ]

  // ── Score color ──────────────────────────────────────────────────────────────
  const overallScore = Math.round((profilePct + contactPct + medicalPct) / 3)
  const scoreColor = overallScore >= 70 ? BRAND.emerald : overallScore >= 35 ? BRAND.amber : BRAND.rose

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden">
        <Header
          rightAction={
            <Link
              to="/settings"
              className="flex items-center justify-center w-9 h-9 rounded-full active:scale-95 transition-all duration-150 hover:opacity-90"
              style={{
                background: 'hsl(var(--primary))',
                boxShadow: '0 0 0 2px hsl(var(--primary) / 0.25), 0 2px 8px hsl(var(--primary) / 0.35)',
              }}
            >
              <span className="material-symbols-outlined filled text-white" style={{ fontSize: '18px' }}>person</span>
            </Link>
          }
        />
      </div>

      {/* ══ MOBILE LAYOUT ════════════════════════════════════════════════════════ */}
      <div className="lg:hidden px-4 py-5 space-y-5">

        {/* Welcome Hero */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="relative overflow-hidden rounded-2xl p-5 text-white"
          style={{
            background: `linear-gradient(135deg, ${BRAND.primary} 0%, #5A60BB 100%)`,
            boxShadow: `0 8px 32px ${BRAND.primary}55`,
          }}
        >
          {/* Dot grid texture */}
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{ backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`, backgroundSize: '20px 20px' }}
          />


          <div className="relative flex items-center gap-4">
            <Avatar className="h-13 w-13 flex-shrink-0" style={{ boxShadow: '0 0 0 3px rgba(255,255,255,0.25)', width: 52, height: 52 }}>
              <AvatarImage src={avatarSrc} alt={displayName} />
              <AvatarFallback className="bg-white/20 text-white text-lg font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-[12px] font-medium">{t('dashboard.welcome_back')}</p>
              <h1 className="text-xl font-bold text-white tracking-tight truncate">{displayName}</h1>
              {(personalInfo?.addressCity || personalInfo?.address) && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined filled text-white/50" style={{ fontSize: '11px' }}>location_on</span>
                  <p className="text-white/55 text-[11px] truncate">{personalInfo.addressCity || personalInfo.address}</p>
                </div>
              )}
              {activeProfile && (
                <p className="text-white/40 text-[10px] mt-0.5 truncate">{activeProfile.name}</p>
              )}
            </div>
            {unreadAlerts > 0 && (
              <Link to="/alerts" className="flex-shrink-0 press-scale">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive/75 text-white text-xs font-bold border border-white/15">
                  <span className="material-symbols-outlined filled" style={{ fontSize: '11px' }}>warning</span>
                  {unreadAlerts}
                </span>
              </Link>
            )}
          </div>

          {/* Mini stats */}
          <div className="relative flex mt-4 pt-4 border-t border-white/12">
            {[
              { value: loadingQR ? '—' : activeQRCount, label: 'Active QRs', link: '/qr-codes' },
              { value: loadingContacts ? '—' : contactCount, label: 'Contacts', link: '/profile/emergency' },
              { value: loadingPersonal ? '—' : `${profilePct}%`, label: 'Profile', link: '/profile/personal' },
            ].map((s, i) => (
              <Link key={i} to={s.link} className="flex-1 text-center press-scale">
                <div className="text-[22px] font-bold text-white tabular-nums leading-none">{s.value}</div>
                <div className="text-[10px] text-white/50 font-semibold mt-0.5 uppercase tracking-wide">{s.label}</div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Overview + Quick Links — unified section */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}>
          <p className="text-[13px] font-bold text-foreground mb-3">{t('dashboard.overview')}</p>

          {/* Stat tiles row */}
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 gap-3">
            {[
              { icon: 'sensors',  value: loadingQR ? null : activeQRCount,  label: t('dashboard.active_qrs'),    link: '/qr-codes', color: BRAND.primary },
              { icon: 'warning',  value: unreadAlerts,                       label: t('dashboard.unread_alerts'),  link: '/alerts',   color: unreadAlerts > 0 ? BRAND.rose : '#94a3b8' },
              { icon: 'qr_code_2',value: loadingQR ? null : totalQRCount,   label: t('dashboard.my_qr_codes'),   link: '/qr-codes', color: BRAND.violet },
            ].map((stat, index) => (
              <motion.div key={index} variants={fadeUp}>
                <Link to={stat.link} className="press-scale block">
                  <div className="rounded-2xl p-3.5 border border-border/60 bg-card overflow-hidden relative"
                    style={{ boxShadow: `0 2px 8px ${stat.color}12` }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                      style={{ background: `linear-gradient(90deg, ${stat.color}, ${stat.color}00)` }}
                    />
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 mt-0.5"
                      style={{ background: `${stat.color}18` }}
                    >
                      <span className="material-symbols-outlined filled" style={{ fontSize: '16px', color: stat.color }}>{stat.icon}</span>
                    </div>
                    <div className="text-xl font-bold tabular-nums mb-0.5" style={{ color: stat.value === null ? undefined : stat.color }}>
                      {stat.value === null ? <StatSkeleton /> : stat.value}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium leading-tight">{stat.label}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Links boxes */}
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-4 mb-3">{t('dashboard.quick_links')}</p>
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
            {[
              {
                icon: 'person',
                label: t('dashboard.personal_profile'),
                link: '/profile/personal',
                color: BRAND.primary,
                value: loadingPersonal ? null : `${profilePct}%`,
                desc: 'Profile filled',
              },
              {
                icon: 'medical_services',
                label: t('dashboard.medical_info'),
                link: '/profile/medical',
                color: BRAND.cyan,
                value: loadingMedical ? null : conditionCount,
                desc: conditionCount === 1 ? 'Condition' : 'Conditions',
              },
              {
                icon: 'group',
                label: t('dashboard.emergency_contacts'),
                link: '/profile/emergency',
                color: BRAND.emerald,
                value: loadingContacts ? null : contactCount,
                desc: contactCount === 1 ? 'Contact saved' : 'Contacts saved',
              },
              {
                icon: 'health_and_safety',
                label: t('profile.insurance'),
                link: '/profile/insurance',
                color: BRAND.rose,
                value: '→',
                desc: 'View details',
              },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Link to={item.link} className="press-scale block">
                  <div
                    className="rounded-2xl border border-border/60 bg-card overflow-hidden relative"
                    style={{ boxShadow: `0 2px 8px ${item.color}12` }}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-[3px]"
                      style={{ background: `linear-gradient(90deg, ${item.color}, ${item.color}00)` }}
                    />
                    <div className="p-4 pt-5">
                      <div className="flex items-start justify-between mb-2">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: `${item.color}18` }}
                        >
                          <span className="material-symbols-outlined filled" style={{ fontSize: '18px', color: item.color }}>{item.icon}</span>
                        </div>
                        <span className="material-symbols-outlined opacity-20" style={{ fontSize: '14px', color: item.color }}>arrow_outward</span>
                      </div>
                      <div className="text-2xl font-bold tabular-nums leading-none mb-1" style={{ color: item.color }}>
                        {item.value === null ? <StatSkeleton /> : item.value}
                      </div>
                      <div className="text-xs font-semibold text-foreground leading-tight">{item.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Medical Overview — horizontal scroll, 4 cards visible */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.4 }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-base font-bold text-foreground">Medical Overview</p>
            <Link to="/profile/medical" className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity">View all</Link>
          </div>
          {/* -mx-4 px-4 extends the scroll zone to viewport edges */}
          <div
            className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {MEDICAL_CARDS.map((card) => (
              <Link
                key={card.id}
                to="/profile/medical"
                state={{ tab: card.id }}
                className="flex-shrink-0 press-scale"
                style={{ width: 'calc((100vw - 52px) / 3.2)' }}
              >
                <div
                  className="rounded-2xl border border-border/60 bg-card overflow-hidden relative h-full"
                  style={{ boxShadow: `0 2px 8px ${card.color}14` }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-[3px]"
                    style={{ background: `linear-gradient(90deg, ${card.color}, ${card.color}00)` }}
                  />
                  <div className="p-4 pt-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: `${card.color}18` }}
                    >
                      <span className="material-symbols-outlined filled" style={{ fontSize: '20px', color: card.color }}>{card.icon}</span>
                    </div>
                    <div className="text-2xl font-bold tabular-nums leading-none mb-1.5" style={{ color: card.color }}>
                      {card.loading ? <span className="inline-block w-6 h-6 bg-muted animate-pulse rounded" /> : card.count}
                    </div>
                    <div className="text-xs font-bold text-foreground leading-tight">{card.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{card.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Profile Health Card — mobile */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
          <p className="text-[13px] font-bold text-foreground mb-3">{t('dashboard.profile_health')}</p>
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden"
            style={{ boxShadow: `0 2px 16px ${scoreColor}14` }}
          >
            {/* Header */}
            <div className="relative overflow-hidden px-4 pt-4 pb-3 border-b border-border/50">
              <div className="absolute inset-0 opacity-[0.06]"
                style={{ background: `radial-gradient(ellipse at top right, ${scoreColor}, transparent 70%)` }}
              />
              <div className="relative flex items-center justify-between mb-3">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Safety Score</p>
                  <p className="text-2xl font-bold tabular-nums leading-tight" style={{ color: scoreColor }}>
                    {loadingPersonal ? '—' : `${overallScore}%`}
                  </p>
                </div>
                <ProgressRing
                  percentage={loadingPersonal ? 0 : overallScore}
                  size={64}
                  strokeWidth={7}
                  color={scoreColor}
                  label=""
                  showLabel={false}
                />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: `${scoreColor}15`, color: scoreColor }}
              >
                <span className="material-symbols-outlined filled" style={{ fontSize: '12px' }}>
                  {overallScore >= 70 ? 'check_circle' : overallScore >= 35 ? 'info' : 'warning'}
                </span>
                {overallScore >= 70 ? 'Profile is strong' : overallScore >= 35 ? 'Partially complete' : 'Needs attention'}
              </div>
            </div>
            {/* Bars */}
            <div className="px-4 py-4 space-y-3.5">
              <HealthBar label="Personal info" icon="person" percentage={loadingPersonal ? 0 : profilePct} color={BRAND.primary} loading={loadingPersonal} />
              <HealthBar label="Medical data" icon="medical_services" percentage={loadingMedical ? 0 : medicalPct} color={BRAND.cyan} loading={loadingMedical} />
              <HealthBar label="Emergency contacts" icon="group" percentage={loadingContacts ? 0 : contactPct} color={BRAND.emerald} loading={loadingContacts} />
            </div>
            {/* CTA */}
            <div className="px-4 pb-4">
              <Link to="/profile/personal">
                <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm press-scale"
                  style={{ background: `${BRAND.primary}12`, color: BRAND.primary }}
                >
                  {t('dashboard.complete_profile')}
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                </div>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Active Alerts panel — mobile */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36, duration: 0.4 }}>
          <div className="rounded-2xl border overflow-hidden"
            style={{
              borderColor: unreadAlerts > 0 ? `${BRAND.rose}30` : 'hsl(var(--border) / 0.6)',
              background: unreadAlerts > 0 ? `${BRAND.rose}06` : 'hsl(var(--card))',
              boxShadow: unreadAlerts > 0 ? `0 2px 12px ${BRAND.rose}14` : '0 1px 4px hsl(var(--foreground)/0.04)',
            }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${BRAND.rose}15` }}
                  >
                    <span className="material-symbols-outlined filled" style={{ fontSize: '18px', color: BRAND.rose }}>warning</span>
                  </div>
                  <span className="font-bold text-[14px]">{t('dashboard.active_alerts')}</span>
                </div>
                {unreadAlerts > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-white text-xs font-bold px-1.5"
                    style={{ background: BRAND.rose }}
                  >
                    {unreadAlerts}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                {unreadAlerts > 0
                  ? t(unreadAlerts !== 1 ? 'dashboard.unread_attention_plural' : 'dashboard.unread_attention', { count: unreadAlerts })
                  : t('dashboard.all_caught_up')}
              </p>
              <Link to="/alerts" className="flex items-center gap-1 text-sm font-semibold transition-opacity press-scale"
                style={{ color: BRAND.rose }}
              >
                {t('dashboard.view_all_alerts')}
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44, duration: 0.4 }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold text-foreground">{t('dashboard.recent_activity')}</p>
            <Link to="/scan-history" className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity">{t('dashboard.view_all')}</Link>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden"
            style={{ boxShadow: '0 1px 3px hsl(var(--foreground)/0.04)' }}
          >
            {loadingScans ? (
              [1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b border-border/40 last:border-0">
                  <div className="w-10 h-10 rounded-xl bg-muted animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-3 bg-muted animate-pulse rounded-full" />
                    <div className="w-20 h-2 bg-muted animate-pulse rounded-full" />
                  </div>
                </div>
              ))
            ) : recentScans.length > 0 ? (
              recentScans.map((scan, idx) => {
                const isMedical = scan.qrType === 'wesafe'
                const ts = scan.scannedAt?.toDate?.() ?? new Date(scan.scannedAt)
                const timeAgo = formatTimeAgo(ts)
                return (
                  <div key={scan.id} className={`flex items-center gap-4 p-4 hover:bg-accent/40 transition-colors ${idx < recentScans.length - 1 ? 'border-b border-border/40' : ''}`}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                      style={{ background: isMedical ? `${BRAND.rose}18` : `${BRAND.primary}18` }}
                    >
                      <span className="material-symbols-outlined filled" style={{ fontSize: '20px', color: isMedical ? BRAND.rose : BRAND.primary }}>
                        {isMedical ? 'medical_services' : 'qr_code_scanner'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{scan.qrName || t('qr.unknown_qr')}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{timeAgo} · {scan.scannerType || 'Public'}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-10 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: `${BRAND.primary}12` }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '28px', color: `${BRAND.primary}80` }}>qr_code_scanner</span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground/60">{t('dashboard.no_scans_yet')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Scan a QR code to see activity here</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}>
          <p className="text-[13px] font-bold text-foreground mb-3">{t('dashboard.quick_actions')}</p>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/scan" className="press-scale">
              <div className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-border/60 bg-card"
                style={{ boxShadow: `0 2px 12px ${BRAND.primary}18` }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: BRAND.primary, boxShadow: `0 4px 14px ${BRAND.primary}55` }}
                >
                  <span className="material-symbols-outlined text-white filled" style={{ fontSize: '22px' }}>qr_code_scanner</span>
                </div>
                <p className="text-sm font-semibold">{t('dashboard.scan_qr')}</p>
              </div>
            </Link>

            <Link to="/qr-codes/activate" className="press-scale">
              <div className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-border/60 bg-card"
                style={{ boxShadow: `0 2px 8px ${BRAND.primary}10` }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `${BRAND.primary}18` }}
                >
                  <span className="material-symbols-outlined filled" style={{ fontSize: '22px', color: BRAND.primary }}>add_circle</span>
                </div>
                <p className="text-sm font-semibold">{t('dashboard.activate_qr')}</p>
              </div>
            </Link>

            <Link to="/shop" className="col-span-2 press-scale">
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-800/40"
                style={{ background: 'linear-gradient(90deg, rgb(245 158 11 / 0.07), rgb(249 115 22 / 0.04))' }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)', boxShadow: '0 4px 14px rgb(245 158 11 / 0.4)' }}
                >
                  <span className="material-symbols-outlined text-white filled" style={{ fontSize: '22px' }}>shopping_bag</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{t('shop.product_name')}</p>
                  <p className="text-xs text-muted-foreground truncate">{t('shop.product_subtitle')}</p>
                </div>
                <span className="material-symbols-outlined text-muted-foreground/40" style={{ fontSize: '18px' }}>chevron_right</span>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ══ DESKTOP LAYOUT ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-8 py-8">

          {/* ── Hero Banner ──────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="relative overflow-hidden rounded-3xl p-8 mb-8 text-white"
            style={{
              background: `linear-gradient(135deg, ${BRAND.primary} 0%, #5A60BB 55%, #7C3AED 100%)`,
              boxShadow: `0 12px 48px ${BRAND.primary}44, 0 2px 8px ${BRAND.primary}22`,
            }}
          >
            {/* Dot grid texture */}
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />
            {/* Decorative blobs */}
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }}
            />
            <div className="absolute bottom-0 right-56 w-40 h-40 rounded-full translate-y-1/2 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)' }}
            />
            {/* Large logo watermark */}
            <div className="absolute top-1/2 right-8 -translate-y-1/2 pointer-events-none select-none opacity-[0.12]">
              <img src="/logo1.png" alt="" className="w-36 h-36 rounded-3xl object-cover" style={{ filter: 'brightness(10)' }} />
            </div>

            <div className="relative flex items-center gap-6">
              <Avatar className="h-[72px] w-[72px] flex-shrink-0"
                style={{ boxShadow: '0 0 0 3px rgba(255,255,255,0.2), 0 4px 16px rgba(0,0,0,0.2)' }}
              >
                <AvatarImage src={avatarSrc} alt={displayName} />
                <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white/55 text-sm font-medium mb-0.5">{t('dashboard.welcome_back')}</p>
                <h1 className="text-[32px] font-bold text-white tracking-tight leading-none">{displayName}</h1>
                {(personalInfo?.addressCity || personalInfo?.address) && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="material-symbols-outlined filled text-white/50" style={{ fontSize: '14px' }}>location_on</span>
                    <p className="text-white/60 text-sm truncate">{personalInfo.addressCity || personalInfo.address}</p>
                  </div>
                )}
                {activeProfile && (
                  <p className="text-white/50 text-sm mt-1">
                    {t('dashboard.active_profile')}: <span className="text-white/80 font-semibold">{activeProfile.name}</span>
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/12 text-white text-xs font-semibold border border-white/10 backdrop-blur-sm">
                    <span className="material-symbols-outlined filled" style={{ fontSize: '12px' }}>verified</span>
                    {t('dashboard.active_member')}
                  </span>
                  {unreadAlerts > 0 && (
                    <Link to="/alerts">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-semibold border border-rose-400/30 backdrop-blur-sm press-scale"
                        style={{ background: `${BRAND.rose}55` }}
                      >
                        <span className="material-symbols-outlined filled" style={{ fontSize: '12px' }}>warning</span>
                        {t(unreadAlerts !== 1 ? 'dashboard.new_alerts_badge_plural' : 'dashboard.new_alerts_badge', { count: unreadAlerts })}
                      </span>
                    </Link>
                  )}
                  {!loadingQR && totalQRCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/12 text-white text-xs font-semibold border border-white/10 backdrop-blur-sm">
                      <span className="material-symbols-outlined filled" style={{ fontSize: '12px' }}>qr_code_2</span>
                      {t(totalQRCount !== 1 ? 'dashboard.qr_codes_badge_plural' : 'dashboard.qr_codes_badge', { count: totalQRCount })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Main Grid ────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-7 items-start">

            {/* LEFT 2/3 */}
            <div className="col-span-2 space-y-7">

              {/* Overview — stat cards + quick link boxes */}
              <section>
                <p className="text-[13px] font-bold text-foreground mb-4">Overview</p>

                {/* Top stat row */}
                <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 gap-4">
                  {[
                    { icon: 'sensors',   value: loadingQR ? null : activeQRCount,       label: t('dashboard.active_qr_codes'),      link: '/qr-codes',        color: BRAND.primary, desc: 'Ready to scan' },
                    { icon: 'group',     value: loadingContacts ? null : contactCount,   label: t('dashboard.emergency_contacts'),   link: '/profile/emergency',color: BRAND.emerald, desc: 'People to notify' },
                    { icon: 'warning',   value: unreadAlerts,                            label: t('dashboard.unread_alerts'),        link: '/alerts',           color: unreadAlerts > 0 ? BRAND.rose : '#94a3b8', desc: unreadAlerts > 0 ? 'Need attention' : 'All clear' },
                  ].map((stat, i) => (
                    <motion.div key={i} variants={fadeUp}>
                      <Link to={stat.link}>
                        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-0.5"
                          style={{ boxShadow: `0 2px 8px ${stat.color}14`, transition: 'all 0.2s ease' }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = `0 6px 24px ${stat.color}28, 0 2px 8px ${stat.color}14`}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = `0 2px 8px ${stat.color}14`}
                        >
                          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${stat.color}, ${stat.color}44)` }} />
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                                style={{ background: `${stat.color}18` }}
                              >
                                <span className="material-symbols-outlined filled" style={{ fontSize: '22px', color: stat.color }}>{stat.icon}</span>
                              </div>
                              <span className="material-symbols-outlined transition-all duration-200 group-hover:opacity-100 opacity-30"
                                style={{ fontSize: '16px', color: stat.color }}
                              >
                                arrow_outward
                              </span>
                            </div>
                            <div className="text-[36px] font-bold tabular-nums leading-none mb-1.5" style={{ color: stat.color }}>
                              {stat.value === null ? <span className="inline-block w-10 h-9 bg-muted animate-pulse rounded-lg" /> : stat.value}
                            </div>
                            <div className="text-sm font-semibold text-foreground">{stat.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{stat.desc}</div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Quick Links boxes */}
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-5 mb-3">{t('dashboard.quick_links')}</p>
                <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-4 gap-4">
                  {[
                    {
                      icon: 'person',
                      label: t('dashboard.personal_profile'),
                      link: '/profile/personal',
                      color: BRAND.primary,
                      value: loadingPersonal ? null : `${profilePct}%`,
                      desc: 'Profile filled',
                    },
                    {
                      icon: 'medical_services',
                      label: t('dashboard.medical_info'),
                      link: '/profile/medical',
                      color: BRAND.cyan,
                      value: loadingMedical ? null : conditionCount,
                      desc: conditionCount === 1 ? 'Condition' : 'Conditions',
                    },
                    {
                      icon: 'group',
                      label: t('dashboard.emergency_contacts'),
                      link: '/profile/emergency',
                      color: BRAND.emerald,
                      value: loadingContacts ? null : contactCount,
                      desc: contactCount === 1 ? 'Contact saved' : 'Contacts saved',
                    },
                    {
                      icon: 'health_and_safety',
                      label: t('profile.insurance'),
                      link: '/profile/insurance',
                      color: BRAND.rose,
                      value: '→',
                      desc: 'View details',
                    },
                  ].map((item, i) => (
                    <motion.div key={i} variants={fadeUp}>
                      <Link to={item.link}>
                        <div
                          className="rounded-2xl border border-border/60 bg-card overflow-hidden relative cursor-pointer group transition-all duration-200 hover:-translate-y-0.5"
                          style={{ boxShadow: `0 2px 8px ${item.color}12` }}
                          onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${item.color}28, 0 2px 8px ${item.color}12` }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 2px 8px ${item.color}12` }}
                        >
                          <div className="absolute top-0 left-0 right-0 h-[3px]"
                            style={{ background: `linear-gradient(90deg, ${item.color}, ${item.color}00)` }}
                          />
                          <div className="p-5 pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                style={{ background: `${item.color}18` }}
                              >
                                <span className="material-symbols-outlined filled" style={{ fontSize: '20px', color: item.color }}>{item.icon}</span>
                              </div>
                              <span className="material-symbols-outlined opacity-20 group-hover:opacity-70 transition-opacity duration-200"
                                style={{ fontSize: '15px', color: item.color }}
                              >
                                arrow_outward
                              </span>
                            </div>
                            <div className="text-[28px] font-bold tabular-nums leading-none mb-1" style={{ color: item.color }}>
                              {item.value === null ? <span className="inline-block w-10 h-7 bg-muted animate-pulse rounded-lg" /> : item.value}
                            </div>
                            <div className="text-xs font-semibold text-foreground leading-tight">{item.label}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              </section>

              {/* Medical Overview — 5-column grid */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[13px] font-bold text-foreground">Medical Overview</p>
                  <Link to="/profile/medical" className="text-sm font-semibold text-primary hover:opacity-80 flex items-center gap-0.5 transition-opacity">
                    View all
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                  </Link>
                </div>
                <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-5 gap-3">
                  {MEDICAL_CARDS.map((card) => (
                    <motion.div key={card.id} variants={fadeUp}>
                      <Link to="/profile/medical" state={{ tab: card.id }}>
                        <div
                          className="rounded-2xl border border-border/60 bg-card overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-0.5"
                          style={{ boxShadow: `0 2px 8px ${card.color}12` }}
                          onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${card.color}28, 0 2px 8px ${card.color}12` }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 2px 8px ${card.color}12` }}
                        >
                          <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${card.color}, ${card.color}00)` }} />
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: `${card.color}18` }}
                              >
                                <span className="material-symbols-outlined filled" style={{ fontSize: '18px', color: card.color }}>{card.icon}</span>
                              </div>
                              <span
                                className="material-symbols-outlined opacity-20 group-hover:opacity-70 transition-opacity duration-200"
                                style={{ fontSize: '14px', color: card.color }}
                              >
                                arrow_outward
                              </span>
                            </div>
                            <div className="text-xl font-bold tabular-nums leading-none mb-1" style={{ color: card.color }}>
                              {card.loading ? <span className="inline-block w-8 h-6 bg-muted animate-pulse rounded" /> : card.count}
                            </div>
                            <div className="text-[10px] font-semibold text-foreground leading-tight break-words">{card.label}</div>
                            <div className="text-[9px] text-muted-foreground mt-0.5 break-words">{card.desc}</div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              </section>

              {/* Recent Activity */}
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[13px] font-bold text-foreground">{t('dashboard.recent_activity')}</p>
                  <Link to="/scan-history" className="text-sm font-semibold text-primary hover:opacity-80 flex items-center gap-0.5 transition-opacity">
                    {t('dashboard.view_all')}
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                  </Link>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card overflow-hidden"
                  style={{ boxShadow: '0 1px 4px hsl(var(--foreground)/0.04)' }}
                >
                  {loadingScans ? (
                    [1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-5 border-b border-border/40 last:border-0">
                        <div className="w-12 h-12 rounded-xl bg-muted animate-pulse flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="w-40 h-3.5 bg-muted animate-pulse rounded-full" />
                          <div className="w-28 h-2.5 bg-muted animate-pulse rounded-full" />
                        </div>
                      </div>
                    ))
                  ) : recentScans.length > 0 ? (
                    recentScans.slice(0, 2).map((scan, idx) => {
                      const isMedical = scan.qrType === 'wesafe'
                      const ts = scan.scannedAt?.toDate?.() ?? new Date(scan.scannedAt)
                      const timeAgo = formatTimeAgo(ts)
                      return (
                        <div key={scan.id}
                          className={`flex items-center gap-4 p-5 hover:bg-accent/40 transition-colors group ${idx < 1 ? 'border-b border-border/40' : ''}`}
                        >
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
                            style={{ background: isMedical ? `${BRAND.rose}18` : `${BRAND.primary}18` }}
                          >
                            <span className="material-symbols-outlined filled" style={{ fontSize: '22px', color: isMedical ? BRAND.rose : BRAND.primary }}>
                              {isMedical ? 'medical_services' : 'qr_code_scanner'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{scan.qrName || t('qr.unknown_qr')}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{timeAgo} · {scan.scannerType || 'Public'}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs flex-shrink-0 font-semibold">{t('dashboard.scan_badge')}</Badge>
                        </div>
                      )
                    })
                  ) : (
                    <div className="py-12 flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: `${BRAND.primary}10` }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '32px', color: `${BRAND.primary}66` }}>qr_code_scanner</span>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground/60">{t('dashboard.no_recent_scans')}</p>
                        <p className="text-xs text-muted-foreground mt-1">QR scan activity will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>

              {/* Quick Actions */}
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <p className="text-[13px] font-bold text-foreground mb-4">{t('dashboard.quick_actions')}</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: 'qr_code_scanner', label: t('dashboard.scan_qr'), desc: t('dashboard.scan_qr_desc'), link: '/scan', color: BRAND.primary, filled: true },
                    { icon: 'add_circle', label: t('dashboard.activate_qr'), desc: t('dashboard.activate_qr_desc'), link: '/qr-codes/activate', color: BRAND.violet, filled: false },
                  ].map((action, i) => (
                    <Link key={i} to={action.link}>
                      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-0.5"
                        style={{ boxShadow: `0 2px 8px ${action.color}12` }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 6px 20px ${action.color}24`}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = `0 2px 8px ${action.color}12`}
                      >
                        <div className="p-5 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
                            style={action.filled
                              ? { background: action.color, boxShadow: `0 4px 14px ${action.color}44` }
                              : { background: `${action.color}15` }
                            }
                          >
                            <span className="material-symbols-outlined filled" style={{ fontSize: '22px', color: action.filled ? '#fff' : action.color }}>{action.icon}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-[15px]">{action.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                          </div>
                          <span className="material-symbols-outlined transition-colors duration-200 opacity-30 group-hover:opacity-80"
                            style={{ fontSize: '18px', color: action.color }}
                          >
                            chevron_right
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.section>
            </div>

            {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────── */}
            <div className="col-span-1 space-y-5">

              {/* Profile Health Card — redesigned */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <p className="text-[13px] font-bold text-foreground mb-4">{t('dashboard.profile_health')}</p>
                <div className="rounded-2xl border border-border/60 bg-card overflow-hidden"
                  style={{ boxShadow: `0 2px 16px ${scoreColor}14` }}
                >
                  {/* Header gradient matching score */}
                  <div className="relative overflow-hidden px-5 pt-5 pb-4 border-b border-border/50">
                    <div className="absolute inset-0 opacity-[0.06]"
                      style={{ background: `radial-gradient(ellipse at top right, ${scoreColor}, transparent 70%)` }}
                    />
                    <div className="relative flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Safety Score</p>
                        <p className="text-2xl font-bold tabular-nums leading-tight" style={{ color: scoreColor }}>
                          {loadingPersonal ? '—' : `${overallScore}%`}
                        </p>
                      </div>
                      <div className="relative">
                        <ProgressRing
                          percentage={loadingPersonal ? 0 : overallScore}
                          size={72}
                          strokeWidth={7}
                          color={scoreColor}
                          label=""
                          showLabel={false}
                        />
                      </div>
                    </div>

                    {/* Score label */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: `${scoreColor}15`, color: scoreColor }}
                    >
                      <span className="material-symbols-outlined filled" style={{ fontSize: '12px' }}>
                        {overallScore >= 70 ? 'check_circle' : overallScore >= 35 ? 'info' : 'warning'}
                      </span>
                      {overallScore >= 70 ? 'Profile is strong' : overallScore >= 35 ? 'Partially complete' : 'Needs attention'}
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="p-5 space-y-4">
                    <HealthBar
                      label="Personal info"
                      icon="person"
                      percentage={loadingPersonal ? 0 : profilePct}
                      color={BRAND.primary}
                      loading={loadingPersonal}
                    />
                    <HealthBar
                      label="Medical data"
                      icon="medical_services"
                      percentage={loadingMedical ? 0 : medicalPct}
                      color={BRAND.cyan}
                      loading={loadingMedical}
                    />
                    <HealthBar
                      label="Emergency contacts"
                      icon="group"
                      percentage={loadingContacts ? 0 : contactPct}
                      color={BRAND.emerald}
                      loading={loadingContacts}
                    />
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-5">
                    <Link to="/profile/personal">
                      <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 press-scale"
                        style={{ background: `${BRAND.primary}12`, color: BRAND.primary }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${BRAND.primary}20` }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${BRAND.primary}12` }}
                      >
                        {t('dashboard.complete_profile')}
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Alerts panel */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                <div className="rounded-2xl border overflow-hidden"
                  style={{
                    borderColor: unreadAlerts > 0 ? `${BRAND.rose}30` : 'hsl(var(--border) / 0.6)',
                    background: unreadAlerts > 0 ? `${BRAND.rose}06` : 'hsl(var(--card))',
                    boxShadow: unreadAlerts > 0 ? `0 2px 12px ${BRAND.rose}14` : '0 1px 4px hsl(var(--foreground)/0.04)',
                  }}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: `${BRAND.rose}15` }}
                        >
                          <span className="material-symbols-outlined filled" style={{ fontSize: '18px', color: BRAND.rose }}>warning</span>
                        </div>
                        <span className="font-bold text-[14px]">{t('dashboard.active_alerts')}</span>
                      </div>
                      {unreadAlerts > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-white text-xs font-bold px-1.5"
                          style={{ background: BRAND.rose }}
                        >
                          {unreadAlerts}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                      {unreadAlerts > 0
                        ? t(unreadAlerts !== 1 ? 'dashboard.unread_attention_plural' : 'dashboard.unread_attention', { count: unreadAlerts })
                        : t('dashboard.all_caught_up')}
                    </p>
                    <Link to="/alerts" className="flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-80"
                      style={{ color: BRAND.rose }}
                    >
                      {t('dashboard.view_all_alerts')}
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                    </Link>
                  </div>
                </div>
              </motion.div>


            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
