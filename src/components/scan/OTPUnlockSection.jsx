import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ERROR_MESSAGES = {
  'OTP not found':    'OTP not found. Please request a new one.',
  'OTP already used': 'This OTP has already been used. Please request a new one.',
  'OTP expired':      'OTP has expired. Please request a new one.',
  'Invalid OTP':      'Incorrect OTP. Please check with your emergency contact.',
  'no_contact':       'No emergency contact saved on this profile.',
  'no_phone':         'Emergency contact has no phone number saved.',
  'firestore_denied': 'Service temporarily unavailable. Please call the emergency contact directly.',
  'send_failed':      'Could not send OTP. Please call the emergency contact directly.',
}

function normalizeForWA(phone) {
  const d = String(phone).replace(/[\s\-\+\(\)]/g, '')
  return d.startsWith('91') && d.length > 10 ? d : '91' + d
}

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  )
}

export default function OTPUnlockSection({
  otpState,
  otpError,
  primaryContact,
  contacts,
  onRequestOTP,
  onVerifyOTP,
  onRetry,
}) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [secondsLeft, setSecondsLeft] = useState(600)
  const inputRefs = useRef([])

  // Countdown when OTP is sent
  useEffect(() => {
    if (otpState !== 'sent' && otpState !== 'sent_wa_failed') return
    setSecondsLeft(1800)
    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(id)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [otpState])

  // Reset digits when retrying
  useEffect(() => {
    if (otpState === 'idle') setDigits(['', '', '', ''])
  }, [otpState])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const allFilled = digits.every(d => d !== '')
  const isVerifying = otpState === 'verifying'

  function handleDigitChange(i, e) {
    const val = e.target.value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = val
    setDigits(next)
    if (val && i < 3) inputRefs.current[i + 1]?.focus()
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    const next = [...digits]
    text.split('').forEach((ch, idx) => { if (idx < 4) next[idx] = ch })
    setDigits(next)
    inputRefs.current[Math.min(text.length, 3)]?.focus()
  }

  const noContacts = !contacts || contacts.length === 0

  // ─── Idle — no contacts ───────────────────────────────────────────────────

  if (otpState === 'idle' && noContacts) {
    return (
      <div className="bg-card rounded-xl border border-border card-shadow p-5 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined filled text-amber-500 text-[22px]">warning</span>
        </div>
        <div>
          <p className="font-semibold text-foreground text-[15px]">No Emergency Contact</p>
          <p className="text-sm text-muted-foreground mt-1 leading-snug">
            No emergency contact is saved on this profile. Medical information cannot be unlocked.
          </p>
        </div>
      </div>
    )
  }

  // ─── Error state ──────────────────────────────────────────────────────────

  if (otpState === 'error') {
    const msg = ERROR_MESSAGES[otpError] || otpError || 'Something went wrong.'
    const canCall = primaryContact?.rawPhone
    const rawPhone = primaryContact?.rawPhone || ''
    const waHref = `https://wa.me/${normalizeForWA(rawPhone)}`
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-destructive/30 card-shadow p-5 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined filled text-destructive text-[20px]">error</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-[14px]">Unlock Failed</p>
            <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{msg}</p>
          </div>
        </div>
        {canCall && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">Call the emergency contact directly:</p>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${rawPhone}`}
                className="flex items-center justify-center gap-1.5 h-12 rounded-xl bg-destructive text-white font-semibold text-[13px] press-scale transition-all active:scale-95 no-underline"
              >
                <span className="material-symbols-outlined filled text-[18px]">call</span>
                Call
              </a>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 h-12 rounded-xl text-white font-semibold text-[13px] press-scale transition-all active:scale-95 no-underline"
                style={{ backgroundColor: '#25D366' }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        )}
        <button
          onClick={onRetry}
          className="w-full h-11 rounded-xl bg-muted text-foreground font-semibold text-[14px] press-scale transition-all active:scale-95"
        >
          Try Again
        </button>
      </motion.div>
    )
  }

  // ─── Sending state — OTP being generated and alert being sent ────────────

  if (otpState === 'sending') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border card-shadow overflow-hidden"
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/60 bg-primary/5">
          <Spinner />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Alerting Emergency Contact…
          </span>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-center space-y-1">
            <p className="font-semibold text-foreground text-[15px]">Setting up secure access</p>
            <p className="text-sm text-muted-foreground leading-snug max-w-xs mx-auto">
              Your emergency contact is being notified with your location and a one-time access code.
            </p>
          </div>

          {/* Disabled OTP boxes shown immediately */}
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="w-11 h-14 text-center rounded-xl border-2 border-border bg-muted/50 opacity-50"
              />
            ))}
          </div>

          <p className="text-[12px] text-muted-foreground text-center leading-snug">
            Once notified, ask your emergency contact for the <span className="font-semibold text-foreground">4-digit code</span> and enter it above to view medical records.
          </p>
        </div>
      </motion.div>
    )
  }

  // ─── Sent state — show contact buttons + OTP input ────────────────────────

  if (otpState === 'sent' || otpState === 'sent_wa_failed' || otpState === 'verifying') {
    const waFailed = otpState === 'sent_wa_failed'
    const rawPhone = primaryContact?.rawPhone || ''
    const waHref = `https://wa.me/${normalizeForWA(rawPhone)}`

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border card-shadow overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/60 bg-primary/5">
          <span className="material-symbols-outlined filled text-primary text-[18px]">lock_open</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {waFailed ? 'WhatsApp Unavailable' : 'OTP Sent'}
          </span>
        </div>
        {waFailed && (
          <div className="px-4 pt-3">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <span className="material-symbols-outlined filled text-amber-500 text-[16px] flex-shrink-0 mt-0.5">warning</span>
              <p className="text-xs text-amber-700 leading-snug">
                WhatsApp delivery failed. Call the contact to share the OTP — the code is still valid.
              </p>
            </div>
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* All contacts that received the OTP */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">OTP delivered to</p>
            {(contacts && contacts.length > 0 ? contacts : [primaryContact]).map((c, idx) => {
              const name = c?.name || c?.['Emergency Contact Name'] || (idx === 0 ? primaryContact?.name : null) || 'Emergency Contact'
              const phone = c?.phone || c?.['Emergency Contact Number'] || (idx === 0 ? primaryContact?.rawPhone : '')
              const masked = phone ? ('••••••' + String(phone).slice(-4)) : primaryContact?.maskedPhone
              const initial = name ? name.charAt(0).toUpperCase() : '?'
              return (
                <div key={idx} className="flex items-center gap-2.5 bg-muted/50 rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-bold text-sm text-primary">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{masked}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                    <span className="material-symbols-outlined filled text-[11px]">check_circle</span>
                    Sent
                  </span>
                </div>
              )
            })}
          </div>

          {/* Call + WhatsApp buttons */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`tel:${rawPhone}`}
              className="flex items-center justify-center gap-2 h-14 rounded-xl bg-destructive text-white font-semibold text-[14px] press-scale transition-all active:scale-95 no-underline"
            >
              <span className="material-symbols-outlined filled text-[20px]">call</span>
              Call Now
            </a>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-14 rounded-xl text-white font-semibold text-[14px] press-scale transition-all active:scale-95 no-underline"
              style={{ backgroundColor: '#25D366' }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          </div>

          {/* Instruction */}
          <p className="text-[13px] text-muted-foreground text-center leading-snug">
            Ask them for the <span className="font-semibold text-foreground">4-digit code</span> they received on WhatsApp and enter it below to view medical records
          </p>

          {/* OTP boxes */}
          <div className="flex items-center justify-center gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={d}
                disabled={isVerifying}
                className="w-11 h-14 text-center text-xl font-bold font-mono rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-card text-foreground transition-all outline-none disabled:opacity-50"
                onChange={e => handleDigitChange(i, e)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
              />
            ))}
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-muted-foreground">schedule</span>
            <span className={`text-sm font-mono font-semibold ${secondsLeft <= 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {mm}:{ss}
            </span>
            <span className="text-xs text-muted-foreground">remaining</span>
          </div>

          {/* Verify button */}
          <button
            disabled={!allFilled || isVerifying}
            onClick={() => onVerifyOTP(digits.join(''))}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-[14px] flex items-center justify-center gap-2 press-scale transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <Spinner />
                Verifying…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined filled text-[18px]">lock_open</span>
                Verify &amp; Unlock
              </>
            )}
          </button>
        </div>
      </motion.div>
    )
  }

  // ─── Idle — fallback (should rarely appear; auto-send starts on load) ─────

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border card-shadow overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/60 bg-muted/30">
        <span className="material-symbols-outlined filled text-muted-foreground text-[18px]">lock</span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Medical Information</span>
      </div>

      <div className="p-5 flex flex-col items-center text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined filled text-primary text-[28px]">lock</span>
        </div>

        <div className="space-y-1.5">
          <p className="font-bold text-foreground text-[16px]">Medical information is locked</p>
          <p className="text-sm text-muted-foreground leading-snug max-w-xs mx-auto">
            Contact the emergency contact on this profile — they will receive a 4-digit code via WhatsApp. Enter it below to view medical records.
          </p>
        </div>

        {/* OTP boxes — always visible */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-11 h-14 rounded-xl border-2 border-border bg-muted/40 opacity-50"
            />
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground">
          The code is valid for <span className="font-semibold text-foreground">30 minutes</span>
        </p>
      </div>
    </motion.div>
  )
}
