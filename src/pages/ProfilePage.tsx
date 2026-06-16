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

const BG = 'linear-gradient(160deg, #FAF6F0 0%, #F5EBE6 55%, #FAF0EE 100%)'
const FONT_SERIF = "'Playfair Display', Georgia, serif"
const FONT_SANS = "'DM Sans', sans-serif"
const RED = '#C0392B'
const BROWN = '#2C1A13'
const MUTED = '#8A6B5E'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, isAdmin, logout } = useAuth()
  const username = user?.username ?? ''
  const role = user?.role ?? 'user'
  const [copied, setCopied] = useState(false)
  const { unreadCount } = useMessages()

  const pushSupported = isPushSupported()
  const [pushState, setPushState] = useState<'enabled' | 'disabled' | 'denied' | 'unsupported'>(
    () => {
      if (!isPushSupported()) return 'unsupported'
      const perm = pushPermission()
      if (perm === 'denied') return 'denied'
      if (perm === 'granted' && localStorage.getItem('whispers_push_enabled') === 'true') return 'enabled'
      return 'disabled'
    }
  )
  const [pushLoading, setPushLoading] = useState(false)

  useEffect(() => {
    if (!pushSupported) return
    const sync = () => {
      const perm = pushPermission()
      if (perm === 'denied') {
        localStorage.removeItem('whispers_push_enabled')
        setPushState('denied')
      } else if (perm !== 'granted') {
        localStorage.removeItem('whispers_push_enabled')
        setPushState('disabled')
      }
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
    <div className="min-h-screen pb-28" style={{ background: BG, fontFamily: FONT_SANS }}>
      {/* Texture grain */}
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat', backgroundSize: '128px',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="px-5 pt-12 flex flex-col items-center animate-fade-up">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-pop"
            style={{
              background: 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)',
              border: '3px solid rgba(192,57,43,0.2)',
              boxShadow: '0 8px 24px rgba(192,57,43,0.25)',
            }}
          >
            <span style={{ fontFamily: FONT_SERIF, fontSize: '2.2rem', color: '#FFF8F5', fontWeight: 500 }}>
              {username[0].toUpperCase()}
            </span>
          </div>
          <h1 style={{ fontFamily: FONT_SERIF, fontSize: '1.8rem', color: BROWN }}>
            @{username}
          </h1>
          {role === 'admin' && (
            <span
              className="mt-2 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(192,57,43,0.1)', color: RED, fontWeight: 600 }}
            >
              <Shield size={12} />
              Administrateur
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pt-8 flex flex-col gap-3 animate-fade-up delay-1">
          <div
            className="rounded-2xl px-4 py-4 flex items-center gap-3"
            style={{
              background: '#FFF8F5',
              border: '1px solid rgba(44,26,19,0.06)',
              boxShadow: '0 2px 8px rgba(44,26,19,0.04)',
            }}
          >
            <AtSign size={16} style={{ color: MUTED }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs" style={{ color: MUTED }}>Lien public</p>
              <p className="text-sm break-all font-medium" style={{ color: BROWN }}>
                {shareUrl}
              </p>
            </div>
            <button id="profile-copy-btn" onClick={copyLink} style={{ color: copied ? RED : MUTED, padding: '4px' }}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>

          <button
            id="profile-preview-btn"
            onClick={() => navigate(`/${username}`)}
            className="ws-press rounded-2xl px-4 py-4 flex items-center gap-3"
            style={{
              background: '#FFF8F5',
              border: '1px solid rgba(44,26,19,0.06)',
              color: BROWN,
              boxShadow: '0 2px 8px rgba(44,26,19,0.04)',
            }}
          >
            <Eye size={16} style={{ color: MUTED }} />
            <span className="text-sm font-medium">Aperçu de ta page</span>
          </button>

          {/* Push notifications */}
          {pushSupported && (
            <button
              id="profile-push-btn"
              onClick={togglePush}
              disabled={pushLoading || pushState === 'denied'}
              className="ws-press rounded-2xl px-4 py-4 flex items-center gap-3"
              style={{
                background: pushState === 'enabled' ? 'rgba(192,57,43,0.06)' : pushState === 'denied' ? 'rgba(44,26,19,0.04)' : '#FFF8F5',
                border: pushState === 'enabled' ? '1px solid rgba(192,57,43,0.18)' : '1px solid rgba(44,26,19,0.06)',
                boxShadow: pushState === 'enabled' ? 'none' : '0 2px 8px rgba(44,26,19,0.04)',
                opacity: pushLoading ? 0.6 : 1,
                transition: 'all 0.3s',
                width: '100%',
                cursor: pushState === 'denied' ? 'not-allowed' : 'pointer',
              }}
            >
              {pushState === 'enabled' ? (
                <Bell size={16} style={{ color: RED }} />
              ) : (
                <BellOff size={16} style={{ color: pushState === 'denied' ? '#922B21' : MUTED }} />
              )}
              <div className="flex-1 text-left">
                <p
                  className="text-sm font-medium"
                  style={{
                    color: pushState === 'enabled' ? RED : pushState === 'denied' ? '#922B21' : BROWN,
                  }}
                >
                  {pushLoading ? 'En cours…' : pushState === 'enabled' ? 'Notifications activées' : pushState === 'denied' ? 'Notifications bloquées' : 'Activer les notifications'}
                </p>
                {pushState === 'denied' && (
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                    Autorise-les dans les réglages du navigateur
                  </p>
                )}
              </div>
              {pushState !== 'denied' && (
                <div
                  style={{
                    width: 36, height: 20, borderRadius: 10,
                    background: pushState === 'enabled' ? RED : 'rgba(44,26,19,0.1)',
                    position: 'relative', flexShrink: 0, transition: 'background 0.3s',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute', top: 3, left: pushState === 'enabled' ? 19 : 3,
                      width: 14, height: 14, borderRadius: '50%', background: '#fff',
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
              className="ws-press rounded-2xl px-4 py-4 flex items-center gap-3 mt-4"
              style={{
                background: 'rgba(192,57,43,0.08)',
                border: '1px solid rgba(192,57,43,0.2)',
                color: RED,
              }}
            >
              <Shield size={16} />
              <span className="text-sm font-medium">Interface d'administration</span>
            </button>
          )}

          <button
            id="profile-logout-btn"
            onClick={handleLogout}
            className="ws-press rounded-2xl px-4 py-4 flex items-center justify-center gap-2 mt-4"
            style={{
              background: 'transparent',
              border: '1px solid rgba(44,26,19,0.1)',
              color: MUTED,
            }}
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Se déconnecter</span>
          </button>
        </div>
      </div>

      <BottomNav unreadCount={unreadCount} />
    </div>
  )
}
