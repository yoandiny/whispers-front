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
  const color = read ? '#4a4540' : '#c8aa82'
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
        className="ws-press"
        style={{
          position: 'relative',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          background: open ? 'rgba(200,170,130,0.15)' : '#1a1a1c',
          border: `1px solid ${open ? 'rgba(200,170,130,0.3)' : 'rgba(255,255,255,0.08)'}`,
          color: '#c8aa82',
          transition: 'background 0.15s, border-color 0.15s',
          flexShrink: 0,
        }}
        title="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing size={18} style={{ animation: 'bell-ring 0.6s ease', color: '#c8aa82' }} />
        ) : (
          <Bell size={18} style={{ color: '#c8aa82' }} />
        )}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              fontSize: '10px',
              minWidth: '18px',
              height: '18px',
              paddingLeft: '4px',
              paddingRight: '4px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#c8aa82',
              color: '#0e0e0f',
              fontWeight: 700,
              boxShadow: '0 0 0 2px #0e0e0f',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="animate-fade-up"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '340px',
            maxWidth: '92vw',
            borderRadius: '16px',
            overflow: 'hidden',
            zIndex: 9999,
            background: '#131315',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2">
              <Bell size={14} style={{ color: '#c8aa82' }} />
              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.05rem', color: '#ede8e1' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className="text-[11px] px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(200,170,130,0.15)', color: '#c8aa82', fontWeight: 600 }}
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
                  className="ws-press flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                  style={{
                    background: 'rgba(200,170,130,0.08)',
                    color: '#c8aa82',
                    border: '1px solid rgba(200,170,130,0.15)',
                  }}
                  title="Tout marquer comme lu"
                >
                  <CheckCheck size={12} />
                  Tout lire
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="ws-press w-6 h-6 flex items-center justify-center rounded-lg"
                style={{ color: '#4a4540', background: 'rgba(255,255,255,0.04)' }}
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
              className="ws-press w-full flex items-center gap-2 px-4 py-2.5 text-xs"
              style={{
                background: 'rgba(200,170,130,0.06)',
                color: '#c8aa82',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                transition: 'background 0.15s',
              }}
            >
              <BellRing size={13} />
              {enabling ? 'Activation en cours...' : '🔔 Activer les notifications push sur cet appareil'}
            </button>
          )}

          {/* Notification list */}
          <div className="max-h-[360px] overflow-y-auto hide-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Bell size={28} style={{ color: '#2a2520' }} />
                <p className="text-sm" style={{ color: '#4a4540' }}>
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
                    className="ws-press w-full text-left px-4 py-3.5 flex gap-3"
                    style={{
                      background: n.read ? 'transparent' : 'rgba(200,170,130,0.05)',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Unread indicator */}
                    {!n.read && (
                      <span
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
                        style={{ background: '#c8aa82' }}
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
                        style={{ color: '#ede8e1', fontWeight: n.read ? 400 : 500 }}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p
                          className="text-xs mt-0.5 break-words line-clamp-2"
                          style={{ color: '#7a756d', lineHeight: 1.5 }}
                        >
                          {n.body}
                        </p>
                      )}
                      <p className="text-[11px] mt-1.5" style={{ color: '#3a3530' }}>
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </button>

                  {/* Delete button (visible on hover) */}
                  <button
                    onClick={(e) => handleDelete(e, n.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg ws-press"
                    style={{
                      color: '#4a4540',
                      background: hoveredId === n.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                      opacity: hoveredId === n.id ? 1 : 0,
                      transition: 'opacity 0.15s, background 0.15s',
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
              style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
            >
              <span className="text-[11px]" style={{ color: '#3a3530' }}>
                {notifications.length} notification{notifications.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
