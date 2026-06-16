import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Megaphone,
  MessageCircle,
  Trash2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useNotifications, type AppNotification } from '@/context/NotificationContext'
import { enablePush, isPushSupported, pushPermission } from '@/lib/push'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RED = '#C0392B'
const BROWN = '#2C1A13'
const MUTED = '#8A6B5E'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `il y a ${hrs} h`
  const days = Math.floor(hrs / 24)
  return `il y a ${days} j`
}

function NotifIcon({ type, read }: { type: string; read: boolean }) {
  const color = read ? MUTED : RED
  if (type === 'admin') return <Megaphone size={15} style={{ color }} />
  if (type === 'message') return <MessageCircle size={15} style={{ color }} />
  return read ? <Check size={15} style={{ color }} /> : <BellRing size={15} style={{ color }} />
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications()
  const [open, setOpen] = useState(false)
  const [enabling, setEnabling] = useState(false)
  const [permission, setPermission] = useState(pushPermission())
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close panel on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  async function handleEnablePush() {
    setEnabling(true)
    const res = await enablePush()
    setEnabling(false)
    setPermission(pushPermission())
    if (res.ok) {
      toast.success('Notifications push activées 🔔')
    } else if (res.reason === 'denied') {
      toast.error('Permission refusée dans le navigateur')
    } else if (res.reason === 'no-vapid') {
      toast.error('Push non configuré côté serveur (VAPID manquant)')
    } else if (res.reason === 'unsupported') {
      toast.error('Ce navigateur ne supporte pas les notifications push')
    } else {
      toast.error("Impossible d'activer les notifications push")
    }
  }

  function handleClickNotification(n: AppNotification) {
    markAsRead(n.id)
    setOpen(false)
    const url = n.data?.url
    if (url) navigate(url)
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    deleteNotification(id)
  }

  const showEnablePush = isPushSupported() && permission !== 'granted'

  return (
    <div style={{ position: 'relative', isolation: 'isolate' }} ref={panelRef}>
      {/* Bell button */}
      <button
        id="notif-bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="btn-explosive"
        style={{
          position: 'relative',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          background: open ? 'rgba(192, 57, 43, 0.12)' : '#FFF8F5',
          border: `1px solid ${open ? 'rgba(192, 57, 43, 0.3)' : 'rgba(44, 26, 19, 0.08)'}`,
          color: RED,
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        title="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing size={18} style={{ animation: 'bell-ring 0.6s ease', color: RED }} />
        ) : (
          <Bell size={18} style={{ color: RED }} />
        )}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              fontSize: '9px',
              minWidth: '16px',
              height: '16px',
              paddingLeft: '3px',
              paddingRight: '3px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)',
              color: '#FFF8F5',
              fontWeight: 700,
              boxShadow: '0 0 0 2px #FFF8F5',
              lineHeight: 1,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="animate-fade-up card-explosive"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '320px',
            maxWidth: '90vw',
            borderRadius: '16px',
            overflow: 'hidden',
            zIndex: 9999,
            background: '#FFF8F5',
            border: '1px solid rgba(192, 57, 43, 0.18)',
            boxShadow: '0 12px 30px rgba(192, 57, 43, 0.15)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(44, 26, 19, 0.08)' }}
          >
            <div className="flex items-center gap-2">
              <Bell size={14} style={{ color: RED }} />
              <span style={{ fontFamily: "var(--font-gothic)", fontSize: '0.9rem', color: BROWN }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(192, 57, 43, 0.08)',
                    color: RED,
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.62rem',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  id="notif-mark-all-read"
                  onClick={markAllAsRead}
                  className="btn-explosive flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
                  style={{
                    background: 'rgba(192, 57, 43, 0.06)',
                    color: RED,
                    fontFamily: 'var(--font-tech)',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                  }}
                  title="Tout marquer comme lu"
                >
                  <CheckCheck size={11} />
                  Tout lire
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="btn-explosive w-6 h-6 flex items-center justify-center rounded-lg"
                style={{ color: MUTED, background: 'rgba(44, 26, 19, 0.04)' }}
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Enable push CTA */}
          {showEnablePush && (
            <button
              id="notif-enable-push-btn"
              onClick={handleEnablePush}
              disabled={enabling}
              className="btn-explosive w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left"
              style={{
                background: 'rgba(192, 57, 43, 0.04)',
                color: RED,
                borderBottom: '1px solid rgba(44, 26, 19, 0.08)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
              }}
            >
              <BellRing size={13} />
              {enabling ? 'Activation...' : '🔔 Activer les notifications push'}
            </button>
          )}

          {/* Notification list */}
          <div className="max-h-[320px] overflow-y-auto hide-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Bell size={28} style={{ color: 'rgba(192, 57, 43, 0.2)' }} />
                <p style={{ color: MUTED, fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>
                  Aucune notification
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="group relative"
                  onMouseEnter={() => setHoveredId(n.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <button
                    id={`notif-item-${n.id}`}
                    onClick={() => handleClickNotification(n)}
                    className="w-full text-left px-4 py-3 flex gap-3"
                    style={{
                      background: n.read ? 'transparent' : 'rgba(192, 57, 43, 0.04)',
                      borderBottom: '1px solid rgba(44, 26, 19, 0.04)',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Unread indicator */}
                    {!n.read && (
                      <span
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                        style={{ background: RED }}
                      />
                    )}

                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      <NotifIcon type={n.type} read={n.read} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pr-6">
                      <p
                        className="text-sm leading-snug"
                        style={{ color: BROWN, fontFamily: 'var(--font-sans)', fontWeight: n.read ? 400 : 600 }}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p
                          className="text-xs mt-0.5 break-words line-clamp-2"
                          style={{ color: MUTED, fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}
                        >
                          {n.body}
                        </p>
                      )}
                      <p style={{ color: MUTED, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', marginTop: '4px' }}>
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </button>

                  {/* Delete button (visible on hover) */}
                  <button
                    onClick={(e) => handleDelete(e, n.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg btn-explosive"
                    style={{
                      color: MUTED,
                      background: hoveredId === n.id ? 'rgba(44, 26, 19, 0.06)' : 'transparent',
                      opacity: hoveredId === n.id ? 1 : 0,
                      transition: 'all 0.15s',
                      pointerEvents: hoveredId === n.id ? 'auto' : 'none',
                    }}
                    title="Supprimer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              className="px-4 py-2.5 text-center"
              style={{ borderTop: '1px solid rgba(44, 26, 19, 0.04)' }}
            >
              <span style={{ color: MUTED, fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>
                {notifications.length} notification{notifications.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
