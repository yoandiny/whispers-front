import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuth } from './AuthContext'
import { registerServiceWorker } from '@/lib/push'

export interface AppNotification {
  id: string
  type: 'message' | 'admin' | string
  title: string
  body: string
  data: Record<string, any>
  read: boolean
  createdAt: string
}

interface NotificationContextValue {
  notifications: AppNotification[]
  unreadCount: number
  refresh: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

/** Polling interval (ms) when tab is active */
const POLL_ACTIVE_MS = 15_000
/** Polling interval (ms) when tab is hidden */
const POLL_HIDDEN_MS = 60_000

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  // Track which ids we've already seen so we only toast *new* ones
  const seenIds = useRef<Set<string> | null>(null)
  const intervalRef = useRef<number | null>(null)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([])
      return
    }
    try {
      const res = await api.get('/api/notifications')
      const list: AppNotification[] = res.data.data

      // First load: seed seen set, no toasts
      if (seenIds.current === null) {
        seenIds.current = new Set(list.map((n) => n.id))
        setNotifications(list)
        return
      }

      // Find unread notifications that we haven't seen before
      const fresh = list.filter((n) => !n.read && !seenIds.current!.has(n.id))

      for (const n of fresh) {
        const icon = n.type === 'admin' ? '📣' : '💬'
        toast(`${n.title}${n.body ? ` — ${n.body}` : ''}`, {
          icon,
          duration: 5000,
          id: `notif-${n.id}`, // prevent duplicates
        })
      }

      // Update seen set
      seenIds.current = new Set(list.map((n) => n.id))
      setNotifications(list)
    } catch {
      /* non-fatal: network or auth errors */
    }
  }, [isAuthenticated])

  /** Start / restart the polling interval */
  const startPolling = useCallback(() => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    const ms = document.hidden ? POLL_HIDDEN_MS : POLL_ACTIVE_MS
    intervalRef.current = window.setInterval(refresh, ms)
  }, [refresh])

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      seenIds.current = null
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Register SW early so it's ready when the user enables push
    registerServiceWorker()

    refresh()
    startPolling()

    // Refresh immediately when the tab regains focus
    const onFocus = () => { refresh(); startPolling() }
    // Adjust poll rate when tab visibility changes
    const onVisibility = () => startPolling()

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    }
  }, [isAuthenticated, refresh, startPolling])

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    await api.patch(`/api/notifications/${id}/read`).catch(() => {})
  }, [])

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await api.patch('/api/notifications/read-all').catch(() => {})
  }, [])

  /** Optimistic local delete (no backend route — just hides from list) */
  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    seenIds.current?.delete(id)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, refresh, markAsRead, markAllAsRead, deleteNotification }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications doit être utilisé dans un <NotificationProvider>')
  return ctx
}
