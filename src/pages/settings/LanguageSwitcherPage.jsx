import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { SUPPORTED_LANGUAGES } from '@/i18n'
import toast from 'react-hot-toast'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item      = { hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }

export function LanguageSwitcherPage() {
  const { i18n, t } = useTranslation()
  const currentLang = i18n.language?.split('-')[0] ?? 'en'

  const handleSelect = async (code) => {
    if (code === currentLang) return
    await i18n.changeLanguage(code)
    toast.success(t('language.selected'))
  }

  const indian        = SUPPORTED_LANGUAGES.filter((l) => l.region === 'indian')
  const international = SUPPORTED_LANGUAGES.filter((l) => l.region === 'international')

  const LangGroup = ({ title, langs }) => (
    <div className="mb-6">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">{title}</p>
      <Card>
        <CardContent className="p-0 divide-y divide-border overflow-hidden rounded-xl">
          {langs.map((lang) => {
            const isSelected = lang.code === currentLang
            return (
              <motion.button
                key={lang.code}
                variants={item}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors text-left ${
                  isSelected
                    ? 'bg-primary/5'
                    : 'hover:bg-accent/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl w-7 text-center">{lang.flag}</span>
                  <div>
                    <p className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>{lang.label}</p>
                    <p className="text-xs text-muted-foreground">{lang.nativeLabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isSelected && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {t('language.current')}
                    </span>
                  )}
                  {isSelected && (
                    <span className="material-symbols-outlined filled text-primary" style={{ fontSize: '18px' }}>
                      check_circle
                    </span>
                  )}
                </div>
              </motion.button>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <Header title={t('language.title')} showBack />

      <div className="px-4 py-6 max-w-2xl mx-auto lg:px-6 lg:py-8">
        <p className="text-sm text-muted-foreground mb-6">{t('language.choose')}</p>

        <motion.div variants={container} initial="hidden" animate="show">
          <LangGroup title={t('language.indian')} langs={indian} />
          <LangGroup title={t('language.international')} langs={international} />
        </motion.div>
      </div>
    </div>
  )
}
