import { useState, useEffect, useContext, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { ProfileContext } from '@/contexts/ProfileContext'
import { checkLNFQRStatus, connectLNFQRToProfile } from '@/services/lnfQRService'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ─── Shared motion wrapper ────────────────────────────────────────────────────
function Screen({ children }) {
  return (
    <motion.div
      key={Math.random()}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center justify-center flex-1 p-6 text-center"
    >
      {children}
    </motion.div>
  )
}

// ─── Checking / Saving screens ────────────────────────────────────────────────
function CheckingScreen() {
  return (
    <Screen>
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-muted-foreground text-sm">Verifying QR code…</p>
    </Screen>
  )
}

function SavingScreen() {
  return (
    <Screen>
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-muted-foreground text-sm">Saving your registration…</p>
    </Screen>
  )
}

// ─── Already consumed screen ──────────────────────────────────────────────────
function AlreadyConsumedScreen({ isOwn, onDone }) {
  return (
    <Screen>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-5"
        style={{ background: 'hsl(0 84% 60% / 0.12)' }}
      >
        <span className="material-symbols-outlined filled text-5xl" style={{ color: 'hsl(0 84% 60%)' }}>
          lock
        </span>
      </motion.div>

      <h2 className="text-2xl font-bold tracking-tight mb-2">Already Registered</h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">
        {isOwn
          ? 'This QR code is already registered to your account.'
          : 'This QR code has already been registered to another WeSafe account. Contact support if you think this is a mistake.'}
      </p>

      <Button
        onClick={onDone}
        variant={isOwn ? 'default' : 'outline'}
        className="w-full max-w-xs h-12 rounded-xl font-semibold"
        style={isOwn ? { boxShadow: '0 4px 14px hsl(var(--primary) / 0.3)' } : undefined}
      >
        Close
      </Button>
    </Screen>
  )
}

// ─── Error screen ─────────────────────────────────────────────────────────────
function ErrorScreen({ message, onRetry, onDone }) {
  return (
    <Screen>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-5"
        style={{ background: 'hsl(0 84% 60% / 0.12)' }}
      >
        <span className="material-symbols-outlined filled text-5xl" style={{ color: 'hsl(0 84% 60%)' }}>
          error
        </span>
      </motion.div>

      <h2 className="text-2xl font-bold tracking-tight mb-2">Something Went Wrong</h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">{message || 'An unexpected error occurred.'}</p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={onRetry}
          className="w-full h-12 rounded-xl font-semibold press-scale"
          style={{ boxShadow: '0 4px 14px hsl(var(--primary) / 0.3)' }}
        >
          Try Again
        </Button>
        <Button onClick={onDone} variant="outline" className="w-full h-12 rounded-xl font-semibold">
          Close
        </Button>
      </div>
    </Screen>
  )
}

// ─── Animated background orbs ─────────────────────────────────────────────────
function AuthOrbs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(237 46% 62% / 0.18) 0%, transparent 65%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(350 82% 60% / 0.12) 0%, transparent 65%)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
    </div>
  )
}

// ─── Auth screen (LNF-flavoured) ──────────────────────────────────────────────
function AuthScreen({ passcode, onSignIn, loading }) {
  const [showOtp, setShowOtp] = useState(false)
  const [phone, setPhone] = useState('')
  const [otpSending, setOtpSending] = useState(false)

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Enter a valid 10-digit phone number')
      return
    }
    setOtpSending(true)
    await new Promise(r => setTimeout(r, 600))
    setOtpSending(false)
    toast('OTP feature coming soon')
  }

  // Shared auth card — rendered in both mobile and desktop columns
  const authCard = (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      className="relative z-10 w-full"
    >
      <div
        className="rounded-3xl border border-border/60 bg-card px-6 py-6 space-y-5"
        style={{ boxShadow: '0 4px 32px hsl(237 46% 62% / 0.08), 0 1px 2px hsl(0 0% 0% / 0.04), inset 0 1px 0 rgba(255,255,255,0.7)' }}
      >
        <Button
          onClick={onSignIn}
          disabled={loading}
          className="w-full h-[50px] text-[15px] gap-3 font-bold rounded-2xl relative overflow-hidden group press-scale"
          style={{ boxShadow: '0 5px 20px hsl(237 46% 62% / 0.32), inset 0 1px 0 rgba(255,255,255,0.2)' }}
        >
          <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)' }}
          />
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
              />
            ) : (
              <motion.svg key="g" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-5 h-5 relative flex-shrink-0" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </motion.svg>
            )}
          </AnimatePresence>
          <span className="relative">Continue with Google</span>
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border/70" />
          <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-border/70" />
        </div>

        <button
          type="button"
          onClick={() => setShowOtp(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all duration-200 text-left"
          style={{
            borderColor: showOtp ? 'hsl(237 46% 62%)' : 'hsl(var(--border))',
            background: showOtp ? 'hsl(237 46% 62% / 0.05)' : 'transparent',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: showOtp ? 'hsl(237 46% 62% / 0.12)' : 'hsl(var(--muted))' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px', color: showOtp ? 'hsl(237 46% 52%)' : 'hsl(var(--muted-foreground))' }}>
                phone_iphone
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: showOtp ? 'hsl(237 46% 52%)' : 'hsl(var(--foreground))' }}>Login with OTP</p>
              <p className="text-xs text-muted-foreground">Use your phone number</p>
            </div>
          </div>
          <motion.span animate={{ rotate: showOtp ? 180 : 0 }} transition={{ duration: 0.25 }}
            className="material-symbols-outlined text-muted-foreground" style={{ fontSize: '18px' }}>
            expand_more
          </motion.span>
        </button>

        <AnimatePresence>
          {showOtp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-1">
                <div className="flex gap-2">
                  <div className="flex items-center justify-center w-[58px] h-12 rounded-xl border flex-shrink-0 text-sm font-bold"
                    style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                    +91
                  </div>
                  <Input
                    type="tel" inputMode="numeric" placeholder="10-digit number"
                    value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 h-12 rounded-xl text-[15px]" maxLength={10}
                  />
                </div>
                <Button
                  onClick={handleSendOtp} disabled={otpSending} variant="outline"
                  className="w-full h-12 gap-2 rounded-xl font-semibold text-[15px] border-border/80 press-scale"
                >
                  {otpSending ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><span className="material-symbols-outlined" style={{ fontSize: '17px' }}>sms</span>Send OTP</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
        className="flex flex-col items-center gap-3 pt-5"
      >
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: 'hsl(142 71% 45% / 0.08)', color: 'hsl(142 71% 32%)', border: '1px solid hsl(142 71% 45% / 0.18)' }}
        >
          <span className="material-symbols-outlined filled" style={{ fontSize: '13px' }}>lock</span>
          End-to-end encrypted · Your data is safe
        </div>
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          By continuing, you agree to WeSafe's{' '}
          <a href="/legal/terms" className="text-primary font-semibold underline underline-offset-2">Terms of Service</a>
          {' '}and{' '}
          <a href="/legal/privacy" className="text-primary font-semibold underline underline-offset-2">Privacy Policy</a>.
        </p>
      </motion.div>
    </motion.div>
  )

  return (
    <div className="relative flex flex-col min-h-full overflow-hidden bg-background">
      <AuthOrbs />

      {/* ── Mobile layout ── */}
      <div className="md:hidden flex flex-col">
        <div
          className="relative flex flex-col items-center pt-12 pb-10 px-6"
          style={{ background: 'linear-gradient(180deg, hsl(237 46% 62% / 0.07) 0%, transparent 100%)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center gap-2.5 mb-8"
          >
            <div
              className="w-10 h-10 rounded-[13px] flex items-center justify-center overflow-hidden"
              style={{
                background: 'linear-gradient(140deg, hsl(237 46% 35%) 0%, hsl(237 46% 52%) 60%, hsl(350 55% 48%) 100%)',
                boxShadow: '0 4px 16px hsl(237 46% 62% / 0.32)',
              }}
            >
              <img src="/logo1.png" alt="WeSafe" className="w-7 h-7 object-contain" />
            </div>
            <div className="leading-none">
              <p className="text-[15px] font-bold text-foreground tracking-tight">WeSafe LNF</p>
              <p className="text-[10px] font-semibold tracking-widest uppercase mt-0.5" style={{ color: 'hsl(237 46% 62%)' }}>Lost & Found</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="mb-6 relative flex items-center justify-center"
          >
            <motion.div className="absolute rounded-full"
              style={{ width: 110, height: 110, border: '2px solid hsl(237 46% 62% / 0.25)' }}
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 240, damping: 18 }}
              className="relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(237 46% 52%) 0%, hsl(237 46% 62%) 50%, hsl(350 55% 52%) 100%)',
                boxShadow: '0 8px 28px hsl(237 46% 62% / 0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <span className="material-symbols-outlined filled text-white" style={{ fontSize: '34px' }}>tag</span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="text-center"
          >
            <h2 className="text-[26px] font-bold tracking-tight text-foreground leading-tight mb-1.5">Activate Lost & Found QR</h2>
            <p className="text-muted-foreground text-[14px] mb-3 leading-snug">Sign in to register and protect your item</p>
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold"
              style={{ background: 'hsl(237 46% 62% / 0.12)', color: 'hsl(237 46% 52%)', border: '1px solid hsl(237 46% 62% / 0.2)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>tag</span>
              {passcode}
            </motion.span>
          </motion.div>
        </div>
        <div className="px-4 pb-8">{authCard}</div>
      </div>

      {/* ── Desktop layout (two columns) ── */}
      <div className="hidden md:flex flex-1 min-h-full">
        {/* Left: hero / branding */}
        <div
          className="flex-1 flex flex-col items-center justify-center px-14 py-16 relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, hsl(237 46% 62% / 0.10) 0%, hsl(350 55% 52% / 0.05) 100%)' }}
        >
          <motion.div className="absolute -top-24 -left-24 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, hsl(237 46% 62% / 0.14) 0%, transparent 65%)' }}
            animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, hsl(350 55% 52% / 0.10) 0%, transparent 65%)' }}
            animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center gap-3 mb-12 self-start"
          >
            <div className="w-11 h-11 rounded-[14px] flex items-center justify-center overflow-hidden"
              style={{
                background: 'linear-gradient(140deg, hsl(237 46% 35%) 0%, hsl(237 46% 52%) 60%, hsl(350 55% 48%) 100%)',
                boxShadow: '0 4px 16px hsl(237 46% 62% / 0.32)',
              }}>
              <img src="/logo1.png" alt="WeSafe" className="w-7 h-7 object-contain" />
            </div>
            <div className="leading-none">
              <p className="text-[16px] font-bold text-foreground tracking-tight">WeSafe LNF</p>
              <p className="text-[10px] font-semibold tracking-widest uppercase mt-0.5" style={{ color: 'hsl(237 46% 62%)' }}>Lost & Found</p>
            </div>
          </motion.div>

          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="mb-8 relative flex items-center justify-center"
          >
            <motion.div className="absolute rounded-full"
              style={{ width: 140, height: 140, border: '2px solid hsl(237 46% 62% / 0.22)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 240, damping: 18 }}
              className="relative w-[92px] h-[92px] rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(237 46% 52%) 0%, hsl(237 46% 62%) 50%, hsl(350 55% 52%) 100%)',
                boxShadow: '0 12px 36px hsl(237 46% 62% / 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <span className="material-symbols-outlined filled text-white" style={{ fontSize: '44px' }}>tag</span>
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="text-center max-w-sm"
          >
            <h2 className="text-[32px] font-bold tracking-tight text-foreground leading-tight mb-2">Activate Lost & Found QR</h2>
            <p className="text-muted-foreground text-[15px] mb-5 leading-snug">
              Sign in to register and protect your item — anyone who finds it can reach you instantly.
            </p>
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-mono font-bold"
              style={{ background: 'hsl(237 46% 62% / 0.12)', color: 'hsl(237 46% 52%)', border: '1px solid hsl(237 46% 62% / 0.2)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>tag</span>
              {passcode}
            </motion.span>
          </motion.div>

          {/* Feature bullets */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="mt-10 space-y-3 self-start w-full max-w-xs"
          >
            {[
              { icon: 'location_on', text: 'Finder sees your message instantly' },
              { icon: 'lock', text: 'End-to-end encrypted & private' },
              { icon: 'notifications', text: 'Get notified when scanned' },
            ].map((f) => (
              <div key={f.icon} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'hsl(237 46% 62% / 0.12)' }}>
                  <span className="material-symbols-outlined filled" style={{ fontSize: '16px', color: 'hsl(237 46% 52%)' }}>{f.icon}</span>
                </div>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: auth form */}
        <div className="w-[440px] flex-shrink-0 flex flex-col justify-center px-10 py-12 border-l border-border/50 bg-background/80">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">Sign in to continue</p>
          {authCard}
        </div>
      </div>
    </div>
  )
}

// ─── Profile picker screen ────────────────────────────────────────────────────
function ProfilePickScreen({ profiles, passcode, qrType, selected, onSelect, onContinue }) {
  const icon = qrType === 'cars' ? 'directions_car' : 'shopping_bag'
  const label = qrType === 'cars' ? 'Register Vehicle' : 'Register Item'

  return (
    <div className="flex flex-col flex-1 p-6">
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
          style={{ background: 'hsl(var(--primary) / 0.12)' }}
        >
          <span className="material-symbols-outlined filled text-4xl" style={{ color: 'hsl(var(--primary))' }}>
            person_pin
          </span>
        </motion.div>
        <h2 className="text-xl font-bold tracking-tight">Select Profile</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Select which profile to register this item under{' '}
          <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold"
            style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
            {passcode}
          </span>
        </p>
      </div>

      <div className={`flex-1 overflow-y-auto mb-4 ${profiles.length > 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3 content-start' : 'space-y-3'}`}>
        {profiles.map((profile) => {
          const isSelected = selected === profile.id
          const initials = (profile.name || profile.id).slice(0, 2).toUpperCase()
          return (
            <motion.button
              key={profile.id}
              onClick={() => onSelect(profile.id)}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-colors text-left"
              style={{
                borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                background: isSelected ? 'hsl(var(--primary) / 0.06)' : 'hsl(var(--card))',
              }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{profile.name || 'Profile'}</p>
                <p className="text-xs text-muted-foreground">{profile.relationship || 'Self'}</p>
              </div>
              {isSelected && (
                <span className="material-symbols-outlined filled text-xl" style={{ color: 'hsl(var(--primary))' }}>
                  check_circle
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      <Button
        onClick={onContinue}
        disabled={!selected}
        className="w-full h-12 rounded-xl font-semibold press-scale"
        style={{ boxShadow: selected ? '0 4px 14px hsl(var(--primary) / 0.3)' : undefined }}
      >
        <span className="material-symbols-outlined mr-2 text-lg">{icon}</span>
        {label}
      </Button>
    </div>
  )
}

// ─── Lost & Found item registration screen ────────────────────────────────────
const LOST_ITEM_TYPES = [
  { id: 'Handbag', label: 'Handbag', icon: 'shopping_bag' },
  { id: 'Luggage', label: 'Luggage', icon: 'luggage' },
  { id: 'Bag', label: 'Bag', icon: 'backpack' },
  { id: 'Other', label: 'Other', icon: 'more_horiz' },
]

const LOST_WORDS = [
  "Hey! You found my bag, please text me ASAP! 🙏",
  "Thank you for finding my item. Please contact me at your earliest convenience.",
  "This item is very important to me. Finder will be rewarded. Please reach out!",
  "Other",
]

function LostFoundForm({ onSubmit, saving }) {
  const [itemType, setItemType] = useState('')
  const [itemTypeName, setItemTypeName] = useState('')
  const [description, setDescription] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [wordFromOwner, setWordFromOwner] = useState('')
  const [customWord, setCustomWord] = useState('')

  const ACCENT = 'hsl(38 88% 50%)'
  const ACCENT_BG = 'hsl(38 88% 50% / 0.10)'
  const ACCENT_BORDER = 'hsl(38 88% 50% / 0.35)'

  const handleSubmit = () => {
    if (!itemType) return toast.error('Please select an item type')
    if (itemType === 'Other' && !itemTypeName.trim()) return toast.error('Please enter the item name')
    if (!ownerName.trim()) return toast.error('Please enter your name')
    if (!wordFromOwner) return toast.error('Please select a message for the finder')
    if (wordFromOwner === 'Other' && !customWord.trim()) return toast.error('Please enter your custom message')

    const payload = {
      type: 'lostAndFound',
      itemType,
      ...(itemType === 'Other' ? { itemTypeName: itemTypeName.trim() } : {}),
      description: description.trim(),
      ownerName: ownerName.trim(),
      wordFromOwner: wordFromOwner === 'Other' ? customWord.trim() : wordFromOwner,
    }
    onSubmit(payload)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero header */}
      <div
        className="relative flex flex-col items-center pt-10 pb-8 px-6 overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${ACCENT_BG} 0%, transparent 100%)` }}
      >
        <motion.div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, hsl(38 88% 50% / 0.15) 0%, transparent 65%)` }}
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 240, damping: 18 }}
          className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: `linear-gradient(135deg, hsl(38 88% 42%) 0%, ${ACCENT} 100%)`,
            boxShadow: `0 8px 28px hsl(38 88% 50% / 0.35), inset 0 1px 0 rgba(255,255,255,0.2)`,
          }}
        >
          <span className="material-symbols-outlined filled text-white" style={{ fontSize: '34px' }}>shopping_bag</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-1">Register Your Item</h2>
          <p className="text-muted-foreground text-sm">Tell us about your lost & found item</p>
        </motion.div>
      </div>

      {/* Form body */}
      <div className="px-5 pb-8 space-y-6">

        {/* Item type grid */}
        <div>
          <p className="text-sm font-semibold mb-3">Item Type</p>
          <div className="grid grid-cols-2 gap-3">
            {LOST_ITEM_TYPES.map((t) => {
              const active = itemType === t.id
              return (
                <motion.button
                  key={t.id}
                  onClick={() => setItemType(t.id)}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-colors"
                  style={{
                    borderColor: active ? ACCENT : 'hsl(var(--border))',
                    background: active ? ACCENT_BG : 'hsl(var(--card))',
                  }}
                >
                  <span
                    className="material-symbols-outlined filled text-2xl"
                    style={{ color: active ? ACCENT : 'hsl(var(--muted-foreground))' }}
                  >
                    {t.icon}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: active ? ACCENT : 'hsl(var(--foreground))' }}>
                    {t.label}
                  </span>
                </motion.button>
              )
            })}
          </div>

          <AnimatePresence>
            {itemType === 'Other' && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <Input
                  placeholder="Describe the item type…"
                  value={itemTypeName}
                  onChange={(e) => setItemTypeName(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Description */}
        <div>
          <p className="text-sm font-semibold mb-2">Description</p>
          <textarea
            rows={3}
            placeholder="e.g. Black leather handbag with gold clasp, brand XYZ…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 transition-all"
            style={{ focusRingColor: ACCENT }}
          />
        </div>

        {/* Owner name */}
        <div>
          <p className="text-sm font-semibold mb-2">Item Name</p>
          <Input
            placeholder="e.g. My Black Handbag, Travel Luggage…"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>

        {/* Word from owner */}
        <div>
          <p className="text-sm font-semibold mb-3">Message for the Finder</p>
          <div className="space-y-2">
            {LOST_WORDS.map((w) => {
              const active = wordFromOwner === w
              return (
                <motion.button
                  key={w}
                  onClick={() => setWordFromOwner(w)}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left px-4 py-3 rounded-xl border-2 transition-colors text-sm"
                  style={{
                    borderColor: active ? ACCENT : 'hsl(var(--border))',
                    background: active ? ACCENT_BG : 'hsl(var(--card))',
                    color: active ? ACCENT : 'hsl(var(--foreground))',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {w}
                </motion.button>
              )
            })}
          </div>

          <AnimatePresence>
            {wordFromOwner === 'Other' && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <textarea
                  rows={3}
                  placeholder="Write your custom message…"
                  value={customWord}
                  onChange={(e) => setCustomWord(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full h-12 rounded-xl font-semibold press-scale"
          style={{
            background: ACCENT,
            boxShadow: `0 4px 14px hsl(38 88% 50% / 0.35)`,
            color: '#fff',
            border: 'none',
          }}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><span className="material-symbols-outlined mr-2 text-lg">check_circle</span>Register Item</>
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── Cars / vehicle registration screen ──────────────────────────────────────
const CAR_VEHICLE_TYPES = [
  { id: 'Car', label: 'Car', icon: 'directions_car' },
  { id: 'Motorbike', label: 'Motorbike', icon: 'two_wheeler' },
  { id: 'Other', label: 'Other', icon: 'more_horiz' },
]

const CAR_WORDS = [
  "Hey! You found my vehicle, please contact me immediately! 🙏",
  "Thank you for reporting my vehicle. Please message me at the earliest.",
  "This is my registered vehicle. For emergencies, please call the contact number.",
  "Other",
]

function CarsForm({ onSubmit, saving }) {
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [wordFromOwner, setWordFromOwner] = useState('')
  const [customWord, setCustomWord] = useState('')

  const ACCENT = 'hsl(197 84% 44%)'
  const ACCENT_BG = 'hsl(197 84% 44% / 0.10)'
  const ACCENT_BORDER = 'hsl(197 84% 44% / 0.35)'

  const handleSubmit = () => {
    if (!vehicleType) return toast.error('Please select a vehicle type')
    if (!vehicleNumber.trim()) return toast.error('Please enter the vehicle number')
    if (!ownerName.trim()) return toast.error('Please enter your name')
    if (!wordFromOwner) return toast.error('Please select a message for the finder')
    if (wordFromOwner === 'Other' && !customWord.trim()) return toast.error('Please enter your custom message')

    const payload = {
      type: 'cars',
      vehicleType,
      vehicleNumber: vehicleNumber.trim(),
      ownerName: ownerName.trim(),
      wordFromOwner: wordFromOwner === 'Other' ? customWord.trim() : wordFromOwner,
    }
    onSubmit(payload)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero header */}
      <div
        className="relative flex flex-col items-center pt-10 pb-8 px-6 overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${ACCENT_BG} 0%, transparent 100%)` }}
      >
        <motion.div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, hsl(197 84% 44% / 0.15) 0%, transparent 65%)` }}
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 240, damping: 18 }}
          className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: `linear-gradient(135deg, hsl(197 84% 36%) 0%, ${ACCENT} 100%)`,
            boxShadow: `0 8px 28px hsl(197 84% 44% / 0.35), inset 0 1px 0 rgba(255,255,255,0.2)`,
          }}
        >
          <span className="material-symbols-outlined filled text-white" style={{ fontSize: '34px' }}>directions_car</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-1">Register Your Vehicle</h2>
          <p className="text-muted-foreground text-sm">Tell us about your vehicle</p>
        </motion.div>
      </div>

      {/* Form body */}
      <div className="px-5 pb-8 space-y-6">

        {/* Vehicle type row */}
        <div>
          <p className="text-sm font-semibold mb-3">Vehicle Type</p>
          <div className="flex gap-3">
            {CAR_VEHICLE_TYPES.map((t) => {
              const active = vehicleType === t.id
              return (
                <motion.button
                  key={t.id}
                  onClick={() => setVehicleType(t.id)}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-colors"
                  style={{
                    borderColor: active ? ACCENT : 'hsl(var(--border))',
                    background: active ? ACCENT_BG : 'hsl(var(--card))',
                  }}
                >
                  <span
                    className="material-symbols-outlined filled text-2xl"
                    style={{ color: active ? ACCENT : 'hsl(var(--muted-foreground))' }}
                  >
                    {t.icon}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: active ? ACCENT : 'hsl(var(--foreground))' }}>
                    {t.label}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Vehicle number */}
        <div>
          <p className="text-sm font-semibold mb-2">Vehicle Number</p>
          <Input
            placeholder="e.g. MH 12 AB 1234"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
            className="h-11 rounded-xl font-mono tracking-widest"
          />
        </div>

        {/* Owner name */}
        <div>
          <p className="text-sm font-semibold mb-2">Vehicle Name</p>
          <Input
            placeholder="e.g. My Honda City, Dad's Bike…"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>

        {/* Word from owner */}
        <div>
          <p className="text-sm font-semibold mb-3">Message for the Finder</p>
          <div className="space-y-2">
            {CAR_WORDS.map((w) => {
              const active = wordFromOwner === w
              return (
                <motion.button
                  key={w}
                  onClick={() => setWordFromOwner(w)}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left px-4 py-3 rounded-xl border-2 transition-colors text-sm"
                  style={{
                    borderColor: active ? ACCENT : 'hsl(var(--border))',
                    background: active ? ACCENT_BG : 'hsl(var(--card))',
                    color: active ? ACCENT : 'hsl(var(--foreground))',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {w}
                </motion.button>
              )
            })}
          </div>

          <AnimatePresence>
            {wordFromOwner === 'Other' && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <textarea
                  rows={3}
                  placeholder="Write your custom message…"
                  value={customWord}
                  onChange={(e) => setCustomWord(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full h-12 rounded-xl font-semibold press-scale"
          style={{
            background: ACCENT,
            boxShadow: `0 4px 14px hsl(197 84% 44% / 0.35)`,
            color: '#fff',
            border: 'none',
          }}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><span className="material-symbols-outlined mr-2 text-lg">check_circle</span>Register Vehicle</>
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ qrType, ownerName, onDone }) {
  const isVehicle = qrType === 'cars'
  return (
    <Screen>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
        className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-5"
        style={{ background: 'hsl(142 71% 45% / 0.12)' }}
      >
        <span className="material-symbols-outlined filled text-6xl" style={{ color: 'hsl(142 71% 45%)' }}>
          check_circle
        </span>
      </motion.div>

      <h2 className="text-2xl font-bold tracking-tight mb-1">
        {isVehicle ? 'Vehicle Registered!' : 'Item Registered!'}
      </h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">
        {ownerName ? `Registered under ${ownerName}. ` : ''}
        Your QR is now active — anyone who scans it will see your message.
      </p>

      <Button
        onClick={onDone}
        className="w-full max-w-xs h-12 rounded-xl font-semibold press-scale"
        style={{ boxShadow: '0 4px 14px hsl(var(--primary) / 0.3)' }}
      >
        <span className="material-symbols-outlined mr-2 text-lg">dashboard</span>
        Go to Dashboard
      </Button>
    </Screen>
  )
}

// ─── Main flow component ──────────────────────────────────────────────────────
export function LNFQRActivationFlow({ passcode, onDone }) {
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const { profiles, loadingProfiles } = useContext(ProfileContext)
  const navigate = useNavigate()

  const [flowState, setFlowState] = useState('CHECKING')
  const [lnfDoc, setLnfDoc] = useState(null)
  const [selectedProfileId, setSelectedProfileId] = useState(null)
  const [error, setError] = useState(null)
  const [signingIn, setSigningIn] = useState(false)
  const lastPayloadRef = useRef(null)

  const compoundUid = useCallback(
    (uid, childId) => uid + ' ' + childId.replace(/^child/, ''),
    []
  )

  const runCheck = useCallback(async () => {
    setFlowState('CHECKING')
    setError(null)
    try {
      const result = await checkLNFQRStatus(passcode)
      setLnfDoc(result)

      if (!result.exists) {
        setError('This QR code does not exist or is invalid.')
        setFlowState('ERROR')
        return
      }

      if (result.consumed) {
        const ownUids = user ? profiles.map((p) => compoundUid(user.uid, p.id)) : []
        const isOwn = ownUids.includes(result.storedUid)
        setLnfDoc((prev) => ({ ...prev, isOwnAccount: isOwn }))
        setFlowState('ALREADY_CONSUMED')
        return
      }

      if (!user) { setFlowState('AUTH_REQUIRED'); return }
      if (profiles.length === 0) { setFlowState('ONBOARDING'); return }
      setFlowState('PROFILE_PICK')
    } catch (e) {
      setError(e.message)
      setFlowState('ERROR')
    }
  }, [passcode, user, profiles, compoundUid])

  // Run check once auth + profiles are resolved
  useEffect(() => {
    if (!authLoading && !loadingProfiles) {
      runCheck()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, loadingProfiles])

  // Forward to next state after sign-in
  useEffect(() => {
    if (flowState === 'AUTH_REQUIRED' && user && !authLoading && !loadingProfiles) {
      setFlowState(profiles.length === 0 ? 'ONBOARDING' : 'PROFILE_PICK')
    }
  }, [user, authLoading, loadingProfiles, flowState, profiles.length])

  const handleSignIn = async () => {
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch {
      toast.error('Sign in failed. Please try again.')
    } finally {
      setSigningIn(false)
    }
  }

  const handleProfileContinue = useCallback(() => {
    if (selectedProfileId) setFlowState('ITEM_REGISTRATION')
  }, [selectedProfileId])

  const handleOnboardingComplete = useCallback((childId) => {
    setSelectedProfileId(childId)
    setFlowState('ITEM_REGISTRATION')
  }, [])

  const handleRegister = useCallback(async (payload) => {
    if (!selectedProfileId || !user) return
    lastPayloadRef.current = payload
    setFlowState('SAVING')
    try {
      await connectLNFQRToProfile(user.uid, selectedProfileId, passcode, payload)
      setFlowState('SUCCESS')
    } catch (e) {
      setError(e.message)
      setFlowState('ERROR')
    }
  }, [selectedProfileId, user, passcode])

  const canDismiss = ['ALREADY_CONSUMED', 'SUCCESS', 'ERROR'].includes(flowState)
  const resolvedQrType = lnfDoc?.qrType ?? 'lostAndFound'

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col lg:items-center lg:justify-center bg-background lg:bg-black/30 lg:backdrop-blur-sm"
      role="dialog" aria-modal="true"
    >
      {/* Desktop decorative background */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(237 46% 62% / 0.05) 0%, hsl(350 82% 60% / 0.03) 100%)' }}>
        <motion.div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(237 46% 62% / 0.14) 0%, transparent 65%)' }}
          animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 9, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(350 82% 60% / 0.09) 0%, transparent 65%)' }}
          animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 12, repeat: Infinity, delay: 3 }}
        />
      </div>

      {/* Inner panel — full-screen on mobile, centered card on desktop */}
      <div className="relative w-full h-full flex flex-col lg:h-auto lg:max-h-[88vh] lg:w-full lg:max-w-lg lg:rounded-3xl lg:overflow-hidden bg-background"
        style={{ boxShadow: '0 24px 64px hsl(237 46% 20% / 0.16), 0 0 0 1px hsl(var(--border) / 0.5)' }}>

      {/* Header bar — hidden during AUTH_REQUIRED (it has its own branding) */}
      {flowState !== 'AUTH_REQUIRED' && (
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center overflow-hidden"
              style={{ background: 'linear-gradient(140deg, hsl(237 46% 35%) 0%, hsl(237 46% 52%) 60%, hsl(350 55% 48%) 100%)' }}
            >
              <img src="/logo1.png" alt="WeSafe" className="w-5.5 h-5.5 object-contain" />
            </div>
            <span className="font-bold text-sm text-foreground">WeSafe LNF</span>
          </div>
          {canDismiss && (
            <button
              onClick={onDone}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-xl text-muted-foreground">close</span>
            </button>
          )}
        </div>
      )}

      {/* Close button on auth screen — absolute top-right */}
      {flowState === 'AUTH_REQUIRED' && canDismiss && (
        <button
          onClick={onDone}
          className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-xl text-muted-foreground">close</span>
        </button>
      )}

      <div className="flex-1 overflow-y-auto flex flex-col">
        <AnimatePresence mode="wait">
          {flowState === 'CHECKING' && <CheckingScreen key="checking" />}

          {flowState === 'ALREADY_CONSUMED' && (
            <AlreadyConsumedScreen key="consumed" isOwn={lnfDoc?.isOwnAccount} onDone={onDone} />
          )}

          {flowState === 'AUTH_REQUIRED' && (
            <AuthScreen key="auth" passcode={passcode} onSignIn={handleSignIn} loading={signingIn} />
          )}

          {flowState === 'ONBOARDING' && (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1"
            >
              <OnboardingPage onComplete={handleOnboardingComplete} />
            </motion.div>
          )}

          {flowState === 'PROFILE_PICK' && (
            <ProfilePickScreen
              key="profile-pick"
              profiles={profiles}
              passcode={passcode}
              qrType={resolvedQrType}
              selected={selectedProfileId}
              onSelect={setSelectedProfileId}
              onContinue={handleProfileContinue}
            />
          )}

          {flowState === 'ITEM_REGISTRATION' && (
            <motion.div
              key="item-reg"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 flex flex-col"
            >
              {resolvedQrType === 'cars' ? (
                <CarsForm onSubmit={handleRegister} saving={false} />
              ) : (
                <LostFoundForm onSubmit={handleRegister} saving={false} />
              )}
            </motion.div>
          )}

          {flowState === 'SAVING' && <SavingScreen key="saving" />}

          {flowState === 'SUCCESS' && (
            <SuccessScreen
              key="success"
              qrType={resolvedQrType}
              ownerName={lastPayloadRef.current?.ownerName || ''}
              onDone={() => { onDone(); navigate('/', { replace: true }) }}
            />
          )}

          {flowState === 'ERROR' && (
            <ErrorScreen key="error" message={error} onRetry={runCheck} onDone={onDone} />
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  )
}

export function LNFQRActivationPortal({ passcode, onDone }) {
  return createPortal(
    <LNFQRActivationFlow passcode={passcode} onDone={onDone} />,
    document.body
  )
}
