import { useState, useEffect, useContext, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { ProfileContext } from '@/contexts/ProfileContext'
import { checkQRStatus, connectQRToProfile } from '@/services/qrService'
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

// ─── Checking screen ──────────────────────────────────────────────────────────
function CheckingScreen() {
  return (
    <Screen>
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-muted-foreground text-sm">Verifying QR code…</p>
    </Screen>
  )
}

// ─── Animated background orbs for auth screen ────────────────────────────────
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
      <motion.div
        className="absolute top-1/3 right-8 w-48 h-48 rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(237 46% 62% / 0.08) 0%, transparent 65%)' }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
    </div>
  )
}

// ─── QR scan animation icon ───────────────────────────────────────────────────
function AnimatedQRIcon() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse rings */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 110, height: 110, border: '2px solid hsl(237 46% 62% / 0.25)' }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{ width: 90, height: 90, border: '2px solid hsl(237 46% 62% / 0.2)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
      />
      {/* Icon container */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 240, damping: 18 }}
        className="relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, hsl(237 46% 52%) 0%, hsl(237 46% 62%) 50%, hsl(350 55% 52%) 100%)',
          boxShadow: '0 8px 28px hsl(237 46% 62% / 0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        {/* Scan line animation */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <motion.div
            className="absolute left-2 right-2 h-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.55)' }}
            animate={{ top: ['20%', '80%', '20%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <span className="material-symbols-outlined filled text-white" style={{ fontSize: '34px' }}>
          qr_code_2
        </span>
      </motion.div>
    </div>
  )
}

// ─── Auth required screen ─────────────────────────────────────────────────────
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

  return (
    <div className="relative flex flex-col min-h-full overflow-hidden bg-background">
      <AuthOrbs />

      {/* Hero section */}
      <div
        className="relative flex flex-col items-center pt-12 pb-10 px-6"
        style={{
          background: 'linear-gradient(180deg, hsl(237 46% 62% / 0.07) 0%, transparent 100%)',
        }}
      >
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="flex items-center gap-2.5 mb-8"
        >
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0 0px hsl(237 46% 62% / 0)',
                '0 0 0 8px hsl(237 46% 62% / 0.12)',
                '0 0 0 0px hsl(237 46% 62% / 0)',
              ],
            }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-[13px]"
          >
            <div
              className="w-10 h-10 rounded-[13px] flex items-center justify-center overflow-hidden"
              style={{
                background: 'linear-gradient(140deg, hsl(237 46% 35%) 0%, hsl(237 46% 52%) 60%, hsl(350 55% 48%) 100%)',
                boxShadow: '0 4px 16px hsl(237 46% 62% / 0.32)',
              }}
            >
              <img src="/logo1.png" alt="WeSafe QR" className="w-7 h-7 object-contain" />
            </div>
          </motion.div>
          <div className="leading-none">
            <p className="text-[15px] font-bold text-foreground tracking-tight">WeSafe QR</p>
            <p
              className="text-[10px] font-semibold tracking-widest uppercase mt-0.5"
              style={{ color: 'hsl(237 46% 62%)' }}
            >
              Safety Reimagined
            </p>
          </div>
        </motion.div>

        {/* Animated QR icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="mb-6"
        >
          <AnimatedQRIcon />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="text-center"
        >
          <h2 className="text-[26px] font-bold tracking-tight text-foreground leading-tight mb-1.5">
            Activate Your QR
          </h2>
          <p className="text-muted-foreground text-[14px] mb-3 leading-snug">
            Sign in to link and protect your QR code
          </p>
          <motion.span
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold"
            style={{
              background: 'hsl(237 46% 62% / 0.12)',
              color: 'hsl(237 46% 52%)',
              border: '1px solid hsl(237 46% 62% / 0.2)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>qr_code_2</span>
            {passcode}
          </motion.span>
        </motion.div>
      </div>

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 mx-4 mb-6"
      >
        <div
          className="rounded-3xl border border-border/60 bg-card px-6 py-6 space-y-5"
          style={{
            boxShadow: '0 4px 32px hsl(237 46% 62% / 0.08), 0 1px 2px hsl(0 0% 0% / 0.04), inset 0 1px 0 rgba(255,255,255,0.7)',
          }}
        >
          {/* Google button */}
          <Button
            onClick={onSignIn}
            disabled={loading}
            className="w-full h-[50px] text-[15px] gap-3 font-bold rounded-2xl relative overflow-hidden group press-scale"
            style={{
              boxShadow: '0 5px 20px hsl(237 46% 62% / 0.32), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <span
              className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)' }}
            />
            <AnimatePresence mode="wait">
              {loading ? (
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
            <span className="relative">Continue with Google</span>
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border/70" />
            <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border/70" />
          </div>

          {/* OTP toggle button */}
          <button
            type="button"
            onClick={() => setShowOtp(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all duration-200 text-left group"
            style={{
              borderColor: showOtp ? 'hsl(237 46% 62%)' : 'hsl(var(--border))',
              background: showOtp ? 'hsl(237 46% 62% / 0.05)' : 'transparent',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: showOtp ? 'hsl(237 46% 62% / 0.12)' : 'hsl(var(--muted))',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '17px', color: showOtp ? 'hsl(237 46% 52%)' : 'hsl(var(--muted-foreground))' }}
                >
                  phone_iphone
                </span>
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: showOtp ? 'hsl(237 46% 52%)' : 'hsl(var(--foreground))' }}
                >
                  Login with OTP
                </p>
                <p className="text-xs text-muted-foreground">Use your phone number</p>
              </div>
            </div>
            <motion.span
              animate={{ rotate: showOtp ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="material-symbols-outlined text-muted-foreground"
              style={{ fontSize: '18px' }}
            >
              expand_more
            </motion.span>
          </button>

          {/* OTP panel */}
          <AnimatePresence>
            {showOtp && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-1">
                  <div className="flex gap-2">
                    <div
                      className="flex items-center justify-center w-[58px] h-12 rounded-xl border flex-shrink-0 text-sm font-bold"
                      style={{
                        borderColor: 'hsl(var(--border))',
                        background: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))',
                      }}
                    >
                      +91
                    </div>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="flex-1 h-12 rounded-xl text-[15px]"
                      maxLength={10}
                    />
                  </div>
                  <Button
                    onClick={handleSendOtp}
                    disabled={otpSending}
                    variant="outline"
                    className="w-full h-12 gap-2 rounded-xl font-semibold text-[15px] border-border/80 hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-300 press-scale"
                  >
                    {otpSending ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>sms</span>
                        Send OTP
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Security badge + terms */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="relative z-10 flex flex-col items-center gap-3 px-6 pb-8"
      >
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: 'hsl(142 71% 45% / 0.08)',
            color: 'hsl(142 71% 32%)',
            border: '1px solid hsl(142 71% 45% / 0.18)',
          }}
        >
          <span className="material-symbols-outlined filled" style={{ fontSize: '13px' }}>lock</span>
          End-to-end encrypted · Your data is safe
        </div>
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          By continuing, you agree to WeSafe's{' '}
          <a href="/legal/terms" className="text-primary font-semibold underline underline-offset-2 hover:opacity-75">Terms of Service</a>
          {' '}and{' '}
          <a href="/legal/privacy" className="text-primary font-semibold underline underline-offset-2 hover:opacity-75">Privacy Policy</a>.
        </p>
      </motion.div>
    </div>
  )
}

// ─── Already used screen ──────────────────────────────────────────────────────
function AlreadyUsedScreen({ isOwn, onDone, onViewQR }) {
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

      <h2 className="text-2xl font-bold tracking-tight mb-2">QR Already Registered</h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">
        {isOwn
          ? 'This QR code is already linked to your account.'
          : 'This QR code has already been registered to another WeSafe account. Contact support if you think this is a mistake.'}
      </p>

      {isOwn ? (
        <Button
          onClick={onViewQR}
          className="w-full max-w-xs h-12 rounded-xl font-semibold press-scale"
          style={{ boxShadow: '0 4px 14px hsl(var(--primary) / 0.3)' }}
        >
          <span className="material-symbols-outlined mr-2 text-lg">qr_code_2</span>
          View My QR Codes
        </Button>
      ) : (
        <Button
          onClick={onDone}
          variant="outline"
          className="w-full max-w-xs h-12 rounded-xl font-semibold"
        >
          Close
        </Button>
      )}
    </Screen>
  )
}

// ─── Profile picker screen ────────────────────────────────────────────────────
function ProfilePickScreen({ profiles, passcode, selected, onSelect, onConnect, connecting }) {
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
        <h2 className="text-xl font-bold tracking-tight">Connect QR to Profile</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Select which profile to link to{' '}
          <span
            className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold"
            style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
          >
            {passcode}
          </span>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
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
        onClick={onConnect}
        disabled={!selected || connecting}
        className="w-full h-12 rounded-xl font-semibold press-scale"
        style={{ boxShadow: selected ? '0 4px 14px hsl(var(--primary) / 0.3)' : undefined }}
      >
        {connecting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span className="material-symbols-outlined mr-2 text-lg">link</span>
            Connect QR
          </>
        )}
      </Button>
    </div>
  )
}

// ─── Connecting screen ────────────────────────────────────────────────────────
function ConnectingScreen() {
  return (
    <Screen>
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-muted-foreground text-sm">Connecting your QR code…</p>
    </Screen>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ profileName, onDone, onViewQR }) {
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

      <h2 className="text-2xl font-bold tracking-tight mb-1">QR Code Connected!</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Successfully linked to <strong>{profileName}</strong>.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={onDone}
          className="w-full h-12 rounded-xl font-semibold press-scale"
          style={{ boxShadow: '0 4px 14px hsl(var(--primary) / 0.3)' }}
        >
          <span className="material-symbols-outlined mr-2 text-lg">dashboard</span>
          Go to Dashboard
        </Button>
        <Button
          onClick={onViewQR}
          variant="outline"
          className="w-full h-12 rounded-xl font-semibold"
        >
          <span className="material-symbols-outlined mr-2 text-lg">qr_code_2</span>
          View My QR Codes
        </Button>
      </div>
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

// ─── Main flow component ──────────────────────────────────────────────────────
export function QRActivationFlow({ passcode, onDone }) {
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const { profiles, loadingProfiles } = useContext(ProfileContext)
  const navigate = useNavigate()

  const [flowState, setFlowState] = useState('CHECKING')
  const [qrDoc, setQrDoc] = useState(null)
  const [selectedProfileId, setSelectedProfileId] = useState(null)
  const [error, setError] = useState(null)
  const [signingIn, setSigningIn] = useState(false)

  // Build compound uid for comparison: "{uid} {subId}"
  const compoundUid = useCallback(
    (uid, childId) => uid + ' ' + childId.replace(/^child/, ''),
    []
  )

  // ── Initial check ────────────────────────────────────────────────────────────
  const runCheck = useCallback(async () => {
    setFlowState('CHECKING')
    setError(null)
    try {
      const result = await checkQRStatus(passcode)
      setQrDoc(result)

      if (!result.exists) {
        setError('This QR code does not exist or is invalid.')
        setFlowState('ERROR')
        return
      }

      if (result.consumed) {
        // Compare against current user's compound uid for all profiles
        const ownUids = user
          ? profiles.map((p) => compoundUid(user.uid, p.id))
          : []
        const isOwn = ownUids.includes(result.storedUid)
        setQrDoc((prev) => ({ ...prev, isOwnAccount: isOwn }))
        setFlowState('ALREADY_USED')
        return
      }

      if (!user) {
        setFlowState('AUTH_REQUIRED')
        return
      }

      if (profiles.length === 0) {
        setFlowState('ONBOARDING')
        return
      }

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

  // Transition forward after sign-in
  useEffect(() => {
    if (flowState === 'AUTH_REQUIRED' && user && !authLoading && !loadingProfiles) {
      if (profiles.length === 0) {
        setFlowState('ONBOARDING')
      } else {
        setFlowState('PROFILE_PICK')
      }
    }
  }, [user, authLoading, loadingProfiles, flowState, profiles.length])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    setSigningIn(true)
    try {
      await signInWithGoogle()
      // useEffect above will transition the state
    } catch (e) {
      toast.error('Sign in failed. Please try again.')
    } finally {
      setSigningIn(false)
    }
  }

  const handleConnect = useCallback(async (profileId) => {
    const pid = profileId || selectedProfileId
    if (!pid || !user) return

    setFlowState('CONNECTING')
    try {
      await connectQRToProfile(user.uid, pid, passcode)
      setSelectedProfileId(pid)
      setFlowState('SUCCESS')
    } catch (e) {
      setError(e.message)
      setFlowState('ERROR')
    }
  }, [selectedProfileId, user, profiles, passcode])

  const handleOnboardingComplete = useCallback((childId) => {
    setSelectedProfileId(childId)
    handleConnect(childId)
  }, [handleConnect])

  const canDismiss = ['ALREADY_USED', 'SUCCESS', 'ERROR'].includes(flowState)
  const successProfile = profiles.find((p) => p.id === selectedProfileId)

  return (
    <div
      className="fixed inset-0 z-[9999] bg-background flex flex-col relative"
      role="dialog"
      aria-modal="true"
    >
      {/* Header bar — only shown outside the auth screen (which has its own branding) */}
      {flowState !== 'AUTH_REQUIRED' && (
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center overflow-hidden"
              style={{
                background: 'linear-gradient(140deg, hsl(237 46% 35%) 0%, hsl(237 46% 52%) 60%, hsl(350 55% 48%) 100%)',
              }}
            >
              <img src="/logo1.png" alt="WeSafe QR" className="w-5.5 h-5.5 object-contain" />
            </div>
            <span className="font-bold text-sm text-foreground">WeSafe QR</span>
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

      {/* State content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <AnimatePresence mode="wait">
          {flowState === 'CHECKING' && <CheckingScreen key="checking" />}

          {flowState === 'ALREADY_USED' && (
            <AlreadyUsedScreen
              key="already-used"
              isOwn={qrDoc?.isOwnAccount}
              onDone={onDone}
              onViewQR={() => { onDone(); navigate('/qr-codes') }}
            />
          )}

          {flowState === 'AUTH_REQUIRED' && (
            <AuthScreen
              key="auth"
              passcode={passcode}
              onSignIn={handleSignIn}
              loading={signingIn}
            />
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
              selected={selectedProfileId}
              onSelect={setSelectedProfileId}
              onConnect={() => handleConnect()}
              connecting={false}
            />
          )}

          {flowState === 'CONNECTING' && <ConnectingScreen key="connecting" />}

          {flowState === 'SUCCESS' && (
            <SuccessScreen
              key="success"
              profileName={successProfile?.name || 'your profile'}
              onDone={() => { onDone(); navigate('/', { replace: true }) }}
              onViewQR={() => { onDone(); navigate('/qr-codes', { replace: true }) }}
            />
          )}

          {flowState === 'ERROR' && (
            <ErrorScreen
              key="error"
              message={error}
              onRetry={runCheck}
              onDone={onDone}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Portal wrapper (used by QRInterceptor in App.jsx) ───────────────────────
export function QRActivationPortal({ passcode, onDone }) {
  return createPortal(
    <QRActivationFlow passcode={passcode} onDone={onDone} />,
    document.body
  )
}
