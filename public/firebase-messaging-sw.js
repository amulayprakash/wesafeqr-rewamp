// WeSafe QR — Firebase Cloud Messaging Service Worker
// Handles background push notifications when the app is not in focus.
//
// Setup required:
//   1. Add VITE_FIREBASE_VAPID_KEY to your .env file (from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates)
//   2. This SW receives the Firebase config from the app via postMessage — no hardcoding needed.

importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js')

let messaging = null

// Receive Firebase config from the main app thread
self.addEventListener('message', (event) => {
  if (event.data?.type === 'INIT_FCM' && !firebase.apps.length) {
    try {
      firebase.initializeApp(event.data.config)
      messaging = firebase.messaging()

      messaging.onBackgroundMessage((payload) => {
        const title = payload.notification?.title ?? 'WeSafe QR'
        const body  = payload.notification?.body  ?? 'You have a new notification.'

        self.registration.showNotification(title, {
          body,
          icon:  '/logo1.png',
          badge: '/logo1.png',
          tag:   payload.data?.type ?? 'wesafe-notification',
          data:  payload.data ?? {},
        })
      })
    } catch (err) {
      console.error('[FCM SW] Init failed:', err)
    }
  }
})

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((c) => c.url.includes(self.location.origin))
        if (existing) {
          existing.focus()
          existing.navigate(url)
        } else {
          clients.openWindow(url)
        }
      })
  )
})
