import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share2, Copy, Check, MessageCircle, Eye, Inbox } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMessages } from '@/hooks/useMessages'
import { BottomNav } from '@/components/shared/BottomNav'
import { shareLink } from '@/lib/share'
import { useAuth } from '@/context/AuthContext'

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
    <div className="min-h-screen pb-28" style={{ background: '#0e0e0f', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="px-5 pt-10 pb-2 animate-fade-up">
        <p className="text-sm" style={{ color: '#7a756d' }}>
          Bienvenue,
        </p>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2rem', color: '#ede8e1', lineHeight: 1.1 }}>
          @{username}
        </h1>
      </div>

      {/* Share card */}
      <div className="px-5 pt-4 animate-fade-up delay-1">
        <div
          className="ws-lift rounded-2xl p-5"
          style={{ background: 'rgba(200,170,130,0.07)', border: '1px solid rgba(200,170,130,0.12)' }}
        >
          <p className="text-sm" style={{ color: '#c8aa82', fontWeight: 500 }}>
            Partage ton lien
          </p>
          <p className="text-xs mt-1 mb-4 break-all" style={{ color: '#7a756d' }}>
            {shareUrl}
          </p>
          <div className="flex gap-2">
            <button
              id="home-copy-btn"
              onClick={copyLink}
              className="ws-press flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm"
              style={{ background: '#1e1e20', color: '#ede8e1', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
            <button
              id="home-share-btn"
              onClick={handleShare}
              className="ws-press flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm"
              style={{ background: '#c8aa82', color: '#0e0e0f', fontWeight: 500 }}
            >
              <Share2 size={14} />
              Partager en story
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 pt-4 grid grid-cols-2 gap-3 animate-fade-up delay-2">
        <div className="ws-lift rounded-2xl p-4" style={{ background: '#161618', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Inbox size={18} style={{ color: '#c8aa82' }} />
          <p className="mt-3" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.6rem', color: '#ede8e1' }}>
            {messages.length}
          </p>
          <p className="text-xs" style={{ color: '#7a756d' }}>
            Messages reçus
          </p>
        </div>
        <div className="ws-lift rounded-2xl p-4" style={{ background: '#161618', border: '1px solid rgba(255,255,255,0.05)' }}>
          <MessageCircle size={18} style={{ color: '#c8aa82' }} />
          <p className="mt-3" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.6rem', color: '#ede8e1' }}>
            {unreadCount}
          </p>
          <p className="text-xs" style={{ color: '#7a756d' }}>
            Non lus
          </p>
        </div>
      </div>

      {/* Preview your page */}
      <div className="px-5 pt-4 animate-fade-up delay-3">
        <button
          id="home-preview-btn"
          onClick={() => navigate(`/${username}`)}
          className="ws-press w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm"
          style={{
            background: 'rgba(200,170,130,0.1)',
            color: '#c8aa82',
            border: '1px solid rgba(200,170,130,0.2)',
            fontWeight: 500,
          }}
        >
          <Eye size={15} />
          Aperçu de ta page
        </button>
      </div>

      <BottomNav unreadCount={unreadCount} />
    </div>
  )
}
