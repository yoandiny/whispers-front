import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share2, ChevronRight, MessageCircle, Trash2, Copy, Check, LogOut, Image as ImageIcon, List, LayoutGrid } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMessages } from '@/hooks/useMessages'
import { BottomNav } from '@/components/shared/BottomNav'
import { MessageCarousel } from '@/components/shared/MessageCarousel'
import { generateStoryImage, shareImage } from '@/lib/share'
import { useAuth } from '@/context/AuthContext'
import type { Message } from '@/types'

type ViewMode = 'list' | 'cards'

function timeAgo(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}j`
}

import { BackgroundBlobs } from '@/components/shared/BackgroundBlobs'

const BG = 'linear-gradient(160deg, #FAF6F0 0%, #F5EBE6 55%, #FAF0EE 100%)'
const RED = '#C0392B'
const BROWN = '#2C1A13'
const MUTED = '#8A6B5E'

export function InboxPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const username = user?.username ?? ''
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const { messages, unreadCount, deleteMessage, markAsRead } = useMessages()
  const [sharingId, setSharingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('whispers_inbox_view') as ViewMode) ?? 'list'
  )

  const shareUrl = `${window.location.origin}/${username}`

  function changeView(mode: ViewMode) {
    setViewMode(mode)
    localStorage.setItem('whispers_inbox_view', mode)
  }

  const markRead = useCallback(
    (msg: Message) => {
      if (!msg.read) markAsRead(msg.id)
    },
    [markAsRead]
  )

  function toggleExpand(msg: Message) {
    const next = expanded === msg.id ? null : msg.id
    setExpanded(next)
    if (next) markRead(msg)
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  async function shareMessageAsStory(msg: Message) {
    if (sharingId) return
    setSharingId(msg.id)
    const loading = toast.loading('Génération de l\u2019image...')
    try {
      const blob = await generateStoryImage({ message: msg.text, username })
      const res = await shareImage(blob, `whispers-${msg.id}.png`, 'Reçu sur Whispers')
      toast.dismiss(loading)
      if (res.method === 'downloaded') toast.success('Image enregistrée — partage-la en story !')
      else if (res.method === 'shared') toast.success('Story partagée !')
    } catch (err: any) {
      toast.dismiss(loading)
      if (err?.name !== 'AbortError') toast.error('Partage impossible')
    } finally {
      setSharingId(null)
    }
  }

  if (!username) return null

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: 'var(--font-sans)' }}>
      <BackgroundBlobs />
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
        <div
          className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between"
          style={{
            background: 'rgba(250, 246, 240, 0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(44,26,19,0.06)',
          }}
        >
          <div>
            <span className="animate-tracking-in" style={{ fontFamily: 'var(--font-gothic)', fontSize: '1.4rem', color: BROWN }}>
              Whispers
            </span>
            <span className="ml-1.5" style={{ fontSize: '0.8rem', color: MUTED }}>
              @{username}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="copy-link-btn"
              onClick={copyLink}
              className="btn-explosive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
              style={{
                background: copied ? 'rgba(192,57,43,0.08)' : '#FFF8F5',
                color: copied ? RED : BROWN,
                border: '1px solid rgba(44,26,19,0.06)',
                transition: 'all 0.2s',
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copié!' : 'Copier'}
            </button>
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="btn-explosive w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ background: '#FFF8F5', border: '1px solid rgba(44,26,19,0.06)', color: MUTED }}
              title="Déconnexion"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>

        {/* Share banner (style sceau/lettre) */}
        <div className="px-5 pt-5 pb-2">
          <div
            className="card-explosive rounded-xl p-4 flex items-center justify-between"
            style={{
              background: '#FFF8F5',
              border: '1px solid rgba(192,57,43,0.18)',
              boxShadow: '0 4px 16px rgba(192,57,43,0.08)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Ligne rouge décorative */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: RED }} />
            <div className="pl-2">
              <p style={{ color: RED, fontWeight: 700, fontFamily: 'var(--font-tech)', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.75rem' }}>
                Partage ton lien
              </p>
              <p className="text-xs mt-0.5" style={{ color: MUTED, fontFamily: 'monospace' }}>
                {shareUrl}
              </p>
            </div>
            <button
              id="share-banner-btn"
              onClick={copyLink}
              className="btn-explosive flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
              style={{
                background: 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)',
                color: '#FFF8F5',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(192,57,43,0.25)',
              }}
            >
              <Share2 size={12} />
              Partager
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="px-5 pt-5 pb-24">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: BROWN }}>
                Boîte de réception
              </span>
              {unreadCount > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(192,57,43,0.1)', color: RED, fontWeight: 600 }}
                >
                  {unreadCount} nvx
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: MUTED }}>
                {messages.length} total
              </span>
              {/* View toggle */}
              <div
                className="flex items-center rounded-lg overflow-hidden"
                style={{ background: '#FFF8F5', border: '1px solid rgba(44,26,19,0.08)' }}
              >
                <button
                  id="view-list-btn"
                  onClick={() => changeView('list')}
                  className="btn-explosive w-8 h-7 flex items-center justify-center"
                  style={{
                    background: viewMode === 'list' ? 'rgba(192,57,43,0.08)' : 'transparent',
                    color: viewMode === 'list' ? RED : MUTED,
                  }}
                  title="Vue liste"
                >
                  <List size={14} />
                </button>
                <button
                  id="view-cards-btn"
                  onClick={() => changeView('cards')}
                  className="btn-explosive w-8 h-7 flex items-center justify-center"
                  style={{
                    background: viewMode === 'cards' ? 'rgba(192,57,43,0.08)' : 'transparent',
                    color: viewMode === 'cards' ? RED : MUTED,
                  }}
                  title="Vue cards"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-20">
              <MessageCircle size={32} className="mx-auto mb-4" style={{ color: 'rgba(44,26,19,0.15)' }} />
              <p className="text-sm" style={{ color: MUTED }}>
                Aucun message pour l'instant
              </p>
              <p className="text-xs mt-1.5" style={{ color: '#C4A89E' }}>
                Partage ton lien pour recevoir des confessions.
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            <MessageCarousel
              messages={messages}
              sharingId={sharingId}
              onShare={shareMessageAsStory}
              onDelete={deleteMessage}
              onActive={markRead}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((msg: Message, i: number) => (
                <div
                  key={msg.id}
                  className="card-explosive rounded-xl cursor-pointer animate-fade-up"
                  style={{
                    animationDelay: `${Math.min(i * 0.04, 0.3)}s`,
                    background: '#FFF8F5',
                    border: expanded === msg.id
                      ? '1px solid rgba(192,57,43,0.2)'
                      : '1px solid rgba(44,26,19,0.06)',
                    boxShadow: expanded === msg.id
                      ? '0 6px 20px rgba(192,57,43,0.1)'
                      : '0 2px 8px rgba(44,26,19,0.04)',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => toggleExpand(msg)}
                >
                  <div className="px-4 py-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{
                            background: msg.read ? 'transparent' : RED,
                            boxShadow: msg.read ? 'none' : '0 0 4px rgba(192,57,43,0.5)',
                          }}
                        />
                        <span style={{ color: MUTED, fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: msg.read ? 400 : 600 }}>
                          {timeAgo(new Date(msg.time))}
                        </span>
                      </div>
                      <p
                        style={{
                          color: BROWN,
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.92rem',
                          lineHeight: 1.5,
                          display: expanded === msg.id ? 'block' : '-webkit-box',
                          WebkitLineClamp: expanded === msg.id ? undefined : 2,
                          WebkitBoxOrient: 'vertical' as const,
                          overflow: expanded === msg.id ? 'visible' : 'hidden',
                          transition: 'font-size 0.2s',
                        }}
                      >
                        "{msg.text}"
                      </p>
                    </div>
                    <ChevronRight
                      size={15}
                      style={{
                        color: MUTED,
                        transform: expanded === msg.id ? 'rotate(90deg)' : 'none',
                        transition: 'transform 0.2s',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                  </div>

                  {expanded === msg.id && (
                    <div
                      className="px-4 pb-3 flex justify-between items-center gap-2 animate-fade-in"
                      style={{ borderTop: '1px dashed rgba(44,26,19,0.1)', paddingTop: '12px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        id={`share-msg-${msg.id}`}
                        onClick={() => shareMessageAsStory(msg)}
                        disabled={sharingId === msg.id}
                        className="btn-explosive flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                        style={{
                          background: 'rgba(192,57,43,0.06)',
                          color: RED,
                          fontFamily: 'var(--font-tech)',
                          fontWeight: 700,
                        }}
                      >
                        <ImageIcon size={13} />
                        {sharingId === msg.id ? 'Génération...' : 'Partager'}
                      </button>
                      <button
                        id={`delete-msg-${msg.id}`}
                        onClick={() => deleteMessage(msg.id)}
                        className="btn-explosive flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:opacity-80"
                        style={{ color: '#E53935', fontFamily: 'var(--font-tech)', fontWeight: 700 }}
                      >
                        <Trash2 size={13} />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav unreadCount={unreadCount} />
    </div>
  )
}
