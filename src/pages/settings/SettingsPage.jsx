import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

const settingSections = [
  {
    title: 'Profile & Family',
    items: [
      { icon: 'person', label: 'Personal Information', link: '/profile/personal', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600 dark:text-indigo-400' },
      { icon: 'family_restroom', label: 'Manage Child Profiles', link: '/settings/profiles', iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400' },
    ],
  },
  {
    title: 'App Customization',
    items: [
      { icon: 'language', label: 'Language', value: 'English', link: '/settings/language', iconBg: 'bg-cyan-100 dark:bg-cyan-900/30', iconColor: 'text-cyan-600 dark:text-cyan-400' },
      { icon: 'dark_mode', label: 'Dark Mode', isToggle: true, iconBg: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-600 dark:text-slate-400' },
      { icon: 'notifications', label: 'Notifications', link: '/settings/notifications', iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
    ],
  },
  {
    title: 'Safety & Privacy',
    items: [
      { icon: 'contact_emergency', label: 'Emergency Contacts', link: '/profile/emergency', iconBg: 'bg-rose-100 dark:bg-rose-900/30', iconColor: 'text-rose-600 dark:text-rose-400' },
      { icon: 'pin', label: 'Security PIN', link: '/settings/pin', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    ],
  },
  {
    title: 'Support & Legal',
    items: [
      { icon: 'help', label: 'Help Center', link: '/help', iconBg: 'bg-sky-100 dark:bg-sky-900/30', iconColor: 'text-sky-600 dark:text-sky-400' },
      { icon: 'policy', label: 'Privacy Policy', link: '/legal/privacy', iconBg: 'bg-muted', iconColor: 'text-muted-foreground' },
      { icon: 'gavel', label: 'Terms of Service', link: '/legal/terms', iconBg: 'bg-muted', iconColor: 'text-muted-foreground' },
    ],
  },
]

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.displayName || 'User'
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
      navigate('/auth')
    } catch (error) {
      toast.error('Failed to log out')
    }
  }

  const handleToggleDarkMode = () => {
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Settings" showBack />

      <div className="px-4 py-6 max-w-2xl mx-auto lg:px-6 lg:py-8">
        {/* Premium profile card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-violet-700 p-5 mb-6 text-white"
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-3 ring-white/30">
              <AvatarImage src={user?.photoURL} alt={displayName} />
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg text-white truncate">{displayName}</h2>
              <p className="text-white/70 text-sm truncate">{user?.email}</p>
            </div>
            <Link
              to="/profile/personal"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
            >
              <span className="material-symbols-outlined text-white">chevron_right</span>
            </Link>
          </div>
        </motion.div>

        {/* Settings sections */}
        {settingSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.08 }}
            className="mb-5"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
              {section.title}
            </p>
            <div className="bg-card rounded-2xl border overflow-hidden divide-y divide-border">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  {item.isToggle ? (
                    <div className="flex items-center justify-between px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.iconBg}`}>
                          <span className={`material-symbols-outlined ${item.iconColor}`} style={{ fontSize: '18px' }}>{item.icon}</span>
                        </div>
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                      <Switch onCheckedChange={handleToggleDarkMode} />
                    </div>
                  ) : (
                    <Link
                      to={item.link}
                      className="flex items-center justify-between px-4 py-3.5 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.iconBg}`}>
                          <span className={`material-symbols-outlined ${item.iconColor}`} style={{ fontSize: '18px' }}>{item.icon}</span>
                        </div>
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.value && <span className="text-sm text-muted-foreground">{item.value}</span>}
                        <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: '18px' }}>chevron_right</span>
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Logout */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Button onClick={handleLogout} variant="destructive" className="w-full h-12 gap-2">
            <span className="material-symbols-outlined">logout</span>
            Log Out
          </Button>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">WeSafe QR v2.4.0</p>
      </div>
    </div>
  )
}
