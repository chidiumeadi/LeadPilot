import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { useAuth } from './AuthContext'
import * as notificationService from '../services/notificationService'

const POLL_INTERVAL_MS = 60_000

interface NotificationContextValue {
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.fetchUnreadCount()
      setUnreadCount(count)
    } catch {
      // A failed poll shouldn't disrupt the rest of the app — the badge
      // just keeps showing its last known value until the next tick.
    }
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') {
      setUnreadCount(0)
      return
    }

    refreshUnreadCount()
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [status, refreshUnreadCount])

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
