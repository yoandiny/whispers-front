import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share2, Copy, Check, Eye, Inbox, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMessages } from '@/hooks/useMessages'
import { BottomNav } from '@/components/shared/BottomNav'
import { NotificationBell } from '@/components/shared/NotificationBell'
import { shareLink } from '@/lib/share'
import { useAuth } from '@/context/AuthContext'
import { BackgroundBlobs } from '@/components/shared/BackgroundBlobs'

const BG = 'linear-gradient(160deg, #FAF6F0 0%, #F5EBE6 55%, #FAF0EE 100%)'
const RED = '#C0392B'
const BROWN = '#2C1A13'
const MUTED = '#8A6B5E'

export function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const username = user?.username ?? ''
  const [copied, setCopied] = useState(false)
  const { messages, unreadCount } = useMessages()

  const shareUrl = `${window.location.origin}/${username}`

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    try {
      const res = await shareLink(shareUrl, `Envoie-moi un message anonyme sur Whispers — @${username}`)
      if (res.method === 'copied') toast.success('Lien copié — colle-le dans ta story !')
    } catch {
      /* user cancelled */
    }
  }

  if (!username) return null

  return (
    <div
      className="min-h-screen pb-28"
      style={{ background: BG, fontFamily: 'var(--font-sans)' }}
    >
      {/* Background blobs */}
      <BackgroundBlobs />

      {/* Grain texture */}
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat', backgroundSize: '128px',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="px-5 pt-12 pb-2 flex items-end justify-between animate-fade-up" style={{ position: 'relative', zIndex: 10 }}>
          <div>
            <p style={{ color: MUTED, fontFamily: 'var(--font-cursive)', fontSize: '1.9rem', lineHeight: 0.9, transform: 'rotate(-2deg)', display: 'inline-block' }}>Bienvenue,</p>
            <h1
              className="animate-tracking-in mt-2"
              style={{
                fontFamily: 'var(--font-gothic)',
                fontSize: '2rem',
                color: BROWN,
                lineHeight: 1.05,
              }}
            >
              @{username}
            </h1>
          </div>
          <div className="mt-2">
            <NotificationBell />
          </div>
        </div>

        {/* Carte partage — dégradé rouge bordeaux */}
        <div className="px-5 pt-5 animate-fade-up delay-1">
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)',
              boxShadow: '0 8px 28px rgba(192, 57, 43, 0.28)',
            }}
          >
            <p className="mb-1" style={{ color: 'rgba(255,248,245,0.7)', fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Ton lien anonyme
            </p>
            <p
              className="mb-4 break-all"
              style={{ color: 'rgba(255,248,245,0.6)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.01em' }}
            >
              {shareUrl}
            </p>
            <div className="flex gap-2">
              <button
                id="home-copy-btn"
                onClick={copyLink}
                className="btn-explosive flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm"
                style={{
                  background: 'rgba(255, 248, 245, 0.15)',
                  color: '#FFF8F5',
                  border: '1px solid rgba(255,248,245,0.2)',
                  backdropFilter: 'blur(4px)',
                  fontFamily: 'var(--font-tech)',
                  fontWeight: 700,
                  transition: 'background 0.2s',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
              <button
                id="home-share-btn"
                onClick={handleShare}
                className="btn-explosive flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm"
                style={{
                  background: '#FFF8F5',
                  color: RED,
                  fontFamily: 'var(--font-tech)',
                  fontWeight: 700,
                }}
              >
                <Share2 size={14} />
                Partager
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="px-5 pt-4 grid grid-cols-2 gap-3 animate-fade-up delay-2">
          <div
            className="card-explosive rounded-2xl p-4 cursor-pointer"
            onClick={() => navigate('/inbox')}
            style={{
              background: '#FFF8F5',
              border: '1px solid rgba(44, 26, 19, 0.06)',
              boxShadow: '0 2px 12px rgba(44, 26, 19, 0.07)',
            }}
          >
            <Inbox size={18} style={{ color: RED }} />
            <p
              className="mt-3"
              style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: BROWN, fontWeight: 900, lineHeight: 1 }}
            >
              {messages.length}
            </p>
            <p className="mt-1" style={{ color: MUTED, fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Messages reçus</p>
          </div>
          <div
            className="card-explosive rounded-2xl p-4 cursor-pointer"
            onClick={() => navigate('/inbox')}
            style={{
              background: '#FFF8F5',
              border: '1px solid rgba(44, 26, 19, 0.06)',
              boxShadow: '0 2px 12px rgba(44, 26, 19, 0.07)',
            }}
          >
            <MessageCircle size={18} style={{ color: RED }} />
            <p
              className="mt-3"
              style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: BROWN, fontWeight: 900, lineHeight: 1 }}
            >
              {unreadCount}
            </p>
            <p className="mt-1" style={{ color: MUTED, fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Non lus</p>
          </div>
        </div>

        {/* Aperçu de ta page */}
        <div className="px-5 pt-4 animate-fade-up delay-3">
          <button
            id="home-preview-btn"
            onClick={() => navigate(`/${username}`)}
            className="btn-explosive w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm"
            style={{
              background: 'rgba(192, 57, 43, 0.06)',
              color: RED,
              border: '1px solid rgba(192, 57, 43, 0.15)',
              fontFamily: 'var(--font-tech)',
              fontWeight: 700,
              transition: 'all 0.2s',
            }}
          >
            <Eye size={15} />
            Aperçu de ta page publique
          </button>
        </div>
      </div>

      <BottomNav unreadCount={unreadCount} />
    </div>
  )
}
