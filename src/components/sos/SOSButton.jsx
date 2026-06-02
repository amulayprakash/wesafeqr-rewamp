import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { getEmergencyContacts } from '@/services/profileService'
import { sendSOSAlert } from '@/services/whatsappService'
import { createAlert } from '@/services/alertService'

async function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve({ lat: null, lng: null }); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      async () => {
        try {
          const r = await fetch('https://ipapi.co/json/')
          const d = await r.json()
          resolve({ lat: d.latitude ?? null, lng: d.longitude ?? null })
        } catch {
          resolve({ lat: null, lng: null })
        }
      },
      { timeout: 8000 }
    )
  })
}

function fmt(s) {
  return `0:${String(s).padStart(2, '0')}`
}

export function SOSButton() {
  const location = useLocation()
  const { user } = useAuth()
  const { activeProfile, activeProfileId } = useProfile()

  // phases: 'idle' | 'countdown' | 'sending' | 'sent' | 'error'
  const [phase, setPhase] = useState('idle')
  const [timeLeft, setTimeLeft] = useState(60)
  const [showDialog, setShowDialog] = useState(false)

  const isCountingDown = phase === 'countdown'

  // ── Countdown ticker ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'countdown') return
    const id = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  // ── Send when timer hits zero ─────────────────────────────────────────────
  const handleSOS = useCallback(async () => {
    setPhase('sending')
    setShowDialog(true)
    try {
      const [{ lat, lng }, contacts] = await Promise.all([
        getLocation(),
        getEmergencyContacts(user.uid, activeProfileId),
      ])
      const profileName = activeProfile?.name || 'User'

      if (!contacts?.length) {
        setPhase('error')
        setTimeout(() => { setPhase('idle'); setTimeLeft(60) }, 2500)
        return
      }

      await sendSOSAlert(contacts, profileName, lat, lng)
      await createAlert(user.uid, activeProfileId, {
        type: 'sos',
        title: 'SOS Alert Sent',
        description: `Emergency SOS triggered. ${contacts.length} contact${contacts.length !== 1 ? 's' : ''} notified.`,
        icon: 'emergency',
        metadata: { triggeredBy: 'user_sos', lat, lng },
      }).catch(() => {})

      setPhase('sent')
      setTimeout(() => { setPhase('idle'); setTimeLeft(60); setShowDialog(false) }, 3000)
    } catch {
      setPhase('error')
      setTimeout(() => { setPhase('idle'); setTimeLeft(60) }, 2500)
    }
  }, [user, activeProfileId, activeProfile])

  useEffect(() => {
    if (phase === 'countdown' && timeLeft === 0) handleSOS()
  }, [phase, timeLeft, handleSOS])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleTrigger = () => {
    setPhase('countdown')
    setTimeLeft(60)
    setShowDialog(true)
  }

  const handleCancel = () => {
    setPhase('idle')
    setTimeLeft(60)
    setShowDialog(false)
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  if (location.pathname.startsWith('/settings')) return null
  if (!user || !activeProfileId) return null

  // ── Derived ───────────────────────────────────────────────────────────────
  const showCancelBadge = isCountingDown && !showDialog

  return (
    <>
      {/* ── Floating button ──────────────────────────────────────────────── */}
      <div className="fixed z-40 right-4 bottom-[5.5rem] lg:bottom-8 lg:right-8 flex flex-col items-center gap-1.5">

        {/* Countdown badge — shown when modal is dismissed but timer still running */}
        <AnimatePresence>
          {showCancelBadge && (
            <motion.div
              key="sos-badge"
              initial={{ opacity: 0, y: 6, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              className="bg-gray-900 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg tabular-nums"
            >
              {fmt(timeLeft)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Button — SOS (idle) or Cancel (countdown active, modal closed) */}
        <button
          onClick={isCountingDown ? (showDialog ? undefined : handleCancel) : handleTrigger}
          aria-label={showCancelBadge ? 'Cancel SOS' : 'SOS Emergency Alert'}
          className={[
            'w-14 h-14 lg:w-16 lg:h-16 rounded-full flex flex-col items-center justify-center',
            'select-none focus:outline-none focus-visible:ring-4 active:scale-95 transition-all duration-300',
            showCancelBadge
              ? 'focus-visible:ring-gray-400'
              : 'focus-visible:ring-red-400',
          ].join(' ')}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {/* Pulse ring — only on idle SOS */}
          {!isCountingDown && (
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40 pointer-events-none" />
          )}

          {/* Face */}
          <span
            className={[
              'relative flex flex-col items-center justify-center w-full h-full rounded-full transition-colors duration-300',
              showCancelBadge
                ? 'bg-gray-900 shadow-[0_4px_20px_rgba(0,0,0,0.45)]'
                : 'bg-red-600 shadow-[0_4px_20px_rgba(220,38,38,0.55)]',
            ].join(' ')}
          >
            {showCancelBadge ? (
              /* X icon when in cancel mode */
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"/>
              </svg>
            ) : (
              /* Bell SVG for SOS */
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 0 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
            )}
            <span className="text-white text-[9px] font-black tracking-[0.18em] leading-none mt-0.5">
              {showCancelBadge ? 'CANCEL' : 'SOS'}
            </span>
          </span>
        </button>
      </div>

      {/* ── Dialog ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showDialog && (
          <>
            {/* Backdrop — clicking hides modal but keeps countdown alive */}
            <motion.div
              key="sos-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                if (phase === 'countdown') setShowDialog(false)
              }}
            />

            {/* Dialog wrapper — flex handles centering */}
            <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 lg:items-center lg:px-0 lg:pb-0 pointer-events-none">
              <motion.div
                key="sos-dialog"
                initial={{ opacity: 0, scale: 0.88, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: 16 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                className="w-full max-w-[22rem] rounded-[20px] bg-card border border-border shadow-2xl overflow-hidden pointer-events-auto"
              >
                {/* ── Sent ── */}
                {phase === 'sent' && (
                  <div className="flex flex-col items-center gap-3 p-7 text-center">
                    <span
                      className="material-symbols-outlined text-green-500"
                      style={{ fontSize: '48px', fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <p className="text-base font-bold text-foreground">SOS Sent!</p>
                    <p className="text-sm text-muted-foreground">Contacts notified.</p>
                  </div>
                )}

                {/* ── Error ── */}
                {phase === 'error' && (
                  <div className="flex flex-col items-center gap-3 p-7 text-center">
                    <span
                      className="material-symbols-outlined text-amber-500"
                      style={{ fontSize: '48px', fontVariationSettings: "'FILL' 1" }}
                    >
                      warning
                    </span>
                    <p className="text-base font-bold text-foreground">Failed to Send</p>
                    <p className="text-sm text-muted-foreground">
                      No contacts found or network error. Call 112 directly.
                    </p>
                    <button
                      onClick={handleCancel}
                      className="mt-1 w-full py-3 rounded-xl bg-muted text-sm font-semibold text-foreground"
                    >
                      Close
                    </button>
                  </div>
                )}

                {/* ── Sending ── */}
                {phase === 'sending' && (
                  <div className="flex flex-col items-center gap-3 p-7 text-center">
                    <span className="w-10 h-10 border-[3px] border-red-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-base font-bold text-foreground">Sending SOS…</p>
                    <p className="text-sm text-muted-foreground">Alerting your emergency contacts.</p>
                  </div>
                )}

                {/* ── Countdown ── */}
                {phase === 'countdown' && (
                  <>
                    {/* Red header with live countdown */}
                    <div className="bg-red-600 px-6 py-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-7 h-7 shrink-0">
                          <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 0 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z"/>
                        </svg>
                        <div>
                          <p className="text-white font-black text-base tracking-wide leading-none">
                            SOS ALERT
                          </p>
                          <p className="text-red-100 text-xs mt-0.5">
                            Sending to all contacts
                          </p>
                        </div>
                      </div>
                      {/* Big countdown */}
                      <span className="text-white font-black text-3xl tabular-nums leading-none">
                        {fmt(timeLeft)}
                      </span>
                    </div>

                    <div className="px-6 py-5">
                      <p className="text-sm font-medium text-foreground leading-snug">
                        Alert sends to all emergency contacts in{' '}
                        <span className="font-black text-red-600">{timeLeft}s</span>.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Triggered by mistake? Cancel below.
                      </p>

                      <div className="mt-5 flex flex-col gap-2.5">
                        {/* Send Now */}
                        <button
                          onClick={handleSOS}
                          className="w-full py-3.5 rounded-xl bg-red-600 text-white font-black text-sm tracking-wide shadow-md active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                            <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 0 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z"/>
                          </svg>
                          SEND NOW
                        </button>

                        {/* Cancel SOS */}
                        <button
                          onClick={handleCancel}
                          className="w-full py-3 rounded-xl bg-muted text-sm font-semibold text-muted-foreground active:scale-[0.98] transition-transform"
                        >
                          CANCEL SOS
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
