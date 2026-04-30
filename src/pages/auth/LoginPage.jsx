import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguagePicker } from '@/components/ui/LanguagePicker'
import toast from 'react-hot-toast'

// ─── Brand palette ──────────────────────────────────────────────────────────
const B = {
  primary:   'hsl(237 46% 62%)',
  primary35: 'hsl(237 50% 35%)',
  primary52: 'hsl(237 46% 52%)',
  coral:     'hsl(350 82% 62%)',
  coralSoft: 'hsl(350 72% 72%)',
}

// ─── SVG Hero Illustration ─────────────────────────────────────────────────
function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 300 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-full h-full drop-shadow-2xl"
    >
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={B.coralSoft} stopOpacity="0.55" />
          <stop offset="100%" stopColor={B.coralSoft} stopOpacity="0" />
        </linearGradient>
        <clipPath id="cc">
          <rect x="75" y="56" width="150" height="168" rx="18" />
        </clipPath>
        <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(200,205,245,0.9)" />
        </linearGradient>
      </defs>

      <circle cx="150" cy="140" r="132" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 9" />
      <circle cx="150" cy="140" r="108" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

      <path
        d="M150 34 L225 62 L225 138 Q225 200 150 226 Q75 200 75 138 L75 62 Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1.5"
      />

      <rect x="75" y="56" width="150" height="168" rx="18"
        fill="rgba(255,255,255,0.10)"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.5"
      />

      <rect x="90" y="72" width="34" height="34" rx="6" fill="rgba(255,255,255,0.18)" />
      <rect x="95" y="77" width="24" height="24" rx="4" fill="rgba(90,98,190,0.55)" />
      <rect x="100" y="82" width="14" height="14" rx="2.5" fill="url(#mg)" />

      <rect x="176" y="72" width="34" height="34" rx="6" fill="rgba(255,255,255,0.18)" />
      <rect x="181" y="77" width="24" height="24" rx="4" fill="rgba(90,98,190,0.55)" />
      <rect x="186" y="82" width="14" height="14" rx="2.5" fill="url(#mg)" />

      <rect x="90" y="154" width="34" height="34" rx="6" fill="rgba(255,255,255,0.18)" />
      <rect x="95" y="159" width="24" height="24" rx="4" fill="rgba(90,98,190,0.55)" />
      <rect x="100" y="164" width="14" height="14" rx="2.5" fill="url(#mg)" />

      {[
        [134,74],[146,74],[134,86],[146,86],
        [134,154],[146,154],[134,166],
        [90,130],[102,130],[114,130],[90,142],[114,142],
        [176,130],[188,130],[176,142],[188,142],[188,154],
        [176,166],[188,166],
      ].map(([cx,cy], i) => (
        <rect key={i} x={cx} y={cy} width="8" height="8" rx="2"
          fill={`rgba(255,255,255,${0.35 + (i % 4) * 0.08})`}
        />
      ))}

      <g clipPath="url(#cc)">
        <motion.g
          animate={{ translateY: [0, 140, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.8 }}
        >
          <rect x="78" y="56" width="144" height="14" fill="url(#sg)" />
          <line x1="78" y1="56" x2="222" y2="56"
            stroke={B.coralSoft} strokeWidth="1.5"
            strokeDasharray="5 6" opacity="0.75"
          />
        </motion.g>
      </g>

      <motion.path
        d="M150 152 C150 152 131 138 131 125 C131 117.5 136.5 113 142 115 C145.2 116.2 147.8 119 150 122 C152.2 119 154.8 116.2 158 115 C163.5 113 169 117.5 169 125 C169 138 150 152 150 152Z"
        fill={B.coral}
        animate={{ scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '150px 135px' }}
      />

      <motion.g
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="218" y="46" width="68" height="30" rx="15" fill="rgba(240,55,88,0.16)" stroke="rgba(240,55,88,0.38)" strokeWidth="1" />
        <circle cx="235" cy="61" r="9" fill="rgba(240,55,88,0.22)" />
        <line x1="235" y1="57" x2="235" y2="65" stroke="rgba(240,55,88,1)" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="231" y1="61" x2="239" y2="61" stroke="rgba(240,55,88,1)" strokeWidth="1.8" strokeLinecap="round" />
        <text x="248" y="66" fill="rgba(255,255,255,0.85)" fontSize="9.5" fontWeight="700" fontFamily="Roboto,sans-serif">SOS</text>
        <line x1="219" y1="66" x2="212" y2="80" stroke="rgba(255,255,255,0.14)" strokeWidth="1" strokeDasharray="3 4" />
      </motion.g>

      <motion.g
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      >
        <rect x="8" y="110" width="58" height="30" rx="15" fill="rgba(245,158,11,0.16)" stroke="rgba(245,158,11,0.38)" strokeWidth="1" />
        <circle cx="25" cy="125" r="9" fill="rgba(245,158,11,0.22)" />
        <path d="M21 121 L21 129 L28 129 L28 124 L25 121 Z" fill="none" stroke="rgba(245,158,11,1)" strokeWidth="1.4" strokeLinejoin="round" />
        <circle cx="25" cy="122" r="1" fill="rgba(245,158,11,1)" />
        <text x="37" y="130" fill="rgba(255,255,255,0.82)" fontSize="8.5" fontWeight="700" fontFamily="Roboto,sans-serif">TAG</text>
        <line x1="66" y1="123" x2="75" y2="130" stroke="rgba(255,255,255,0.14)" strokeWidth="1" strokeDasharray="3 4" />
      </motion.g>

      <motion.g
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      >
        <rect x="210" y="194" width="72" height="30" rx="15" fill="rgba(150,160,230,0.16)" stroke="rgba(150,160,230,0.38)" strokeWidth="1" />
        <circle cx="227" cy="209" r="9" fill="rgba(150,160,230,0.22)" />
        <circle cx="224" cy="206" r="2.2" fill="rgba(180,190,240,0.95)" />
        <circle cx="230" cy="207" r="2.7" fill="rgba(180,190,240,0.95)" />
        <path d="M220 213 Q224 210 228 213" fill="none" stroke="rgba(180,190,240,0.95)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M226 213 Q230 210 234 213" fill="none" stroke="rgba(180,190,240,0.95)" strokeWidth="1.2" strokeLinecap="round" />
        <text x="240" y="214" fill="rgba(255,255,255,0.82)" fontSize="8.5" fontWeight="700" fontFamily="Roboto,sans-serif">KIDS</text>
        <line x1="211" y1="202" x2="204" y2="192" stroke="rgba(255,255,255,0.14)" strokeWidth="1" strokeDasharray="3 4" />
      </motion.g>
    </svg>
  )
}

// ─── Animated background orbs ─────────────────────────────────────────────
function HeroOrbs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute -top-28 -left-28 w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 65%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 -right-20 w-[460px] h-[460px] rounded-full"
        style={{ background: `radial-gradient(circle, hsl(350 82% 60% / 0.22) 0%, transparent 65%)` }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute top-1/2 left-[38%] w-64 h-64 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%)' }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 3.5 }}
      />
      <div
        className="absolute inset-0 opacity-[0.028]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}

// ─── Magnetic button wrapper ───────────────────────────────────────────────
function MagneticWrapper({ children }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 20 })
  const sy = useSpring(y, { stiffness: 220, damping: 20 })

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      className="w-full"
      onMouseMove={(e) => {
        if (!ref.current) return
        const r = ref.current.getBoundingClientRect()
        x.set((e.clientX - (r.left + r.width / 2)) * 0.13)
        y.set((e.clientY - (r.top + r.height / 2)) * 0.13)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
    >
      {children}
    </motion.div>
  )
}

// ─── Desktop OTP panel (collapsible) ─────────────────────────────────────
function OTPPanel({ t, onVerified }) {
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const { sendOTP, verifyOTP } = useAuth()

  const handleSend = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Enter a valid 10-digit phone number')
      return
    }
    setIsSending(true)
    try {
      await sendOTP(phone)
      setOtpSent(true)
      toast.success(`OTP sent to +91 ${phone}`)
    } catch (err) {
      toast.error(err?.message || 'Failed to send OTP. Try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      toast.error('Enter the 6-digit OTP')
      return
    }
    setIsVerifying(true)
    try {
      await verifyOTP(otp)
      toast.success('Welcome to WeSafe QR')
      onVerified()
    } catch (err) {
      toast.error(err?.code === 'auth/invalid-verification-code' ? 'Invalid OTP. Please try again.' : (err?.message || 'Verification failed.'))
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = () => {
    setOtpSent(false)
    setOtp('')
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center justify-center gap-1.5 py-1 group"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
          {open ? 'expand_less' : 'phone_iphone'}
        </span>
        <span className="font-medium group-hover:underline underline-offset-2">
          {open ? 'Hide phone option' : `${t('auth.login_otp')} →`}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-1 space-y-3">
              <AnimatePresence mode="wait">
                {!otpSent ? (
                  <motion.div
                    key="phone-step"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-3"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="phone-desk" className="text-sm font-medium">
                        {t('auth.phone_number')}
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex items-center justify-center w-16 h-11 rounded-xl border border-input bg-muted text-muted-foreground text-sm font-bold flex-shrink-0">
                          +91
                        </div>
                        <Input
                          id="phone-desk"
                          type="tel"
                          inputMode="numeric"
                          placeholder="10-digit number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="flex-1 h-11 rounded-xl"
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleSend}
                      disabled={isSending}
                      variant="outline"
                      className="w-full h-11 gap-2 rounded-xl font-semibold press-scale border-border/80 hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-300"
                    >
                      {isSending ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sms</span>
                      )}
                      {isSending ? 'Sending…' : t('auth.send_otp')}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="otp-step"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-3"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="otp-desk" className="text-sm font-medium">
                        Enter OTP sent to +91 {phone}
                      </Label>
                      <Input
                        id="otp-desk"
                        type="tel"
                        inputMode="numeric"
                        placeholder="6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="h-11 rounded-xl text-center text-lg tracking-[0.35em] font-bold"
                        maxLength={6}
                        autoFocus
                      />
                    </div>
                    <Button
                      onClick={handleVerify}
                      disabled={isVerifying}
                      className="w-full h-11 gap-2 rounded-xl font-semibold press-scale"
                    >
                      {isVerifying ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span>
                      )}
                      {isVerifying ? 'Verifying…' : 'Verify OTP'}
                    </Button>
                    <button
                      type="button"
                      onClick={handleResend}
                      className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-center"
                    >
                      Didn't receive it? Resend OTP
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Stats for desktop panel ──────────────────────────────────────────────
const STATS = [
  { v: '12.4K+', l: 'Families' },
  { v: '98.7%',  l: 'Uptime' },
  { v: '4.9★',   l: 'Rating' },
]

// ─── Main LoginPage ────────────────────────────────────────────────────────
export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { signInWithGoogle } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const destination = location.state?.from?.pathname || '/'

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      toast.success('Welcome to WeSafe QR')
      navigate(destination, { replace: true })
    } catch (err) {
      toast.error('Sign in failed. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneVerified = () => {
    navigate(destination, { replace: true })
  }

  // ── Shared Google button ────────────────────────────────────────────────
  const GoogleButton = (
    <MagneticWrapper>
      <Button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        size="lg"
        className="w-full h-[52px] text-[15px] gap-3 font-bold rounded-2xl press-scale relative overflow-hidden group"
        style={{
          boxShadow: `0 6px 24px hsl(237 46% 62% / 0.35), inset 0 1px 0 rgba(255,255,255,0.2)`,
        }}
      >
        <span
          className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent)' }}
        />
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="spin"
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.75 }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
            />
          ) : (
            <motion.svg
              key="g"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-5 h-5 relative flex-shrink-0"
              viewBox="0 0 24 24"
            >
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </motion.svg>
          )}
        </AnimatePresence>
        <span className="relative">{t('auth.sign_in_google')}</span>
      </Button>
    </MagneticWrapper>
  )

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row overflow-hidden">
      {/* Required by Firebase invisible reCAPTCHA for phone auth */}
      <div id="recaptcha-container" />

      {/* ══════════════════════════════════════════════════════════
          MOBILE LAYOUT — clean centered single column
          ══════════════════════════════════════════════════════════ */}
      <div className="md:hidden min-h-[100dvh] flex flex-col bg-background">

        {/* Language picker — top-right */}
        <div className="flex justify-end px-5 pt-5">
          <LanguagePicker align="right" />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 pt-4">

          {/* Logo + brand */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-center gap-3 mb-6"
          >
            {/* Logo mark with pulse halo */}
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 0 0px hsl(237 46% 62% / 0)`,
                  `0 0 0 10px hsl(237 46% 62% / 0.10)`,
                  `0 0 0 0px hsl(237 46% 62% / 0)`,
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-full"
            >
              <div
                className="w-[88px] h-[88px] rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: `linear-gradient(140deg, ${B.primary35} 0%, ${B.primary52} 60%, hsl(350 55% 48%) 100%)`,
                  boxShadow: `0 8px 28px hsl(237 46% 62% / 0.30)`,
                }}
              >
                <img
                  src="/logo1.png"
                  alt="WeSafe QR logo"
                  className="w-14 h-14 object-contain"
                />
              </div>
            </motion.div>

            {/* Brand name + tagline */}
            <div className="text-center">
              <h1 className="text-[26px] font-bold text-foreground tracking-tight leading-none">
                WeSafe QR
              </h1>
              <p className="text-muted-foreground text-[14px] mt-1 font-medium">
                {t('auth.tagline_short')}
              </p>
            </div>
          </motion.div>

          {/* Value prop */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.5 }}
            className="text-[15px] text-foreground/70 text-center font-medium leading-snug mb-8"
            style={{ textWrap: 'balance' }}
          >
            {t('auth.value_prop')}
          </motion.p>

          {/* Auth form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-[360px] space-y-4"
          >
            {/* Google button */}
            <div className="space-y-2">
              {GoogleButton}
              <p className="text-center text-[12px] text-muted-foreground font-medium">
                {t('auth.fastest_safe')}
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-muted-foreground text-[13px] font-semibold">{t('auth.or_use_phone')}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Phone input — visible by default on mobile */}
            <MobilePhoneSection t={t} onVerified={handlePhoneVerified} />
          </motion.div>
        </div>

        {/* Terms — pinned to bottom */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-[11px] text-muted-foreground text-center leading-relaxed pb-8 px-8"
        >
          {t('auth.agree_text')}{' '}
          <a href="/legal/terms" className="text-primary hover:opacity-75 transition-opacity font-semibold underline underline-offset-2">
            {t('auth.terms')}
          </a>
          {' '}{t('auth.and')}{' '}
          <a href="/legal/privacy" className="text-primary hover:opacity-75 transition-opacity font-semibold underline underline-offset-2">
            {t('auth.privacy_policy')}
          </a>.
        </motion.p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          DESKTOP: Hero panel (left 56%)
          ══════════════════════════════════════════════════════════ */}
      <div
        className="hidden md:block relative md:flex-[0_0_56%] overflow-hidden"
        style={{
          background: `linear-gradient(148deg, ${B.primary35} 0%, ${B.primary52} 60%, hsl(350 55% 48%) 100%)`,
          minHeight: '100dvh',
        }}
      >
        <HeroOrbs />

        <div className="relative z-10 flex flex-col h-full px-12 py-12">

          {/* Brand mark */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center gap-3"
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0 0px rgba(255,255,255,0)',
                  '0 0 0 10px rgba(255,255,255,0.1)',
                  '0 0 0 0px rgba(255,255,255,0)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-[15px] overflow-hidden"
            >
              <img src="/logo1.png" alt="WeSafe QR" className="w-11 h-11 object-cover rounded-[15px]" />
            </motion.div>
            <div>
              <p className="text-white font-bold text-base leading-none tracking-tight">WeSafe QR</p>
              <p className="text-white/55 text-[11px] mt-0.5 font-semibold tracking-widest uppercase">
                Safety Reimagined
              </p>
            </div>
          </motion.div>

          {/* Illustration + Headline */}
          <div className="flex-1 flex flex-col justify-center items-center gap-5 py-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
            >
              <h1 className="text-[clamp(2rem,3.6vw,3.1rem)] font-bold text-white leading-[1.06] tracking-tight text-center">
                Protect what<br />
                <span style={{ color: B.coralSoft }}>matters most.</span>
              </h1>
              <p className="text-white/55 text-[15px] mt-3.5 leading-relaxed max-w-[32ch] text-center">
                Smart QR codes that carry emergency info, child profiles, and lost-item tags — one scan away.
              </p>
            </motion.div>

            <div className="relative mx-auto">
              <div className="absolute inset-0 -m-10 pointer-events-none">
                <div className="absolute inset-0 rounded-full border border-white/[0.07]" />
                <div className="absolute inset-4 rounded-full border border-white/[0.05]" />
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35, duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
                className="w-full max-w-[310px] relative"
                style={{ aspectRatio: '300/280' }}
              >
                <HeroIllustration />
              </motion.div>
            </div>
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="flex items-center justify-center gap-10 pt-5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
          >
            {STATS.map((s, i) => (
              <div key={i}>
                <p className="text-white font-bold text-lg leading-none tabular-nums">{s.v}</p>
                <p className="text-white/40 text-xs mt-0.5 font-medium">{s.l}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          DESKTOP: Auth panel (right 44%)
          ══════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-1 items-center justify-center px-10 py-12 bg-background relative overflow-hidden">

        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 85% 55% at 55% -5%, hsl(237 46% 62% / 0.09) 0%, transparent 65%)' }}
          />
          <div
            className="absolute -bottom-28 -right-28 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(350 82% 60% / 0.07) 0%, transparent 65%)' }}
          />
          <div
            className="absolute inset-0 opacity-[0.022]"
            style={{
              backgroundImage: `radial-gradient(${B.primary} 1.2px, transparent 1.2px)`,
              backgroundSize: '22px 22px',
            }}
          />
        </div>

        <div className="absolute top-5 right-6 z-20">
          <LanguagePicker align="right" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.18, duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-[400px] relative z-10 space-y-5"
        >
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.5 }}
            className="flex items-center gap-2.5"
          >
            <img
              src="/logo1.png"
              alt="WeSafe QR"
              className="w-9 h-9 rounded-[11px] object-cover"
              style={{ boxShadow: '0 2px 12px hsl(237 46% 62% / 0.28)' }}
            />
            <div className="leading-none">
              <span className="text-sm font-bold text-foreground">WeSafe QR</span>
              <span className="text-muted-foreground text-sm"> · Account access</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-3xl border border-border/60 bg-card px-8 py-7 space-y-6"
            style={{
              boxShadow:
                '0 4px 32px hsl(237 46% 62% / 0.07), 0 1px 2px hsl(237 40% 12% / 0.04), inset 0 1px 0 rgba(255,255,255,0.7)',
            }}
          >
            <div>
              <h2 className="text-[26px] font-bold text-foreground tracking-tight leading-tight">
                Welcome back
              </h2>
              <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
                Sign in to access your safety profiles and QR codes
              </p>
            </div>

            {GoogleButton}

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            <OTPPanel t={t} onVerified={handlePhoneVerified} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.72, duration: 0.5 }}
            className="flex items-center justify-between px-1"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2.5">
                {[
                  { bg: 'hsl(237 46% 62%)', opacity: '55' },
                  { bg: 'hsl(350 82% 60%)', opacity: '55' },
                  { bg: 'hsl(160 76% 38%)', opacity: '55' },
                  { bg: 'hsl(38 88% 50%)',  opacity: '55' },
                ].map((c, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-card flex-shrink-0"
                    style={{ background: c.bg + c.opacity }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground font-bold">12,400+</span> families protected
              </p>
            </div>

            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'hsl(160 76% 38% / 0.08)',
                color: 'hsl(160 76% 32%)',
                border: '1px solid hsl(160 76% 38% / 0.18)',
              }}
            >
              <span className="material-symbols-outlined filled" style={{ fontSize: '13px' }}>lock</span>
              Encrypted
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="text-[11px] text-muted-foreground text-center leading-relaxed"
          >
            {t('auth.agree_text')}{' '}
            <a href="/legal/terms" className="text-primary hover:opacity-75 transition-opacity font-semibold">{t('auth.terms')}</a>
            {' '}{t('auth.and')}{' '}
            <a href="/legal/privacy" className="text-primary hover:opacity-75 transition-opacity font-semibold">{t('auth.privacy_policy')}</a>.
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}

// ─── Mobile phone section — always visible, no collapse ──────────────────
function MobilePhoneSection({ t, onVerified }) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const { sendOTP, verifyOTP } = useAuth()

  const handleSend = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Enter a valid 10-digit phone number')
      return
    }
    setIsSending(true)
    try {
      await sendOTP(phone)
      setOtpSent(true)
      toast.success(`OTP sent to +91 ${phone}`)
    } catch (err) {
      toast.error(err?.message || 'Failed to send OTP. Try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      toast.error('Enter the 6-digit OTP')
      return
    }
    setIsVerifying(true)
    try {
      await verifyOTP(otp)
      toast.success('Welcome to WeSafe QR')
      onVerified()
    } catch (err) {
      toast.error(err?.code === 'auth/invalid-verification-code' ? 'Invalid OTP. Please try again.' : (err?.message || 'Verification failed.'))
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = () => {
    setOtpSent(false)
    setOtp('')
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {!otpSent ? (
          <motion.div
            key="phone-step-mobile"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.22 }}
            className="space-y-3"
          >
            <div className="flex gap-2">
              <div
                className="flex items-center justify-center w-16 h-12 rounded-xl border text-sm font-bold flex-shrink-0"
                style={{
                  borderColor: 'hsl(var(--border))',
                  background: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                +91
              </div>
              <Input
                id="phone-mobile"
                type="tel"
                inputMode="numeric"
                placeholder={t('auth.phone_placeholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 h-12 rounded-xl text-[15px]"
                maxLength={10}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={isSending}
              variant="outline"
              className="w-full h-12 gap-2 rounded-xl font-semibold text-[15px] border-border/80 hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-300 active:scale-[0.98]"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : null}
              {isSending ? 'Sending…' : t('auth.get_otp')}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="otp-step-mobile"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <p className="text-[13px] text-muted-foreground font-medium">
                OTP sent to <span className="text-foreground font-semibold">+91 {phone}</span>
              </p>
              <Input
                id="otp-mobile"
                type="tel"
                inputMode="numeric"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-12 rounded-xl text-center text-xl tracking-[0.4em] font-bold"
                maxLength={6}
                autoFocus
              />
            </div>
            <Button
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full h-12 gap-2 rounded-xl font-semibold text-[15px] active:scale-[0.98]"
            >
              {isVerifying ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              {isVerifying ? 'Verifying…' : 'Verify OTP'}
            </Button>
            <button
              type="button"
              onClick={handleResend}
              className="w-full text-[13px] text-muted-foreground hover:text-primary transition-colors text-center"
            >
              Didn't receive it? Resend OTP
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
