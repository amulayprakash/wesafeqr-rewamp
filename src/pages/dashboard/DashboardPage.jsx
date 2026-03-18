import { useContext } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { ProfileContext } from '@/contexts/ProfileContext'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getUserQRCodes } from '@/services/qrService'
import { getEmergencyContacts, getPersonalInfo, getMedicalItems } from '@/services/profileService'

// ── SVG Progress Ring ──────────────────────────────────────────────────────────
function ProgressRing({ percentage, size = 100, strokeWidth = 9, color = '#6366F1', label }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} stroke="currentColor" className="text-muted-foreground/15" />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" strokeWidth={strokeWidth} stroke={color} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold leading-none">{percentage}%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center font-medium leading-tight max-w-[90px]">{label}</p>
    </div>
  )
}

function StatSkeleton() {
  return <span className="inline-block w-8 h-7 bg-muted animate-pulse rounded align-middle" />
}

const PROFILE_FIELDS = ['name', 'dob', 'gender', 'bloodGroup', 'height', 'weight', 'phone', 'address']
function calcCompletion(data) {
  if (!data) return 0
  const filled = PROFILE_FIELDS.filter((f) => data[f] && String(data[f]).trim() !== '').length
  return Math.round((filled / PROFILE_FIELDS.length) * 100)
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export function DashboardPage() {
  const { user } = useAuth()
  const { activeProfileId, activeProfile } = useContext(ProfileContext)

  const displayName = user?.displayName || 'User'
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  // ── Real data via React Query ────────────────────────────────────────────────
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

  const { data: medicalConditions = [], isLoading: loadingMedical } = useQuery({
    queryKey: ['medical-mediccond', user?.uid, activeProfileId],
    queryFn: () => getMedicalItems(user.uid, activeProfileId, 'mediccond'),
    enabled: !!user?.uid && !!activeProfileId,
  })

  // ── Derived stats ────────────────────────────────────────────────────────────
  const activeQRCount  = qrCodes.filter((q) => q.status === 'active').length
  const totalQRCount   = qrCodes.length
  const contactCount   = contacts.length
  const profilePct     = calcCompletion(personalInfo)
  const conditionCount = medicalConditions.length
  const contactPct     = Math.min(100, Math.round((contactCount / 4) * 100))

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-only header */}
      <div className="lg:hidden">
        <Header
          rightAction={
            <Link to="/settings" className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-accent transition-colors">
              <span className="material-symbols-outlined">person</span>
            </Link>
          }
        />
      </div>

      {/* ══ MOBILE LAYOUT ════════════════════════════════════════════════════════ */}
      <div className="lg:hidden px-4 py-6">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user?.photoURL} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {activeProfile && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Profile: <span className="font-medium text-foreground">{activeProfile.name}</span>
              </p>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 mb-8">
          {[
            { icon: 'contact_emergency', value: loadingPersonal ? null : `${profilePct}%`, label: 'Profile Completion', link: '/profile/personal', color: 'text-primary' },
            { icon: 'group', value: loadingContacts ? null : contactCount, label: 'Emergency Contacts', link: '/profile/emergency', color: 'text-primary' },
            { icon: 'medical_services', value: loadingMedical ? null : conditionCount, label: 'Medical Conditions', link: '/profile/medical', color: 'text-primary' },
            { icon: 'qr_code_2', value: loadingQR ? null : totalQRCount, label: 'My QR Codes', link: '/qr-codes', color: 'text-primary' },
            { icon: 'sensors', value: loadingQR ? null : activeQRCount, label: 'Active QRs', link: '/qr-codes', color: 'text-primary' },
            { icon: 'warning', value: '2', label: 'Alerts', link: '/alerts', color: 'text-destructive', bgColor: 'bg-destructive/10' },
          ].map((stat, index) => (
            <motion.div key={index} variants={item}>
              <Link to={stat.link}>
                <Card className={`hover:border-primary transition-colors cursor-pointer ${stat.bgColor || ''}`}>
                  <CardContent className="p-4 text-center">
                    <span className={`material-symbols-outlined text-2xl mb-2 ${stat.color}`}>{stat.icon}</span>
                    <div className="text-2xl font-bold mb-1">
                      {stat.value === null ? <StatSkeleton /> : stat.value}
                    </div>
                    <div className="text-xs text-muted-foreground leading-tight">{stat.label}</div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/scan">
              <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary-foreground filled">qr_code_scanner</span>
                  </div>
                  <p className="text-sm font-semibold">Scan QR</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/qr-codes/activate">
              <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary filled">add_circle</span>
                  </div>
                  <p className="text-sm font-semibold">Activate QR</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Link to="/scan-history" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {[
                { title: 'Home Entrance QR', detail: '2m ago • Scanned by Security Gate 01', icon: 'qr_code_scanner', type: 'scan' },
                { title: 'Medical ID Tag', detail: '1h ago • Viewed by Emergency Responder', icon: 'medical_services', type: 'medical' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <span className="material-symbols-outlined text-primary">{activity.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ══ DESKTOP LAYOUT ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-8 py-8">

          {/* Hero Welcome Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-violet-700 p-8 mb-8 text-primary-foreground"
          >
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-44 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
            <div className="absolute top-1/2 right-10 -translate-y-1/2 pointer-events-none select-none">
              <span className="material-symbols-outlined filled text-white/10" style={{ fontSize: '150px' }}>shield</span>
            </div>
            <div className="relative flex items-center gap-6">
              <Avatar className="h-20 w-20 ring-4 ring-white/25 shadow-xl flex-shrink-0">
                <AvatarImage src={user?.photoURL} alt={displayName} />
                <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white/65 text-sm mb-0.5">Welcome back</p>
                <h1 className="text-3xl font-bold text-white">{displayName}</h1>
                {activeProfile && (
                  <p className="text-white/60 text-sm mt-0.5">
                    Active Profile: <span className="text-white/90 font-medium">{activeProfile.name}</span>
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium border border-white/10">
                    <span className="material-symbols-outlined filled" style={{ fontSize: '14px' }}>verified</span>
                    Active Member
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/60 text-white text-xs font-medium border border-rose-400/30">
                    <span className="material-symbols-outlined filled" style={{ fontSize: '14px' }}>warning</span>
                    2 New Alerts
                  </span>
                  {!loadingQR && totalQRCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium border border-white/10">
                      <span className="material-symbols-outlined filled" style={{ fontSize: '14px' }}>qr_code_2</span>
                      {totalQRCount} QR Code{totalQRCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Two-column grid */}
          <div className="grid grid-cols-3 gap-8 items-start">

            {/* LEFT 2/3 */}
            <div className="col-span-2 space-y-8">

              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>analytics</span>
                  Overview
                </h2>
                <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 gap-4">
                  {[
                    { icon: 'qr_code_2', value: loadingQR ? null : activeQRCount, label: 'Active QR Codes', link: '/qr-codes', gradient: 'from-indigo-500/10 via-violet-500/5 to-transparent', iconBg: 'bg-indigo-500/10', iconColor: 'text-indigo-500', hover: 'hover:border-indigo-400/40' },
                    { icon: 'group', value: loadingContacts ? null : contactCount, label: 'Emergency Contacts', link: '/profile/emergency', gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500', hover: 'hover:border-emerald-400/40' },
                    { icon: 'warning', value: 2, label: 'Active Alerts', link: '/alerts', gradient: 'from-rose-500/10 via-orange-500/5 to-transparent', iconBg: 'bg-rose-500/10', iconColor: 'text-rose-500', hover: 'hover:border-rose-400/40' },
                  ].map((stat, i) => (
                    <motion.div key={i} variants={item}>
                      <Link to={stat.link}>
                        <Card className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} border-border/60 ${stat.hover} transition-all duration-200 hover:shadow-lg cursor-pointer group`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-5">
                              <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                                <span className={`material-symbols-outlined filled text-xl ${stat.iconColor}`}>{stat.icon}</span>
                              </div>
                              <span className="material-symbols-outlined text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" style={{ fontSize: '16px' }}>
                                arrow_outward
                              </span>
                            </div>
                            <div className="text-3xl font-bold mb-1">
                              {stat.value === null ? <span className="inline-block w-8 h-8 bg-muted animate-pulse rounded" /> : stat.value}
                            </div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              </section>

              {/* Recent Activity */}
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>history</span>
                    Recent Activity
                  </h2>
                  <Link to="/scan-history" className="text-sm text-primary hover:underline flex items-center gap-0.5 font-medium">
                    View All
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                  </Link>
                </div>
                <Card>
                  <CardContent className="p-0 divide-y divide-border">
                    {[
                      { title: 'Home Entrance QR', detail: '2m ago • Scanned by Security Gate 01', icon: 'qr_code_scanner', type: 'scan' },
                      { title: 'Medical ID Tag', detail: '1h ago • Viewed by Emergency Responder', icon: 'medical_services', type: 'medical' },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-5 hover:bg-accent/40 transition-colors group">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 ${activity.type === 'medical' ? 'bg-rose-500/10' : 'bg-primary/10'}`}>
                          <span className={`material-symbols-outlined filled ${activity.type === 'medical' ? 'text-rose-500' : 'text-primary'}`}>{activity.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{activity.detail}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {activity.type === 'scan' ? 'Scan' : 'View'}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.section>

              {/* Quick Actions */}
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bolt</span>
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: 'qr_code_scanner', label: 'Scan a QR Code', desc: 'Scan any WeSafe QR code', link: '/scan', iconClass: 'bg-primary text-primary-foreground' },
                    { icon: 'add_circle', label: 'Activate QR Code', desc: 'Link a new QR to your profile', link: '/qr-codes/activate', iconClass: 'bg-secondary text-secondary-foreground' },
                  ].map((action, i) => (
                    <Link key={i} to={action.link}>
                      <Card className="hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer group">
                        <CardContent className="p-5 flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl ${action.iconClass} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                            <span className="material-symbols-outlined text-xl">{action.icon}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{action.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                          </div>
                          <span className="material-symbols-outlined text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" style={{ fontSize: '18px' }}>
                            chevron_right
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </motion.section>
            </div>

            {/* RIGHT 1/3 */}
            <div className="col-span-1 space-y-6">
              {/* Profile Health */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>favorite</span>
                  Profile Health
                </h2>
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-6">
                      <ProgressRing percentage={loadingPersonal ? 0 : profilePct} size={140} strokeWidth={12} color="#6366F1" label="Overall Completion" />
                    </div>
                    <div className="border-t border-border mb-5" />
                    <div className="grid grid-cols-2 gap-4">
                      <ProgressRing percentage={loadingMedical ? 0 : Math.min(100, conditionCount * 20)} size={90} strokeWidth={8} color="#06B6D4" label="Medical Info" />
                      <ProgressRing percentage={loadingContacts ? 0 : contactPct} size={90} strokeWidth={8} color="#10B981" label="Emergency Contacts" />
                    </div>
                    <div className="mt-5 pt-4 border-t border-border">
                      <Link to="/profile/personal" className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline">
                        Complete Your Profile
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Alerts */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-rose-500/5">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-destructive filled" style={{ fontSize: '16px' }}>warning</span>
                        </div>
                        <span className="font-semibold text-sm">Active Alerts</span>
                      </div>
                      <Badge className="bg-destructive text-destructive-foreground text-xs">2 New</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">You have unread safety alerts that require attention.</p>
                    <Link to="/alerts" className="text-sm text-destructive hover:underline font-medium flex items-center gap-1">
                      View All Alerts
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Links */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <Card>
                  <CardContent className="p-5">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>link</span>
                      Quick Links
                    </h3>
                    <div className="space-y-1">
                      {[
                        { icon: 'person', label: 'Personal Profile', link: '/profile/personal' },
                        { icon: 'medical_services', label: 'Medical Info', link: '/profile/medical' },
                        { icon: 'group', label: 'Emergency Contacts', link: '/profile/emergency' },
                        { icon: 'health_and_safety', label: 'Insurance', link: '/profile/insurance' },
                      ].map((qlink, i) => (
                        <Link key={i} to={qlink.link} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent transition-colors group">
                          <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary transition-colors text-lg">{qlink.icon}</span>
                          <span className="text-sm font-medium flex-1">{qlink.label}</span>
                          <span className="material-symbols-outlined text-muted-foreground/40 group-hover:text-primary/60 transition-colors" style={{ fontSize: '16px' }}>chevron_right</span>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
