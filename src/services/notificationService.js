import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import app from '@/config/firebase'
import { db } from '@/config/firebase'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

let _messaging = null

// ─── Init ─────────────────────────────────────────────────────────────────────

export function getFirebaseMessaging() {
  if (_messaging) return _messaging
  try {
    _messaging = getMessaging(app)
    return _messaging
  } catch {
    return null
  }
}

// ─── Service Worker ───────────────────────────────────────────────────────────

async function registerAndInitSW() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    // Send Firebase config to the SW so it can initialize FCM
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'wesafe-40d85',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }

    // Wait for SW to be ready then post config
    const sw = registration.installing ?? registration.waiting ?? registration.active
    if (sw) {
      sw.postMessage({ type: 'INIT_FCM', config })
    }

    return registration
  } catch (err) {
    console.warn('[FCM] SW registration failed:', err.message)
    return null
  }
}

// ─── Permission + Token ───────────────────────────────────────────────────────

export async function requestNotificationPermission(uid) {
  if (!VAPID_KEY) {
    console.info('[FCM] VITE_FIREBASE_VAPID_KEY not set — push notifications disabled')
    return null
  }
  if (!('Notification' in window)) return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const registration = await registerAndInitSW()
    const msg = getFirebaseMessaging()
    if (!msg) return null

    const token = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration ?? undefined,
    })

    if (token && uid) {
      await saveFCMToken(uid, token)
    }

    return token
  } catch (err) {
    console.warn('[FCM] Token request failed:', err.message)
    return null
  }
}

export async function saveFCMToken(uid, token) {
  // Use last 20 chars of token as a stable document ID for this device
  const tokenId = token.slice(-20)
  const ref = doc(db, 'Users', uid, 'fcm_tokens', tokenId)
  await setDoc(ref, { token, updatedAt: serverTimestamp() }, { merge: true })
}

// ─── Foreground Messages ──────────────────────────────────────────────────────

/**
 * Listen for messages while app is in the foreground.
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(callback) {
  const msg = getFirebaseMessaging()
  if (!msg) return () => {}
  return onMessage(msg, callback)
}
