import { Bell, CheckCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import EmptyState from '../components/dashboard/EmptyState'
import Pagination from '../components/Pagination'
import { useNotifications } from '../context/NotificationContext'
import * as notificationService from '../services/notificationService'
import type { Notification } from '../types/notification'
import type { PaginationMeta } from '../types/lead'
import { getApiErrorMessage } from '../utils/apiError'
import { formatRelativeTime } from '../utils/formatRelativeTime'

const DEFAULT_LIMIT = 20

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { refreshUnreadCount } = useNotifications()
  const [searchParams, setSearchParams] = useSearchParams()

  const rawPage = Number(searchParams.get('page') ?? '1')
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 0 })
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [isMarkingAll, setIsMarkingAll] = useState(false)

  const loadNotifications = async () => {
    setLoadState('loading')
    try {
      const result = await notificationService.fetchNotifications({ page, limit: DEFAULT_LIMIT })
      setNotifications(result.items)
      setPagination(result.pagination)
      setLoadState('ready')
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, 'Could not load notifications.'))
      setLoadState('error')
    }
  }

  useEffect(() => {
    loadNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handlePageChange = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next, { replace: true })
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.readAt) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n)),
      )
      try {
        await notificationService.markNotificationRead(notification.id)
        await refreshUnreadCount()
      } catch {
        // A failed mark-read shouldn't block navigation — the badge/list
        // will reconcile on the next load or poll tick.
      }
    }
    if (notification.leadId) {
      navigate(`/leads/${notification.leadId}`)
    }
  }

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true)
    try {
      await notificationService.markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
      await refreshUnreadCount()
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, 'Could not mark notifications as read.'))
    } finally {
      setIsMarkingAll(false)
    }
  }

  const hasUnread = notifications.some((n) => !n.readAt)
  const isEmpty = loadState === 'ready' && notifications.length === 0

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
        {hasUnread && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="mt-6">
        {loadState === 'loading' && <p className="py-12 text-center text-sm text-gray-400">Loading notifications…</p>}

        {loadState === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center">
            <p className="text-sm text-red-700">{errorMessage}</p>
            <button type="button" onClick={loadNotifications} className="mt-3 text-sm font-medium text-red-700 underline">
              Try again
            </button>
          </div>
        )}

        {isEmpty && (
          <EmptyState
            title="No notifications yet"
            description="We'll let you know here when a follow-up is due."
            icon={Bell}
          />
        )}

        {loadState === 'ready' && notifications.length > 0 && (
          <>
            <ul className="space-y-2">
              {notifications.map((notification) => {
                const isUnread = !notification.readAt
                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                        isUnread
                          ? 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          {isUnread && (
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-900"
                              aria-hidden="true"
                            />
                          )}
                          <div>
                            <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <p className="mt-0.5 text-sm text-gray-500">{notification.message}</p>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs whitespace-nowrap text-gray-400">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>

            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </div>
    </div>
  )
}
