import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Copy, Check, Shield, Eye, AtSign } from 'lucide-react'
import { BottomNav } from '@/components/shared/BottomNav'
import { useMessages } from '@/hooks/useMessages'
import { useAuth } from '@/context/AuthContext'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, isAdmin, logout } = useAuth()
  const username = user?.username ?? ''
  const role = user?.role ?? 'user'
  const [copied, setCopied] = useState(false)
  const { unreadCount } = useMessages()

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
