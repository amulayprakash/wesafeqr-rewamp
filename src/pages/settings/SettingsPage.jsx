import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { Header } from '@/components/layout/Header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { SUPPORTED_LANGUAGES } from '@/i18n'
import toast from 'react-hot-toast'

const SETTING_SECTIONS = [
  {
    titleKey: 'settings.profile_family',
    items: [
      { icon: 'person',          labelKey: 'settings.personal_info',    link: '/profile/personal',   iconBg: 'bg-primary/10',                          iconColor: 'text-primary' },
      { icon: 'family_restroom', labelKey: 'settings.manage_profiles',  link: '/settings/profiles',  iconBg: 'bg-violet-100 dark:bg-violet-900/30',     iconColor: 'text-violet-600 dark:text-violet-400' },
    ],
  },
  {
    titleKey: 'settings.app_customization',
    items: [
      { icon: 'language',      labelKey: 'settings.language',      isLanguage: true,    link: '/settings/language', iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',  iconColor: 'text-cyan-600 dark:text-cyan-400' },
      { icon: 'dark_mode',     labelKey: 'settings.dark_mode',     isToggle: true,                              iconBg: 'bg-slate-100 dark:bg-slate-800',      iconColor: 'text-slate-600 dark:text-slate-400' },
      { icon: 'notifications', labelKey: 'settings.notifications', comingSoon: true,                            iconBg: 'bg-amber-100 dark:bg-amber-900/30',   iconColor: 'text-amber-600 dark:text-amber-400' },
    ],
  },
  {
    titleKey: 'settings.safety_privacy',
    items: [
      { icon: 'contact_emergency', labelKey: 'settings.emergency_contacts', link: '/profile/emergency', iconBg: 'bg-rose-100 dark:bg-rose-900/30',       iconColor: 'text-rose-600 dark:text-rose-400' },
      { icon: 'pin',               labelKey: 'settings.security_pin',       comingSoon: true,           iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',  iconColor: 'text-emerald-600 dark:text-emerald-400' },
    ],
  },
  {
    titleKey: 'settings.support_legal',
    items: [
      { icon: 'shopping_bag', labelKey: 'settings.shop',    link: '/shop',                                 iconBg: 'bg-amber-100 dark:bg-amber-900/30',  iconColor: 'text-amber-600 dark:text-amber-400' },
      { icon: 'help',         labelKey: 'settings.help',    comingSoon: true,                              iconBg: 'bg-sky-100 dark:bg-sky-900/30',       iconColor: 'text-sky-600 dark:text-sky-400' },
      { icon: 'policy',       labelKey: 'settings.privacy', href: 'https://wesafeqr.com/legal/privacy',   iconBg: 'bg-muted',                            iconColor: 'text-muted-foreground' },
      { icon: 'gavel',        labelKey: 'settings.terms',   href: 'https://wesafeqr.com/legal/terms',     iconBg: 'bg-muted',                            iconColor: 'text-muted-foreground' },
    ],
  },
]

const sectionAnim = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const displayName = user?.displayName || 'User'
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const currentLang = SUPPORTED_LANGUAGES.find(
    (l) => l.code === (i18n.language?.split('-')[0] ?? 'en')
  )

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success(t('settings.logged_out'))
      navigate('/auth')
    } catch {
      toast.error(t('settings.logout_failed'))
    }
  }

  const handleComingSoon = (labelKey) => {
    toast(t('settings.coming_soon_toast', { label: t(labelKey) }), { icon: '🚧' })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title={t('settings.title')} showBack />

      <div className="px-4 py-5 max-w-2xl mx-auto lg:px-6 lg:py-8 space-y-5">

        {/* Profile hero card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="relative overflow-hidden rounded-2xl p-5 text-white"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(237 52% 52%) 100%)',
            boxShadow: '0 8px 32px hsl(var(--primary) / 0.3)',
          }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/6 rounded-full pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <Avatar className="h-16 w-16 flex-shrink-0" style={{ boxShadow: '0 0 0 3px rgba(255,255,255,0.25)' }}>
              <AvatarImage src={user?.photoURL} alt={displayName} />
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg text-white tracking-tight truncate">{displayName}</h2>
              <p className="text-white/65 text-sm truncate">{user?.email}</p>
            </div>
            <Link
              to="/profile/personal"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/12 hover:bg-white/22 active:bg-white/30 transition-colors"
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>chevron_right</span>
            </Link>
          </div>
        </motion.div>

        {/* Settings sections */}
        {SETTING_SECTIONS.map((section, sectionIndex) => (
          <motion.div
            key={section.titleKey}
            variants={sectionAnim}
            initial="hidden"
            animate="show"
            transition={{ delay: sectionIndex * 0.07, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
              {t(section.titleKey)}
            </p>
            <div
              className="bg-card rounded-2xl border border-border/60 overflow-hidden"
              style={{ boxShadow: '0 1px 3px hsl(var(--foreground)/0.04)' }}
            >
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className={itemIndex < section.items.length - 1 ? 'border-b border-border/50' : ''}>
                  {item.isToggle ? (
                    <div className="flex items-center justify-between px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                          <span className={`material-symbols-outlined ${item.iconColor}`} style={{ fontSize: '18px' }}>{item.icon}</span>
                        </div>
                        <span className="font-medium text-sm">{t(item.labelKey)}</span>
                      </div>
                      <Switch checked={isDark} onCheckedChange={toggleTheme} />
                    </div>
                  ) : item.comingSoon ? (
                    <button
                      onClick={() => handleComingSoon(item.labelKey)}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-accent/50 active:bg-accent transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                          <span className={`material-symbols-outlined ${item.iconColor}`} style={{ fontSize: '18px' }}>{item.icon}</span>
                        </div>
                        <span className="font-medium text-sm">{t(item.labelKey)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-semibold">{t('settings.soon_badge')}</span>
                        <span className="material-symbols-outlined text-muted-foreground/50" style={{ fontSize: '18px' }}>chevron_right</span>
                      </div>
                    </button>
                  ) : item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3.5 hover:bg-accent/50 active:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                          <span className={`material-symbols-outlined ${item.iconColor}`} style={{ fontSize: '18px' }}>{item.icon}</span>
                        </div>
                        <span className="font-medium text-sm">{t(item.labelKey)}</span>
                      </div>
                      <span className="material-symbols-outlined text-muted-foreground/50" style={{ fontSize: '18px' }}>open_in_new</span>
                    </a>
                  ) : (
                    <Link
                      to={item.link}
                      className="flex items-center justify-between px-4 py-3.5 hover:bg-accent/50 active:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                          <span className={`material-symbols-outlined ${item.iconColor}`} style={{ fontSize: '18px' }}>{item.icon}</span>
                        </div>
                        <span className="font-medium text-sm">{t(item.labelKey)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.isLanguage && (
                          <span className="text-sm text-muted-foreground font-medium">{currentLang?.nativeLabel ?? 'English'}</span>
                        )}
                        <span className="material-symbols-outlined text-muted-foreground/50" style={{ fontSize: '18px' }}>chevron_right</span>
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.35 }}
        >
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full h-12 gap-2 rounded-xl font-semibold press-scale"
            style={{ boxShadow: '0 4px 12px hsl(var(--destructive)/0.25)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
            {t('settings.logout')}
          </Button>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground pb-2">{t('settings.version')}</p>
      </div>
    </div>
  )
}
