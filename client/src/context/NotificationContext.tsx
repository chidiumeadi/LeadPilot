import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { useAuth } from './AuthContext'
import * as notificationService from '../services/notificationService'

const POLL_INTERVAL_MS = 60_000

interface NotificationContextValue {
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

// True only when the browser both supports the Notification API and the
// user has actually granted permission — Settings' "Browser notifications"
// toggle can be ON while permission is still default/denied, and this must
// never fire a popup the browser didn't actually agree to.
function canShowBrowserNotification(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  // Tracks the last count we saw so a browser notification only fires on
  // a genuine increase, not on every 60s poll.
  const previousCountRef = useRef(0)

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.fetchUnreadCount()
      setUnreadCount(count)

      if (count > previousCountRef.current && user?.browserNotificationsEnabled && canShowBrowserNotification()) {
        try {
          const { items } = await notificationService.fetchNotifications({ unread: true, limit: 1 })
          const latest = items[0]
          if (latest) {
            new Notification(latest.title, { body: latest.message })
          }
        } catch {
          // A failed fetch of the notification's own content shouldn't
          // block the count update above — the badge is still correct.
        }
      }

      previousCountRef.current = count
    } catch {
      // A failed poll shouldn't disrupt the rest of the app — the badge
      // just keeps showing its last known value until the next tick.
    }
  }, [user])

  useEffect(() => {
    // "In-app notifications" is a display-side preference only (see
    // schema.prisma's User comment) — turning it off stops this ambient
    // badge/poll, but /notifications itself still fetches independently,
    // and the Phase 6 scheduler keeps creating reminders regardless.
    if (status !== 'authenticated' || user?.inAppNotificationsEnabled === false) {
      setUnreadCount(0)
      return
    }

    refreshUnreadCount()
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [status, user?.inAppNotificationsEnabled, refreshUnreadCount])

  const value = useMemo(() => ({ unreadCount, refreshUnreadCount }), [unreadCount, refreshUnreadCount])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
