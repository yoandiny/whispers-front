import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Copy, Check, Shield, Eye, AtSign, Bell, BellOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { BottomNav } from '@/components/shared/BottomNav'
import { useMessages } from '@/hooks/useMessages'
import { useAuth } from '@/context/AuthContext'
import {
  isPushSupported,
  pushPermission,
  enablePush,
  disablePush,
} from '@/lib/push'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, isAdmin, logout } = useAuth()
  const username = user?.username ?? ''
  const role = user?.role ?? 'user'
  const [copied, setCopied] = useState(false)
  const { unreadCount } = useMessages()

  // ── Push notifications ───────────────────────────────────────────────────
  const pushSupported = isPushSupported()
  const [pushState, setPushState] = useState<'enabled' | 'disabled' | 'denied' | 'unsupported'>(
    () => {
      if (!isPushSupported()) return 'unsupported'
      const perm = pushPermission()
      // Browser blocked → always show denied
      if (perm === 'denied') return 'denied'
      // Enabled only if the user explicitly opted in via our toggle (localStorage flag)
      if (perm === 'granted' && localStorage.getItem('whispers_push_enabled') === 'true') return 'enabled'
      // Default: disabled (opt-in required)
      return 'disabled'
    }
  )
  const [pushLoading, setPushLoading] = useState(false)

  // Sync state when tab regains visibility (e.g. user changed browser perm settings)
  useEffect(() => {
    if (!pushSupported) return
    const sync = () => {
      const perm = pushPermission()
      if (perm === 'denied') {
        // Browser blocked → override to denied and clear our flag
        localStorage.removeItem('whispers_push_enabled')
        setPushState('denied')
      } else if (perm !== 'granted') {
        // Permission was reset (e.g. cleared in browser settings)
        localStorage.removeItem('whispers_push_enabled')
        setPushState('disabled')
      }
      // If perm === 'granted' we do NOT auto-enable — user must click the toggle
    }
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [pushSupported])

  const togglePush = useCallback(async () => {
    if (pushLoading) return
    setPushLoading(true)
    try {
      if (pushState === 'enabled') {
        await disablePush()
        localStorage.removeItem('whispers_push_enabled')
        setPushState('disabled')
        toast('Notifications désactivées', { icon: '🔕' })
      } else {
        const result = await enablePush()
        if (result.ok) {
          localStorage.setItem('whispers_push_enabled', 'true')
          setPushState('enabled')
          toast.success('Notifications activées !')
        } else if (result.reason === 'denied') {
          localStorage.removeItem('whispers_push_enabled')
          setPushState('denied')
          toast.error('Permission refusée par le navigateur')
        } else if (result.reason === 'no-vapid') {
          toast.error('Notifications non configurées côté serveur')
        } else {
          toast.error('Impossible d\'activer les notifications')
        }
      }
    } finally {
      setPushLoading(false)
    }
  }, [pushState, pushLoading])
  // ────────────────────────────────────────────────────────────────────────

  const shareUrl = `${window.location.origin}/${username}`

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  if (!username) return null

  return (
    <div className="min-h-screen pb-28" style={{ background: '#0e0e0f', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="px-5 pt-12 flex flex-col items-center animate-fade-up">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-pop"
          style={{
            background: 'linear-gradient(135deg, #2a2420 0%, #1e1a16 100%)',
            border: '1px solid rgba(200,170,130,0.2)',
          }}
        >
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2rem', color: '#c8aa82' }}>
            {username[0].toUpperCase()}
          </span>
        </div>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.5rem', color: '#ede8e1' }}>
          @{username}
        </h1>
        {role === 'admin' && (
          <span
            className="mt-2 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(200,170,130,0.15)', color: '#c8aa82' }}
          >
            <Shield size={11} />
            Administrateur
          </span>
        )}
      </div>

      {/* Info / actions */}
      <div className="px-5 pt-8 flex flex-col gap-3 animate-fade-up delay-1">
        <div
          className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
          style={{ background: '#161618', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <AtSign size={16} style={{ color: '#7a756d' }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs" style={{ color: '#7a756d' }}>
              Lien public
            </p>
            <p className="text-sm break-all" style={{ color: '#ede8e1' }}>
              {shareUrl}
            </p>
          </div>
          <button id="profile-copy-btn" onClick={copyLink} style={{ color: copied ? '#c8aa82' : '#7a756d' }}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <button
          id="profile-preview-btn"
          onClick={() => navigate(`/${username}`)}
          className="ws-press rounded-2xl px-4 py-3.5 flex items-center gap-3"
          style={{ background: '#161618', border: '1px solid rgba(255,255,255,0.05)', color: '#ede8e1' }}
        >
          <Eye size={16} style={{ color: '#7a756d' }} />
          <span className="text-sm">Aperçu de ta page</span>
        </button>

        {/* Push notifications toggle */}
        {pushSupported && (
          <button
            id="profile-push-btn"
            onClick={togglePush}
            disabled={pushLoading || pushState === 'denied'}
            className="ws-press rounded-2xl px-4 py-3.5 flex items-center gap-3"
            style={{
              background:
                pushState === 'enabled'
                  ? 'rgba(200,170,130,0.08)'
                  : pushState === 'denied'
                  ? 'rgba(120,60,60,0.06)'
                  : '#161618',
              border:
                pushState === 'enabled'
                  ? '1px solid rgba(200,170,130,0.18)'
                  : pushState === 'denied'
                  ? '1px solid rgba(120,60,60,0.15)'
                  : '1px solid rgba(255,255,255,0.05)',
              opacity: pushLoading ? 0.6 : 1,
              transition: 'background 0.3s, border 0.3s, opacity 0.2s',
              width: '100%',
              cursor: pushState === 'denied' ? 'not-allowed' : 'pointer',
            }}
          >
            {pushState === 'enabled' ? (
              <Bell size={16} style={{ color: '#c8aa82' }} />
            ) : (
              <BellOff size={16} style={{ color: pushState === 'denied' ? '#c87a7a' : '#7a756d' }} />
            )}
            <div className="flex-1 text-left">
              <p
                className="text-sm"
                style={{
                  color:
                    pushState === 'enabled'
                      ? '#c8aa82'
                      : pushState === 'denied'
                      ? '#c87a7a'
                      : '#ede8e1',
                  fontWeight: pushState === 'enabled' ? 500 : 400,
                }}
              >
                {pushLoading
                  ? 'En cours…'
                  : pushState === 'enabled'
                  ? 'Notifications activées'
                  : pushState === 'denied'
                  ? 'Notifications bloquées'
                  : 'Activer les notifications'}
              </p>
              {pushState === 'denied' && (
                <p className="text-xs mt-0.5" style={{ color: '#7a756d' }}>
                  Autorise-les dans les réglages du navigateur
                </p>
              )}
            </div>
            {/* Toggle pill */}
            {pushState !== 'denied' && (
              <div
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  background: pushState === 'enabled' ? '#c8aa82' : 'rgba(255,255,255,0.1)',
                  position: 'relative',
                  flexShrink: 0,
                  transition: 'background 0.3s',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: pushState === 'enabled' ? 19 : 3,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.25s cubic-bezier(.4,0,.2,1)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                />
              </div>
            )}
          </button>
        )}

        {isAdmin && (
          <button
            id="profile-admin-btn"
            onClick={() => navigate('/admin')}
            className="ws-press rounded-2xl px-4 py-3.5 flex items-center gap-3"
            style={{ background: 'rgba(200,170,130,0.08)', border: '1px solid rgba(200,170,130,0.18)', color: '#c8aa82' }}
          >
            <Shield size={16} />
            <span className="text-sm" style={{ fontWeight: 500 }}>
              Interface d'administration
            </span>
          </button>
        )}

        <button
          id="profile-logout-btn"
          onClick={handleLogout}
          className="ws-press rounded-2xl px-4 py-3.5 flex items-center gap-3 mt-2"
          style={{ background: 'rgba(120,60,60,0.08)', border: '1px solid rgba(120,60,60,0.18)', color: '#c87a7a' }}
        >
          <LogOut size={16} />
          <span className="text-sm">Se déconnecter</span>
        </button>
      </div>

      <BottomNav unreadCount={unreadCount} />
    </div>
  )
}
