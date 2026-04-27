import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { requestNotificationPermission, onForegroundMessage } from '@/services/notificationService'
import { createAlert } from '@/services/alertService'
import toast from 'react-hot-toast'

/**
 * Handles push notification permission, FCM token registration,
 * and foreground message display. Mount once in AppShell.
 */
export function useNotifications() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Request permission after a short delay (avoid blocking first render)
  useEffect(() => {
    if (!user?.uid) return
    const timer = setTimeout(() => {
      requestNotificationPermission(user.uid)
    }, 4000)
    return () => clearTimeout(timer)
  }, [user?.uid])

  // Foreground message listener — show toast + save to Firestore
  useEffect(() => {
    if (!user?.uid) return

    const unsubscribe = onForegroundMessage(async (payload) => {
      const title = payload.notification?.title ?? 'New notification'
      const body  = payload.notification?.body  ?? ''
      const data  = payload.data ?? {}

      // Show in-app toast
      toast(body ? `${title}: ${body}` : title, { icon: '🔔', duration: 5000 })

      // Persist to Firestore so it shows in AlertsPage
      // childId must be present in the FCM data payload to know which child profile to attach to
      if (data.childId) {
        await createAlert(user.uid, data.childId, {
          type:        data.type  ?? 'system',
          title,
          description: body,
          icon:        data.icon  ?? 'notifications',
          metadata:    data,
        })
      }

      // Refresh alerts list
      queryClient.invalidateQueries({ queryKey: ['alerts', user.uid] })
      queryClient.invalidateQueries({ queryKey: ['alerts-unread', user.uid] })
    })

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [user?.uid, queryClient])
}
