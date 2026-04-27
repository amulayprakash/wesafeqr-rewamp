import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { SUPPORTED_LANGUAGES } from '@/i18n'
import { cn } from '@/lib/utils'

export function LanguagePicker({ className, variant = 'default', align = 'right' }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === (i18n.language?.split('-')[0] ?? 'en')) ||
    SUPPORTED_LANGUAGES[0]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isInverted = variant === 'inverted'

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 border',
          isInverted
            ? 'text-white'
            : open
            ? 'bg-primary/10 border-primary/30 text-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]'
            : 'hover:bg-primary/5 hover:border-primary/20 text-foreground border-border bg-background/80 shadow-sm'
        )}
        style={isInverted ? {
          background: 'linear-gradient(160deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.10) 100%)',
          borderColor: 'rgba(255,255,255,0.40)',
          boxShadow: '0 1.5px 0 rgba(255,255,255,0.45) inset, 0 4px 16px rgba(0,0,0,0.15)',
        } : undefined}
      >
        {/* Globe icon with brand color */}
        <span
          className={cn(
            'material-symbols-outlined transition-colors duration-150',
            open
              ? isInverted ? 'text-white' : 'text-primary'
              : isInverted ? 'text-white/70' : 'text-primary/70'
          )}
          style={{ fontSize: '15px' }}
        >
          language
        </span>

        <span className="text-[14px] leading-none">{currentLang.flag}</span>

        <span
          className={cn(
            'text-[12px] font-bold uppercase tracking-wider',
            open
              ? isInverted ? 'text-white' : 'text-primary'
              : isInverted ? 'text-white/90' : 'text-foreground'
          )}
        >
          {currentLang.code}
        </span>

        <span
          className={cn(
            'material-symbols-outlined transition-transform duration-200',
            open
              ? isInverted ? 'text-white' : 'text-primary'
              : isInverted ? 'text-white/50' : 'text-muted-foreground',
            open && 'rotate-180'
          )}
          style={{ fontSize: '14px' }}
        >
          expand_more
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              'absolute top-full mt-2 w-56 rounded-2xl border border-border z-50 overflow-hidden',
              align === 'right' ? 'right-0' : 'left-0'
            )}
            style={{
              background: 'hsl(var(--background))',
              boxShadow:
                '0 4px 6px -1px rgba(0,0,0,0.12), 0 16px 48px rgba(0,0,0,0.18), 0 0 0 1px hsl(var(--primary) / 0.1)',
            }}
          >
            {/* Branded header strip */}
            <div
              className="px-3.5 pt-3 pb-2 flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))',
                borderBottom: '1px solid hsl(var(--primary) / 0.12)',
              }}
            >
              <span
                className="material-symbols-outlined filled text-primary"
                style={{ fontSize: '16px' }}
              >
                language
              </span>
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest">
                Select Language
              </p>
            </div>

            <div className="max-h-72 overflow-y-auto py-1.5">
              <SectionLabel label="Indian" />
              {SUPPORTED_LANGUAGES.filter((l) => l.region === 'indian').map((lang) => (
                <LangOption
                  key={lang.code}
                  lang={lang}
                  currentCode={currentLang.code}
                  onChange={(code) => {
                    i18n.changeLanguage(code)
                    setOpen(false)
                  }}
                />
              ))}

              <div className="h-px mx-3 my-1" style={{ background: 'hsl(var(--border) / 0.5)' }} />

              <SectionLabel label="International" />
              {SUPPORTED_LANGUAGES.filter((l) => l.region === 'international').map((lang) => (
                <LangOption
                  key={lang.code}
                  lang={lang}
                  currentCode={currentLang.code}
                  onChange={(code) => {
                    i18n.changeLanguage(code)
                    setOpen(false)
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SectionLabel({ label }) {
  return (
    <p className="px-3.5 pt-1 pb-1 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
      {label}
    </p>
  )
}

function LangOption({ lang, currentCode, onChange }) {
  const isSelected = lang.code === currentCode
  return (
    <button
      onClick={() => onChange(lang.code)}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-all duration-100 text-left',
        isSelected
          ? 'bg-primary/[0.08] text-primary'
          : 'hover:bg-accent/70 text-foreground active:bg-accent'
      )}
    >
      <span className="text-base w-6 text-center flex-shrink-0 leading-none">{lang.flag}</span>
      <div className="flex-1 min-w-0">
        <p className={cn('font-semibold text-[13px] leading-tight', isSelected ? 'text-primary' : 'text-foreground')}>
          {lang.nativeLabel}
        </p>
        <p className="text-[11px] text-muted-foreground leading-tight">{lang.label}</p>
      </div>
      {isSelected && (
        <span
          className="material-symbols-outlined filled text-primary flex-shrink-0"
          style={{ fontSize: '14px' }}
        >
          check_circle
        </span>
      )}
    </button>
  )
}
