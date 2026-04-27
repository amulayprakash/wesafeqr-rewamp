import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { getQRCode, recordScan, logScanToQRCodeScans } from '@/services/qrService'
import { getPersonalInfo, getEmergencyContacts, getMedicalItems, getInsurance } from '@/services/profileService'
import { createAlert } from '@/services/alertService'
import { SUPPORTED_LANGUAGES } from '@/i18n'
import { LanguagePicker } from '@/components/ui/LanguagePicker'

// ─── Phone masking ────────────────────────────────────────────────────────────

function calcAge(dob) {
  if (!dob) return null
  const birth = new Date(dob)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age >= 0 ? age : null
}

function maskPhone(phone) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 6) return '••••••'
  const tail = digits.slice(-4)
  const masked = '•'.repeat(digits.length - 4)
  return masked + tail
}

// ─── Blood group colour mapping ───────────────────────────────────────────────

function bloodGroupStyle(bg = '') {
  const u = bg.toUpperCase()
  if (u.startsWith('O'))  return { chip: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500' }
  if (u.startsWith('AB')) return { chip: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500' }
  if (u.startsWith('A'))  return { chip: 'bg-primary/10 text-primary border-primary/20', dot: 'bg-primary' }
  if (u.startsWith('B'))  return { chip: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' }
  return { chip: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' }
}

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────

function Shimmer({ className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-muted rounded-lg ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-card/70 to-transparent" />
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ icon, label, iconClass = 'text-muted-foreground', children, accent }) {
  return (
    <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
      <div className={`flex items-center gap-2.5 px-4 py-3 border-b border-border/60 ${accent ?? 'bg-muted/30'}`}>
        <span className={`material-symbols-outlined filled text-[18px] ${iconClass}`}>{icon}</span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      {children}
    </div>
  )
}

// ─── Collapsible section wrapper ─────────────────────────────────────────────

function CollapsibleSection({ children, title, subtitle, icon, iconClass = '', headerBg = 'bg-muted/30', borderClass = 'border-border', wrapperClass = '' }) {
  const [open, setOpen] = useState(true)
  return (
    <div className={`bg-card rounded-xl border card-shadow overflow-hidden ${borderClass} ${wrapperClass}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2.5 px-4 py-3 border-b text-left transition-colors active:opacity-80 ${headerBg} ${open ? borderClass + '/60' : 'border-transparent'}`}
      >
        <span className={`material-symbols-outlined filled text-[18px] flex-shrink-0 ${iconClass}`}>{icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-bold uppercase tracking-wider ${iconClass}`}>{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>}
        </div>
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="material-symbols-outlined text-[18px] text-muted-foreground/50 flex-shrink-0"
        >
          expand_more
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Language bar + sheet ─────────────────────────────────────────────────────

function LanguageBar({ compact = false }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  const langCode = i18n.language?.split('-')[0] || 'en'
  const current  = SUPPORTED_LANGUAGES.find(l => l.code === langCode) || SUPPORTED_LANGUAGES[0]
  const indian   = SUPPORTED_LANGUAGES.filter(l => l.region === 'indian')
  const intl     = SUPPORTED_LANGUAGES.filter(l => l.region === 'international')

  const select = (code) => {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <>
      {compact ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl press-scale active:scale-95 transition-all"
          style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.10) 100%)',
            border: '1px solid rgba(255,255,255,0.40)',
            boxShadow: '0 1.5px 0 rgba(255,255,255,0.45) inset, 0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          <span className="material-symbols-outlined text-[14px] text-white/80">language</span>
          <span className="text-sm leading-none">{current.flag}</span>
          <span className="text-[11px] font-bold text-white tracking-wide">{current.code.toUpperCase()}</span>
          <span className="material-symbols-outlined text-[13px] text-white/60">expand_more</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border card-shadow press-scale transition-colors hover:bg-muted/40"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined filled text-[18px] text-primary">language</span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-bold text-foreground">{t('qrd.select_language')}</p>
            <p className="text-[10.5px] text-muted-foreground mt-0.5">{t('qrd.language_subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 border border-primary/20">
              <span className="text-sm leading-none">{current.flag}</span>
              <span className="text-[11px] font-semibold text-primary">{current.nativeLabel}</span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-muted-foreground/50">chevron_right</span>
          </div>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/40 z-40" style={{ backdropFilter: 'blur(2px)' }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl border-t border-border shadow-2xl max-h-[75dvh] overflow-hidden flex flex-col"
            >
              <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-border/60">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-4" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{t('qrd.choose_language')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('qrd.choose_language_sub')}</p>
                  </div>
                  <button onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center press-scale">
                    <span className="material-symbols-outlined text-[18px] text-muted-foreground">close</span>
                  </button>
                </div>
              </div>

              {/* Language list */}
              <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">

                {/* Indian languages */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">{t('qrd.indian_languages')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {indian.map(l => (
                      <button key={l.code} onClick={() => select(l.code)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left press-scale transition-colors
                          ${current.code === l.code
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-muted/40 border-border/50 text-foreground hover:bg-muted'
                          }`}
                      >
                        <span className="text-lg leading-none flex-shrink-0">{l.flag}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{l.nativeLabel}</p>
                          <p className="text-[10px] text-muted-foreground">{l.label}</p>
                        </div>
                        {current.code === l.code && (
                          <span className="material-symbols-outlined filled text-[14px] text-primary ml-auto flex-shrink-0">check_circle</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* International */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">{t('qrd.international')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {intl.map(l => (
                      <button key={l.code} onClick={() => select(l.code)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left press-scale transition-colors
                          ${current.code === l.code
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-muted/40 border-border/50 text-foreground hover:bg-muted'
                          }`}
                      >
                        <span className="text-lg leading-none flex-shrink-0">{l.flag}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{l.nativeLabel}</p>
                          <p className="text-[10px] text-muted-foreground">{l.label}</p>
                        </div>
                        {current.code === l.code && (
                          <span className="material-symbols-outlined filled text-[14px] text-primary ml-auto flex-shrink-0">check_circle</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-safe-area-bottom pb-4" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Stagger animation helper ─────────────────────────────────────────────────

function Reveal({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18, delay }}
    >
      {children}
    </motion.div>
  )
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({ active, onChange, criticalCount }) {
  const { t } = useTranslation()
  const TABS = [
    { id: 'critical', label: t('qrd.tab_critical'), icon: 'warning'    },
    { id: 'medical',  label: t('qrd.tab_medical'),  icon: 'medication' },
    { id: 'info',     label: t('qrd.tab_info'),     icon: 'info'       },
  ]
  return (
    <div className="flex gap-1 bg-muted/60 rounded-xl p-1 border border-border/50">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold transition-all duration-200 press-scale
            ${active === tab.id
              ? 'bg-card text-foreground shadow-sm border border-border/40'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          <span className={`material-symbols-outlined filled text-[15px] ${
            tab.id === 'critical' && criticalCount > 0 ? 'text-destructive' : ''
          }`}>{tab.icon}</span>
          <span className="hidden sm:inline">{tab.label}</span>
          {tab.id === 'critical' && criticalCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center px-1">
              {criticalCount}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Map + quick links section ────────────────────────────────────────────────

function MapSection({ mapCoords, locationSource }) {
  const { t } = useTranslation()
  const lat = mapCoords?.lat
  const lng = mapCoords?.lng

  const quickLinks = [
    { label: t('qrd.hospital'),     icon: 'local_hospital', color: 'text-destructive', bg: 'bg-destructive/8', border: 'border-destructive/25', href: lat ? `https://www.google.com/maps/search/hospital/@${lat},${lng},14z` : 'https://www.google.com/maps/search/hospital' },
    { label: t('qrd.police'),       icon: 'local_police',   color: 'text-blue-600',    bg: 'bg-blue-500/8',    border: 'border-blue-500/25',    href: lat ? `https://www.google.com/maps/search/police+station/@${lat},${lng},14z` : 'https://www.google.com/maps/search/police+station' },
    { label: t('qrd.ambulance'),    icon: 'emergency',      color: 'text-warning',     bg: 'bg-warning/8',     border: 'border-warning/25',     isCall: true, href: 'tel:112' },
    { label: t('qrd.pvt_hospital'), icon: 'apartment',      color: 'text-violet-600',  bg: 'bg-violet-500/8',  border: 'border-violet-500/25',  href: lat ? `https://www.google.com/maps/search/private+hospital/@${lat},${lng},14z` : 'https://www.google.com/maps/search/private+hospital' },
    { label: t('qrd.med_help'),     icon: 'health_metrics', color: 'text-success',     bg: 'bg-success/8',     border: 'border-success/25',     isCall: true, href: 'tel:104' },
    { label: t('qrd.directions'),   icon: 'navigation',     color: 'text-primary',     bg: 'bg-primary/8',     border: 'border-primary/25',     href: lat ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : '#' },
  ]

  return (
    <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined filled text-[18px] text-primary">location_on</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {locationSource === 'gps' ? t('qrd.current_location') : locationSource === 'ip' ? t('qrd.approx_location') : 'Location'}
          </span>
          {locationSource === 'ip' && (
            <span className="text-[10px] bg-warning/15 text-warning border border-warning/25 rounded-full px-2 py-0.5 font-semibold">
              {t('qrd.ip_estimate')}
            </span>
          )}
        </div>
        {lat && (
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank" rel="noopener noreferrer"
            className="text-[11px] text-primary font-semibold flex items-center gap-1 hover:underline"
          >
            {t('qrd.open_maps')}
            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
          </a>
        )}
      </div>

      {/* Map iframe or placeholder */}
      {lat ? (
        <div className="relative w-full" style={{ height: '200px' }}>
          <iframe
            title="Scan location"
            width="100%" height="100%"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`}
            className="border-0 w-full h-full"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 h-32 text-center px-4">
          <span className="material-symbols-outlined text-[28px] text-muted-foreground/30">location_searching</span>
          <p className="text-xs text-muted-foreground">{t('qrd.acquiring_location')}</p>
        </div>
      )}

      {/* Coords strip */}
      {lat && locationSource === 'gps' && (
        <div className="px-4 py-2 border-t border-border/40 bg-muted/20">
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        </div>
      )}
      {lat && locationSource === 'ip' && mapCoords?.city && (
        <div className="px-4 py-2 border-t border-border/40 bg-warning/5">
          <span className="text-[11px] text-warning/80">
            {t('qrd.approx_near')} {mapCoords.city}{mapCoords.region ? `, ${mapCoords.region}` : ''}
          </span>
        </div>
      )}

      {/* Quick-action grid */}
      <div className="p-3 grid grid-cols-3 gap-2 border-t border-border/40">
        {quickLinks.map(({ label, icon, color, bg, border, href, isCall }) => (
          <a
            key={label}
            href={href}
            target={isCall ? '_self' : '_blank'}
            rel="noopener noreferrer"
            className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border ${bg} ${border} ${color} transition-all press-scale`}
          >
            <span className={`material-symbols-outlined filled text-[20px] ${color}`}>{icon}</span>
            <span className="text-[10px] font-semibold text-center leading-tight">{label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

// ─── Tab content panels ───────────────────────────────────────────────────────

function CriticalTab({ allergies, conditions, isLoading }) {
  const { t } = useTranslation()
  const hasCritical = allergies.length > 0 || conditions.length > 0

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Shimmer className="h-16 w-full rounded-xl" />
        <Shimmer className="h-16 w-full rounded-xl" />
      </div>
    )
  }

  if (!hasCritical) {
    return (
      <div className="space-y-3">
        {/* Section context */}
        <div className="px-1">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {t('qrd.critical_tab_context')}
          </p>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border card-shadow"
          style={{ background: 'hsl(var(--success)/0.06)', borderColor: 'hsl(var(--success)/0.2)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'hsl(var(--success)/0.12)' }}>
            <span className="material-symbols-outlined filled text-[20px]" style={{ color: 'hsl(var(--success))' }}>check_circle</span>
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: 'hsl(var(--success))' }}>{t('qrd.no_critical')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('qrd.no_critical_sub')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {/* Section context banner */}
      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30">
        <span className="material-symbols-outlined filled text-[16px] text-amber-600 mt-0.5 flex-shrink-0">info</span>
        <p className="text-[11.5px] text-amber-800 dark:text-amber-300 leading-relaxed">
          <span className="font-bold">{t('qrd.show_to_staff')}</span>{' '}
          {t('qrd.allergic_reactions_note')}
        </p>
      </div>

      {/* Allergies group */}
      {allergies.length > 0 && (
        <CollapsibleSection
          icon="warning"
          iconClass="text-amber-600"
          title={t('qrd.allergies_count', { count: allergies.length })}
          subtitle={t('qrd.allergies_sub')}
          headerBg="bg-amber-50 dark:bg-amber-900/10"
          borderClass="border-amber-200 dark:border-amber-800/50"
        >
          <div className="divide-y divide-amber-200/50 dark:divide-amber-800/30">
            {allergies.map(a => (
              <div key={a.id} className="px-4 py-3.5">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined filled text-[14px] text-amber-600">warning</span>
                  </div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    {a['Allergy Name'] || a.name || 'Allergy'}
                  </p>
                </div>
                {(a['Allergy Notes'] || a.notes) && (
                  <div className="pl-9">
                    <p className="text-[10px] font-semibold text-amber-600/60 uppercase tracking-wide mb-0.5">{t('qrd.reaction_notes')}</p>
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{a['Allergy Notes'] || a.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Conditions group */}
      {conditions.length > 0 && (
        <CollapsibleSection
          icon="emergency"
          iconClass="text-destructive"
          title={t('qrd.conditions_count', { count: conditions.length })}
          subtitle={t('qrd.conditions_sub')}
          headerBg="bg-destructive/5"
          borderClass="border-destructive/20"
        >
          <div className="divide-y divide-destructive/10">
            {conditions.map(c => (
              <div key={c.id} className="px-4 py-3.5">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined filled text-[14px] text-destructive">emergency</span>
                  </div>
                  <p className="text-sm font-bold text-destructive">
                    {c['Medical Name'] || c.name || 'Condition'}
                  </p>
                </div>
                {(c['Medical Notes'] || c.notes) && (
                  <div className="pl-9">
                    <p className="text-[10px] font-semibold text-destructive/40 uppercase tracking-wide mb-0.5">{t('qrd.details_notes')}</p>
                    <p className="text-xs text-destructive/70 leading-relaxed">{c['Medical Notes'] || c.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

    </div>
  )
}

function ContactsTab({ contacts, isLoading }) {
  const { t } = useTranslation()
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Shimmer className="h-24 w-full rounded-xl" />
        <Shimmer className="h-16 w-full rounded-xl" />
      </div>
    )
  }

  if (!contacts.length) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        {t('qrd.no_contacts')}
      </div>
    )
  }

  const primary = contacts[0]
  const rest = contacts.slice(1)

  return (
    <div className="space-y-3">
      {/* Primary contact — prominent */}
      <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border/60 bg-primary/5">
          <span className="material-symbols-outlined filled text-[15px] text-primary">star</span>
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{t('qrd.primary')}</span>
        </div>
        <div className="p-4">
          <p className="text-[28px] font-bold tabular-nums text-foreground tracking-tight leading-none">
            {primary['Emergency Contact Number'] || primary.phone}
          </p>
          {(primary['Emergency Contact Name'] || primary.name || primary['Emergency Contact Relation'] || primary.relationship) && (
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              {[primary['Emergency Contact Name'] || primary.name, primary['Emergency Contact Relation'] || primary.relationship].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <a href={`tel:${primary['Emergency Contact Number'] || primary.phone}`}
              className="flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm press-scale"
              style={{ boxShadow: '0 4px 12px hsl(var(--primary)/0.3)' }}>
              <span className="material-symbols-outlined filled text-[18px]">call</span>
              {t('qrd.call_now')}
            </a>
            <a href={`sms:${primary['Emergency Contact Number'] || primary.phone}`}
              className="flex items-center justify-center gap-2 h-11 rounded-xl bg-secondary border border-border text-secondary-foreground font-semibold text-sm press-scale">
              <span className="material-symbols-outlined text-[18px]">sms</span>
              {t('qrd.message')}
            </a>
          </div>
        </div>
      </div>

      {/* Other contacts */}
      {rest.length > 0 && (
        <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/60 bg-muted/30">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('qrd.other_contacts')}</span>
          </div>
          {rest.map((c, idx) => (
            <div key={c.id}
              className={`flex items-center justify-between px-4 py-3 ${idx < rest.length - 1 ? 'border-b border-border/40' : ''}`}>
              <div>
                <p className="text-sm font-semibold">{c['Emergency Contact Name'] || c.name || '—'}</p>
                <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                  {c['Emergency Contact Number'] || c.phone}
                  {(c['Emergency Contact Relation'] || c.relationship) && ` · ${c['Emergency Contact Relation'] || c.relationship}`}
                </p>
              </div>
              <a href={`tel:${c['Emergency Contact Number'] || c.phone}`}
                className="w-9 h-9 rounded-xl bg-primary/10 hover:bg-primary/15 flex items-center justify-center press-scale">
                <span className="material-symbols-outlined filled text-[16px] text-primary">call</span>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MedicalTab({ medications, procedures, vaccinations, isLoading }) {
  const { t } = useTranslation()
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Shimmer className="h-20 w-full rounded-xl" />
        <Shimmer className="h-20 w-full rounded-xl" />
      </div>
    )
  }

  const empty = !medications.length && !procedures.length && !vaccinations.length

  if (empty) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        {t('qrd.no_medical')}
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {/* Tab-level context */}
      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-muted/60 border border-border/50">
        <span className="material-symbols-outlined filled text-[15px] text-muted-foreground mt-0.5 flex-shrink-0">info</span>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          {t('qrd.medical_records_note')}
        </p>
      </div>

      {medications.length > 0 && (
        <CollapsibleSection
          icon="medication"
          iconClass="text-info"
          title={t('qrd.medications')}
          subtitle={t('qrd.medications_sub')}
          headerBg="bg-info/5"
          borderClass="border-border"
        >
          <div className="divide-y divide-border/50">
            {medications.map(m => (
              <div key={m.id} className="px-4 py-3.5">
                {/* Drug name */}
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined filled text-[14px] text-info">pill</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{m.medicationName || m.name || 'Medication'}</p>
                </div>
                {/* Fields */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pl-9">
                  {m.dosage && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide">{t('qrd.amount_per_dose')}</p>
                      <p className="text-xs font-mono font-semibold text-foreground">{m.dosage}</p>
                    </div>
                  )}
                  {m.frequency && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide">{t('qrd.how_often')}</p>
                      <p className="text-xs font-medium text-foreground">{m.frequency}</p>
                    </div>
                  )}
                </div>
                {(m.medicationNotes || m.notes) && (
                  <div className="mt-2 pl-9">
                    <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide mb-0.5">{t('qrd.additional_notes')}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{m.medicationNotes || m.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {procedures.length > 0 && (
        <CollapsibleSection
          icon="surgical"
          iconClass="text-violet-500"
          title={t('qrd.procedures')}
          subtitle={t('qrd.procedures_sub')}
          headerBg="bg-violet-500/5"
          borderClass="border-border"
        >
          <div className="divide-y divide-border/50">
            {procedures.map(p => (
              <div key={p.id} className="px-4 py-3.5">
                {/* Procedure name */}
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined filled text-[14px] text-violet-500">surgical</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{p['Procedures Name'] || p.name || 'Procedure'}</p>
                </div>
                {/* Fields grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pl-9">
                  {p['Procedures Date of Procedure'] && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide">{t('qrd.date_performed')}</p>
                      <p className="text-xs font-medium text-foreground">{p['Procedures Date of Procedure']}</p>
                    </div>
                  )}
                  {p['Procedures Status'] && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide">{t('qrd.current_status')}</p>
                      <p className="text-xs font-medium text-foreground">{p['Procedures Status']}</p>
                    </div>
                  )}
                </div>
                {p['Procedures Doctor Name'] && (
                  <div className="mt-2 pl-9">
                    <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide mb-0.5">{t('qrd.treating_doctor')}</p>
                    <p className="text-xs text-muted-foreground">
                      Dr. {p['Procedures Doctor Name']}
                      {p['Procedures Doctor Phone Number'] && (
                        <a href={`tel:${p['Procedures Doctor Phone Number']}`}
                          className="ml-2 font-mono text-primary font-semibold hover:underline">
                          {p['Procedures Doctor Phone Number']}
                        </a>
                      )}
                    </p>
                  </div>
                )}
                {(p['Procedures Notes'] || p.notes) && (
                  <div className="mt-2 pl-9">
                    <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide mb-0.5">{t('qrd.notes')}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p['Procedures Notes'] || p.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {vaccinations.length > 0 && (
        <CollapsibleSection
          icon="vaccines"
          iconClass="text-success"
          title={t('qrd.vaccinations')}
          subtitle={t('qrd.vaccinations_sub')}
          headerBg="bg-success/5"
          borderClass="border-border"
        >
          <div className="divide-y divide-border/50">
            {vaccinations.map(v => (
              <div key={v.id} className="px-4 py-3.5">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'hsl(var(--success)/0.1)' }}>
                    <span className="material-symbols-outlined filled text-[14px]" style={{ color: 'hsl(var(--success))' }}>vaccines</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{v['Vaccinations Name'] || v.name || 'Vaccine'}</p>
                </div>
                <div className="pl-9 space-y-1.5">
                  {v['Vaccinations Date'] && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide">{t('qrd.date_administered')}</p>
                      <p className="text-xs font-medium text-foreground">{v['Vaccinations Date']}</p>
                    </div>
                  )}
                  {(v['Vaccinations Notes'] || v.notes) && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide mb-0.5">{t('qrd.notes')}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{v['Vaccinations Notes'] || v.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  )
}

function InfoTab({ bloodGroup, bgStyle, medNotes, insurance, hasInsurance, isLoading }) {
  const { t } = useTranslation()
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Shimmer className="h-16 w-full rounded-xl" />
        <Shimmer className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  const empty = !bloodGroup && !medNotes && !hasInsurance

  if (empty) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        {t('qrd.no_additional')}
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {medNotes && (
        <CollapsibleSection
          icon="description"
          iconClass="text-muted-foreground"
          title={t('qrd.medical_notes_label')}
          borderClass="border-border"
        >
          <div className="px-4 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{medNotes}</p>
          </div>
        </CollapsibleSection>
      )}

      {hasInsurance && (
        <CollapsibleSection
          icon="health_and_safety"
          iconClass="text-warning"
          title={t('qrd.insurance')}
          subtitle={t('qrd.insurance_sub')}
          headerBg="bg-warning/5"
          borderClass="border-border"
        >

          <div className="divide-y divide-border/40">

            {(insurance.provider || insurance.insuranceProvider) && (
              <div className="px-4 py-3">
                <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide mb-1">{t('qrd.insurance_provider')}</p>
                <p className="text-sm font-bold text-foreground">{insurance.provider || insurance.insuranceProvider}</p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">{t('qrd.insurance_provider_desc')}</p>
              </div>
            )}

            {(insurance.policyNumber || insurance.policy_number) && (
              <div className="px-4 py-3">
                <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide mb-1">{t('qrd.policy_number')}</p>
                <p className="text-sm font-mono font-bold tabular-nums text-foreground">{insurance.policyNumber || insurance.policy_number}</p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">{t('qrd.policy_number_desc')}</p>
              </div>
            )}

            {(insurance.groupNumber || insurance.group_number) && (
              <div className="px-4 py-3">
                <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide mb-1">{t('qrd.group_number')}</p>
                <p className="text-sm font-mono font-bold tabular-nums text-foreground">{insurance.groupNumber || insurance.group_number}</p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">{t('qrd.group_number_desc')}</p>
              </div>
            )}

            {(insurance.phone || insurance.contactPhone) && (
              <div className="px-4 py-3">
                <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide mb-1">{t('qrd.insurance_helpline')}</p>
                <a href={`tel:${insurance.phone || insurance.contactPhone}`}
                  className="flex items-center gap-2 w-fit">
                  <span className="text-sm font-mono font-bold text-primary tabular-nums">{insurance.phone || insurance.contactPhone}</span>
                  <span className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-semibold">{t('qrd.tap_to_call')}</span>
                </a>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">{t('qrd.insurance_helpline_desc')}</p>
              </div>
            )}

            {insurance.notes && (
              <div className="px-4 py-3">
                <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide mb-1">{t('qrd.additional_notes')}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{insurance.notes}</p>
              </div>
            )}

          </div>
        </CollapsibleSection>
      )}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="h-44 bg-gradient-to-br from-destructive to-rose-700 animate-pulse" />
      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
        <Shimmer className="h-48 w-full rounded-xl" />
        <Shimmer className="h-12 w-full rounded-xl" />
        <Shimmer className="h-32 w-full rounded-xl" />
        <Shimmer className="h-24 w-full rounded-xl" />
      </div>
    </div>
  )
}

// ─── Not found ────────────────────────────────────────────────────────────────

function NotFoundState({ passcode }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <span className="material-symbols-outlined text-3xl text-muted-foreground/40">qr_code_2</span>
      </div>
      <h2 className="text-xl font-bold mb-2">{t('qrd.qr_not_found')}</h2>
      <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">
        Code <span className="font-mono font-semibold text-foreground">{passcode}</span> {t('qrd.qr_not_found_sub')}
      </p>
      <p className="text-xs text-muted-foreground/50 mt-6">{t('qrd.protected_by')}</p>
    </div>
  )
}

// ─── Not activated ────────────────────────────────────────────────────────────

function NotActivatedState({ passcode }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-5">
        <span className="material-symbols-outlined text-3xl text-warning">link_off</span>
      </div>
      <h2 className="text-xl font-bold mb-2">{t('qrd.not_activated')}</h2>
      <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">
        Code <span className="font-mono font-semibold text-foreground">{passcode}</span> {t('qrd.not_activated_sub')}
      </p>
      <p className="text-xs text-muted-foreground/50 mt-6">{t('qrd.protected_by')}</p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function QRDisplayPage() {
  const { t } = useTranslation()
  const { passcode } = useParams()
  const [mapCoords, setMapCoords] = useState(null)
  const [locationSource, setLocationSource] = useState(null) // 'gps' | 'ip' | null
  const [activeTab, setActiveTab] = useState('critical')
  const scanMetaRef = useRef({ latitude: null, longitude: null, ipAddress: '', permissionGiven: false })

  // ── Location: GPS first, IP fallback ─────────────────────────────────────

  useEffect(() => {
    // Always get IP (for scan logging)
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => { scanMetaRef.current.ipAddress = d.ip })
      .catch(() => {})

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          scanMetaRef.current = { ...scanMetaRef.current, latitude: lat, longitude: lng, permissionGiven: true }
          setMapCoords({ lat, lng })
          setLocationSource('gps')
        },
        () => {
          // GPS denied — fall back to IP geolocation
          scanMetaRef.current.permissionGiven = false
          fetch('https://ipapi.co/json/')
            .then(r => r.json())
            .then(d => {
              if (d.latitude && d.longitude) {
                setMapCoords({ lat: d.latitude, lng: d.longitude, city: d.city, region: d.region })
                setLocationSource('ip')
              }
            })
            .catch(() => {})
        },
        { timeout: 8000 }
      )
    } else {
      // No geolocation API at all — use IP
      fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then(d => {
          if (d.latitude && d.longitude) {
            setMapCoords({ lat: d.latitude, lng: d.longitude, city: d.city, region: d.region })
            setLocationSource('ip')
          }
        })
        .catch(() => {})
    }
  }, [])

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: qr, isLoading: loadingQR, isError: errorQR } = useQuery({
    queryKey: ['qr-display', passcode],
    queryFn: () => getQRCode(passcode),
    staleTime: 60_000, retry: 1,
  })

  const uid = qr?.uid
  const childId = qr?.childId
  const enabled = !!uid && !!childId

  const { data: personalInfo = {}, isLoading: loadingInfo } = useQuery({
    queryKey: ['qr-personal', uid, childId], queryFn: () => getPersonalInfo(uid, childId), enabled, staleTime: 60_000,
  })
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['qr-contacts', uid, childId], queryFn: () => getEmergencyContacts(uid, childId), enabled, staleTime: 60_000,
  })
  const { data: conditionsA = [] } = useQuery({
    queryKey: ['qr-cond-a', uid, childId], queryFn: () => getMedicalItems(uid, childId, 'mediccond'), enabled, staleTime: 60_000,
  })
  const { data: conditionsB = [] } = useQuery({
    queryKey: ['qr-cond-b', uid, childId], queryFn: () => getMedicalItems(uid, childId, 'mediccona'), enabled, staleTime: 60_000,
  })
  const { data: allergies = [] } = useQuery({
    queryKey: ['qr-allergies', uid, childId], queryFn: () => getMedicalItems(uid, childId, 'allergies'), enabled, staleTime: 60_000,
  })
  const { data: medications = [] } = useQuery({
    queryKey: ['qr-medications', uid, childId], queryFn: () => getMedicalItems(uid, childId, 'medications'), enabled, staleTime: 60_000,
  })
  const { data: procedures = [] } = useQuery({
    queryKey: ['qr-procedures', uid, childId], queryFn: () => getMedicalItems(uid, childId, 'procedures'), enabled, staleTime: 60_000,
  })
  const { data: vaccinations = [] } = useQuery({
    queryKey: ['qr-vaccinations', uid, childId], queryFn: () => getMedicalItems(uid, childId, 'vaccinations'), enabled, staleTime: 60_000,
  })
  const { data: insurance = {} } = useQuery({
    queryKey: ['qr-insurance', uid, childId], queryFn: () => getInsurance(uid, childId), enabled, staleTime: 60_000,
  })

  const conditions = [...conditionsA, ...conditionsB]
  const isLoading = loadingQR || (enabled && (loadingInfo || loadingContacts))

  // ── Scan logging ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!qr || !uid) return
    recordScan(passcode)
    createAlert(uid, childId, {
      type: 'scan', title: 'QR Code Scanned',
      description: `Your "${qr.name || 'QR code'}" was accessed by someone nearby.`,
      icon: 'qr_code_scanner',
      metadata: { passcode, scannerType: 'Public' },
    })
    const timer = setTimeout(() => {
      const userID = qr.UserID || `${uid} ${(qr.childId || '').replace('child', '')}`
      logScanToQRCodeScans({
        userID, passcode,
        dob: personalInfo?.dob || '',
        latitude: scanMetaRef.current.latitude,
        longitude: scanMetaRef.current.longitude,
        ipAddress: scanMetaRef.current.ipAddress,
        permissionGiven: scanMetaRef.current.permissionGiven,
        name: personalInfo?.name || qr.name || '',
        uid,
      })
    }, 3000)
    return () => clearTimeout(timer)
  }, [qr, uid, passcode, personalInfo])

  // ── Guard states ──────────────────────────────────────────────────────────

  if (loadingQR) return <LoadingState />
  if (errorQR || !qr) return <NotFoundState passcode={passcode} />
  if (!qr.isActive || !qr.uid) return <NotActivatedState passcode={passcode} />

  // ── Derived data ──────────────────────────────────────────────────────────

  const displayName    = personalInfo?.name || qr.name || 'Unknown'
  const bloodGroup     = personalInfo?.bloodGroup || ''
  const bgStyle        = bloodGroupStyle(bloodGroup)
  const profilePic     = personalInfo?.profilePicUrl || ''
  const dob            = personalInfo?.dob || ''
  const gender         = personalInfo?.gender || ''
  const phone          = personalInfo?.phone || personalInfo?.phoneNumber || ''
  const city           = [personalInfo?.addressCity, personalInfo?.addressState].filter(Boolean).join(', ')
  const age            = calcAge(dob)
  const ageLine        = [
    age !== null ? `${age} year old` : null,
    gender ? gender.toLowerCase() : null,
    personalInfo?.addressCity ? `from ${personalInfo.addressCity}` : null,
  ].filter(Boolean).join(' ')
  const medNotes       = personalInfo?.medicalNotes || personalInfo?.notes || ''
  const hasCritical    = allergies.length > 0 || conditions.length > 0
  const hasInsurance   = insurance && Object.keys(insurance).filter(k => k !== 'updatedAt').length > 0
  const criticalCount  = allergies.length + conditions.length

  // Auto-switch to critical tab if there are alerts
  // (only on first load, not on every render)

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[100dvh] bg-background">

      {/* ── Emergency hero banner ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, hsl(350 82% 44%) 0%, hsl(350 82% 36%) 100%)', boxShadow: '0 4px 24px hsl(350 82% 50% / 0.25)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative max-w-lg mx-auto px-5 py-5">
          {/* Top strip */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">{t('qrd.emergency_info')}</span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageBar compact />
              <div className="h-[34px] w-[34px] rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid rgba(255,255,255,0.70)', boxShadow: '0 0 0 3px rgba(255,255,255,0.20), 0 4px 16px rgba(0,0,0,0.22)' }}>
                <img src="/logo1.png" alt="WeSafe" className="h-full w-full object-cover scale-125" />
              </div>
            </div>
          </div>

          {/* Profile row */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {isLoading ? (
              <Shimmer className="w-16 h-16 rounded-full flex-shrink-0" />
            ) : (
              <div className="relative flex-shrink-0">
                {profilePic ? (
                  <img src={profilePic} alt={displayName}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-white/20 shadow-lg" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/15 ring-4 ring-white/20 flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white/70">{displayName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                {bloodGroup && (
                  <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full ring-[3px] ring-white/20 flex items-center justify-center font-black text-[10px] shadow-md ${bgStyle.dot} text-white`}>
                    {bloodGroup}
                  </div>
                )}
              </div>
            )}

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="space-y-2">
                  <Shimmer className="h-6 w-36 rounded-md" />
                  <Shimmer className="h-4 w-24 rounded-md" />
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-white tracking-tight leading-tight truncate">{displayName}</h1>
                  <div className="flex items-center flex-wrap gap-1.5 mt-1">
                    {dob && <span className="text-[11px] text-white/60">{dob}</span>}
                    {dob && city && <span className="text-white/30 text-[10px]">·</span>}
                    {city && <span className="text-[11px] text-white/60">{city}</span>}
                  </div>
                  {ageLine && (
                    <p className="text-[11px] text-white/50 mt-0.5 italic">{ageLine}</p>
                  )}
                </>
              )}
            </div>

            {/* Critical badge */}
            {!isLoading && hasCritical && (
              <div className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/30">
                <span className="material-symbols-outlined filled text-[14px] text-amber-300">warning</span>
                <span className="text-[11px] font-bold text-amber-300">{criticalCount}</span>
              </div>
            )}
          </div>

          {/* Compact contact count hint in hero */}
          {!isLoading && contacts.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined filled text-[13px] text-white/40">contact_emergency</span>
              <span className="text-[11px] text-white/40">
                {t('qrd.contacts_on_file', { count: contacts.length })}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Map section — always at top */}
        <Reveal delay={0.05}>
          <MapSection mapCoords={mapCoords} locationSource={locationSource} />
        </Reveal>

        {/* Emergency contacts — always visible, masked */}
        {!isLoading && contacts.length > 0 && (
          <Reveal delay={0.1}>
            <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60"
                style={{ background: 'hsl(var(--destructive)/0.04)' }}>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined filled text-[18px] text-destructive">contact_emergency</span>
                  <div>
                    <p className="text-xs font-bold text-destructive uppercase tracking-wider">{t('qrd.emergency_contacts')}</p>
                    <p className="text-[10.5px] text-muted-foreground mt-0.5">{t('qrd.emergency_contacts_sub')}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {contacts.length}
                </span>
              </div>

              {/* Contact rows */}
              <div className="divide-y divide-border/50">
                {contacts.map((c, idx) => {
                  const contactPhone = c['Emergency Contact Number'] || c.phone || ''
                  const contactName  = c['Emergency Contact Name']   || c.name  || ''
                  const relation     = c['Emergency Contact Relation'] || c.relationship || ''

                  return (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                      {/* Avatar circle */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm
                        ${idx === 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                        {contactName ? contactName.charAt(0).toUpperCase() : '?'}
                      </div>

                      {/* Name + relation + masked number */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {contactName && (
                            <p className="text-sm font-semibold text-foreground truncate">{contactName}</p>
                          )}
                          {relation && (
                            <span className="text-[10px] font-semibold bg-muted text-muted-foreground rounded px-1.5 py-0.5 uppercase tracking-wide flex-shrink-0">
                              {relation}
                            </span>
                          )}
                          {idx === 0 && (
                            <span className="text-[10px] font-bold bg-destructive/10 text-destructive rounded px-1.5 py-0.5 uppercase tracking-wide flex-shrink-0">
                              {t('qrd.primary')}
                            </span>
                          )}
                        </div>
                        {/* Masked number */}
                        <p className="text-[12px] font-mono font-semibold text-muted-foreground mt-0.5 tabular-nums tracking-wider">
                          {maskPhone(contactPhone)}
                        </p>
                      </div>

                      {/* Call button */}
                      <a
                        href={`tel:${contactPhone}`}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-xs press-scale transition-colors
                          ${idx === 0
                            ? 'bg-destructive text-white'
                            : 'bg-primary/10 text-primary border border-primary/20'
                          }`}
                        style={idx === 0 ? { boxShadow: '0 3px 10px hsl(var(--destructive)/0.25)' } : {}}
                      >
                        <span className="material-symbols-outlined filled text-[14px]">call</span>
                        {t('qrd.call')}
                      </a>
                    </div>
                  )
                })}
              </div>

              {/* Footer note */}
              <div className="px-4 py-2.5 border-t border-border/40 bg-muted/30">
                <p className="text-[10.5px] text-muted-foreground">
                  {t('qrd.masked_note')}
                </p>
              </div>
            </div>
          </Reveal>
        )}

        {/* Tab bar */}
        <Reveal delay={0.15}>
          <TabBar active={activeTab} onChange={setActiveTab} criticalCount={criticalCount} />
        </Reveal>

        {/* Tab content */}
        <Reveal delay={0.15}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {activeTab === 'critical' && (
                <CriticalTab allergies={allergies} conditions={conditions} isLoading={isLoading} />
              )}
              {activeTab === 'medical' && (
                <MedicalTab medications={medications} procedures={procedures} vaccinations={vaccinations} isLoading={isLoading} />
              )}
              {activeTab === 'info' && (
                <InfoTab
                  bloodGroup={bloodGroup} bgStyle={bgStyle}
                  medNotes={medNotes} insurance={insurance}
                  hasInsurance={hasInsurance} isLoading={isLoading}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </Reveal>

        {/* Footer */}
        <div className="pb-6 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <img src="/logo1.png" alt="" className="w-3.5 h-3.5 rounded opacity-30" />
            <p className="text-xs text-muted-foreground/60">{t('qrd.protected_by')}</p>
          </div>
          <p className="text-[11px] text-muted-foreground/40">{t('qrd.scan_id')}: {passcode} · {t('qrd.info_privacy')}</p>
        </div>

      </div>
    </div>
  )
}
