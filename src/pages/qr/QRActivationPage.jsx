import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { ProfileContext } from '@/contexts/ProfileContext'
import { activateQRCode } from '@/services/qrService'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

// ─── QR type options (labels/descs resolved at render via t()) ───────────────
const QR_TYPE_CONFIGS = [
  {
    id: 'wesafe',
    labelKey: 'qr.type_medical',
    descKey: 'qr.type_medical_desc',
    icon: 'medical_services',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    activeBorder: 'border-indigo-500',
    activeBg: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
  {
    id: 'lostfound',
    labelKey: 'qr.type_lostfound',
    descKey: 'qr.type_lostfound_desc',
    icon: 'inventory_2',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    activeBorder: 'border-amber-500',
    activeBg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    id: 'vehicle',
    labelKey: 'qr.type_vehicle',
    descKey: 'qr.type_vehicle_desc',
    icon: 'directions_car',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    activeBorder: 'border-emerald-500',
    activeBg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
]

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <motion.div
            animate={{
              width: i === current ? 32 : 10,
              backgroundColor: i <= current ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
            }}
            transition={{ duration: 0.3 }}
            className="h-2.5 rounded-full"
          />
        </div>
      ))}
    </div>
  )
}

// ─── Slide animation ──────────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir < 0 ? 40 : -40, opacity: 0 }),
}

// ─── Main component ───────────────────────────────────────────────────────────
export function QRActivationPage() {
  const { user } = useAuth()
  const { profiles, activeProfileId } = useContext(ProfileContext)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form state
  const [passcode, setPasscode] = useState('')
  const [qrName, setQrName] = useState('')
  const [qrType, setQrType] = useState('wesafe')
  const [selectedProfile, setSelectedProfile] = useState(activeProfileId || '')

  const goTo = (nextStep) => {
    setDirection(nextStep > step ? 1 : -1)
    setStep(nextStep)
  }

  // ── Step 0: Enter passcode ────────────────────────────────────────────────
  const handlePasscodeNext = () => {
    const code = passcode.trim().toUpperCase()
    if (!code || code.length < 4) {
      toast.error(t('qr.invalid_passcode'))
      return
    }
    setPasscode(code)
    goTo(1)
  }

  // ── Step 1: Configure QR ──────────────────────────────────────────────────
  const handleConfigureNext = () => {
    if (!qrName.trim()) {
      toast.error(t('qr.enter_name'))
      return
    }
    if (!selectedProfile) {
      toast.error(t('qr.select_profile_error'))
      return
    }
    goTo(2)
  }

  // ── Step 2: Confirm & activate ────────────────────────────────────────────
  const handleActivate = async () => {
    if (!user) return
    setLoading(true)
    try {
      await activateQRCode(user.uid, selectedProfile, passcode, {
        name: qrName.trim(),
        type: qrType,
      })
      goTo(3)
    } catch (err) {
      toast.error(err.message || t('qr.activation_failed'))
    } finally {
      setLoading(false)
    }
  }

  const selectedTypeCfg = QR_TYPE_CONFIGS.find((cfg) => cfg.id === qrType)
  const selectedProfileName = profiles.find((p) => p.id === selectedProfile)?.name || t('common.profile')

  return (
    <div className="min-h-screen bg-background">
      <Header title={t('qr.activate_title')} showBack />

      <div className="px-4 py-6 max-w-md mx-auto lg:px-6 lg:py-8">
        {step < 3 && <StepIndicator current={step} total={3} />}

        <AnimatePresence mode="wait" custom={direction}>
          {/* ─── Step 0: Enter passcode ─────────────────────────────────── */}
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {/* Hero */}
              <div className="text-center mb-8">
                <div className="relative inline-flex items-center justify-center mb-5">
                  <span className="absolute w-24 h-24 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2.5s' }} />
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/25">
                    <span className="material-symbols-outlined filled text-white" style={{ fontSize: '36px' }}>qr_code_2</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">{t('qr.enter_passcode_heading')}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t('qr.enter_passcode_desc')}
                </p>
              </div>

              <Card className="mb-4">
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="passcode" className="text-sm font-medium">{t('qr.qr_passcode_label')}</Label>
                    <Input
                      id="passcode"
                      placeholder={t('qr.passcode_placeholder')}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handlePasscodeNext()}
                      className="h-12 text-center text-lg font-mono tracking-widest rounded-xl"
                      maxLength={12}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      {t('qr.passcode_hint')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* How to find */}
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>info</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1">{t('qr.where_passcode')}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('qr.where_passcode_desc')}
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handlePasscodeNext} className="w-full h-12 gap-2 shadow-md shadow-primary/20">
                {t('qr.continue')}
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </Button>
            </motion.div>
          )}

          {/* ─── Step 1: Configure ──────────────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-5"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-1">{t('qr.configure_heading')}</h2>
                <p className="text-muted-foreground text-sm">
                  {t('qr.configure_desc')}
                </p>
              </div>

              {/* QR name */}
              <Card>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>label</span>
                    <p className="font-semibold text-sm">{t('qr.give_name')}</p>
                  </div>
                  <Input
                    placeholder={t('qr.name_placeholder')}
                    value={qrName}
                    onChange={(e) => setQrName(e.target.value)}
                    className="h-11 rounded-xl"
                    autoFocus
                  />
                </CardContent>
              </Card>

              {/* QR type */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>category</span>
                    <p className="font-semibold text-sm">{t('qr.select_type')}</p>
                  </div>
                  <div className="space-y-2">
                    {QR_TYPE_CONFIGS.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setQrType(type.id)}
                        className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all text-left ${
                          qrType === type.id
                            ? `${type.activeBorder} ${type.activeBg}`
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${type.iconBg}`}>
                          <span className={`material-symbols-outlined filled ${type.iconColor}`} style={{ fontSize: '20px' }}>{type.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{t(type.labelKey)}</p>
                          <p className="text-xs text-muted-foreground">{t(type.descKey)}</p>
                        </div>
                        {qrType === type.id && (
                          <span className="material-symbols-outlined text-primary filled" style={{ fontSize: '20px' }}>check_circle</span>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Profile selection (only if multiple profiles) */}
              {profiles.length > 1 && (
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>person</span>
                      <p className="font-semibold text-sm">{t('qr.link_profile')}</p>
                    </div>
                    <div className="space-y-2">
                      {profiles.map((profile) => (
                        <button
                          key={profile.id}
                          onClick={() => setSelectedProfile(profile.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                            selectedProfile === profile.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(profile.name || 'P').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{profile.name || t('common.unnamed')}</p>
                            {profile.relation && <p className="text-xs text-muted-foreground">{profile.relation}</p>}
                          </div>
                          {selectedProfile === profile.id && (
                            <span className="material-symbols-outlined text-primary filled" style={{ fontSize: '18px' }}>check_circle</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => goTo(0)} className="flex-1 h-11">
                  <span className="material-symbols-outlined mr-1" style={{ fontSize: '18px' }}>arrow_back</span>
                  {t('common.back')}
                </Button>
                <Button onClick={handleConfigureNext} className="flex-1 h-11 gap-1.5 shadow-md shadow-primary/20">
                  {t('qr.review')}
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── Step 2: Review & confirm ───────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-5"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-1">{t('qr.review_activate')}</h2>
                <p className="text-muted-foreground text-sm">{t('qr.confirm_details')}</p>
              </div>

              {/* Summary card */}
              <Card className="overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary to-violet-500" />
                <CardContent className="p-5 space-y-4">
                  {/* Passcode */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                        <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: '18px' }}>qr_code_2</span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('qr.passcode')}</p>
                        <p className="font-mono font-bold tracking-widest">{passcode}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border" />

                  {/* Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>label</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('qr.display_name')}</p>
                      <p className="font-semibold">{qrName}</p>
                    </div>
                  </div>

                  <div className="border-t border-border" />

                  {/* Type */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selectedTypeCfg?.iconBg}`}>
                      <span className={`material-symbols-outlined filled ${selectedTypeCfg?.iconColor}`} style={{ fontSize: '18px' }}>{selectedTypeCfg?.icon}</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('qr.qr_type')}</p>
                      <p className="font-semibold">{selectedTypeCfg ? t(selectedTypeCfg.labelKey) : ''}</p>
                    </div>
                  </div>

                  <div className="border-t border-border" />

                  {/* Profile */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {selectedProfileName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('qr.linked_profile')}</p>
                      <p className="font-semibold">{selectedProfileName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => goTo(1)} className="flex-1 h-11" disabled={loading}>
                  <span className="material-symbols-outlined mr-1" style={{ fontSize: '18px' }}>arrow_back</span>
                  {t('common.back')}
                </Button>
                <Button onClick={handleActivate} className="flex-1 h-11 gap-2 shadow-md shadow-primary/20" disabled={loading}>
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined filled" style={{ fontSize: '18px' }}>verified</span>
                      {t('qr.activate_btn')}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── Step 3: Success ─────────────────────────────────────────── */}
          {step === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6"
              >
                <span className="material-symbols-outlined text-emerald-500 filled" style={{ fontSize: '52px' }}>check_circle</span>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <h2 className="text-2xl font-bold mb-2">{t('qr.activated_success')}</h2>
                <p className="text-muted-foreground text-sm mb-2">
                  {t('qr.activated_desc', { name: qrName, profile: selectedProfileName })}
                </p>
                <p className="text-xs text-muted-foreground mb-8">
                  {t('qr.activated_note')}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-3"
              >
                <Button
                  onClick={() => navigate('/qr-codes')}
                  className="w-full h-12 gap-2 shadow-md shadow-primary/20"
                >
                  <span className="material-symbols-outlined filled" style={{ fontSize: '18px' }}>qr_code_2</span>
                  {t('qr.view_my_qr')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(0)
                    setPasscode('')
                    setQrName('')
                    setQrType('wesafe')
                  }}
                  className="w-full h-12"
                >
                  {t('qr.activate_another')}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
