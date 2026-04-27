import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-sm w-full"
      >
        {/* Illustration */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6">
          <span className="material-symbols-outlined text-5xl text-muted-foreground/50">search_off</span>
        </div>

        <h1 className="text-6xl font-black text-primary mb-2">404</h1>
        <h2 className="text-xl font-semibold mb-3">{t('common.not_found_title')}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          {t('common.not_found_desc')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            {t('common.go_back')}
          </Button>
          <Link to="/">
            <Button className="gap-2 w-full sm:w-auto">
              <span className="material-symbols-outlined text-base">home</span>
              {t('common.dashboard')}
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
