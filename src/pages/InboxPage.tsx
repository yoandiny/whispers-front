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
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

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

  // Mark a message as "already seen" the first time it is opened/viewed
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
    <div className="min-h-screen" style={{ background: '#0e0e0f', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between"
        style={{ background: '#0e0e0f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.25rem', color: '#ede8e1' }}>
            Whispers
          </span>
          <span className="ml-1" style={{ fontSize: '0.8rem', color: '#7a756d' }}>
            @{username}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="copy-link-btn"
            onClick={copyLink}
            className="ws-press flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
            style={{
              background: copied ? 'rgba(200,170,130,0.15)' : '#1e1e20',
              color: copied ? '#c8aa82' : '#ede8e1',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="ws-press w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: '#1e1e20', border: '1px solid rgba(255,255,255,0.06)', color: '#7a756d' }}
            title="Log out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>

      {/* Share banner */}
      <div className="px-5 pt-5 pb-2">
        <div
          className="rounded-xl p-4 flex items-center justify-between"
          style={{ background: 'rgba(200,170,130,0.07)', border: '1px solid rgba(200,170,130,0.12)' }}
        >
          <div>
            <p className="text-sm" style={{ color: '#c8aa82', fontWeight: 500 }}>
              Share your link
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#7a756d' }}>
              {shareUrl}
            </p>
          </div>
          <button
            id="share-banner-btn"
            onClick={copyLink}
            className="ws-press flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
            style={{ background: '#c8aa82', color: '#0e0e0f', fontWeight: 500 }}
          >
            <Share2 size={12} />
            Share
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="px-5 pt-4 pb-24">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: '#7a756d' }}>
              Messages
            </span>
            {unreadCount > 0 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(200,170,130,0.15)', color: '#c8aa82' }}
              >
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#4a4540' }}>
              {messages.length} total
            </span>
            {/* View toggle */}
            <div
              className="flex items-center rounded-lg overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <button
                id="view-list-btn"
                onClick={() => changeView('list')}
                className="ws-press w-7 h-7 flex items-center justify-center"
                style={{
                  background: viewMode === 'list' ? 'rgba(200,170,130,0.15)' : 'transparent',
                  color: viewMode === 'list' ? '#c8aa82' : '#7a756d',
                }}
                title="Vue liste"
              >
                <List size={14} />
              </button>
              <button
                id="view-cards-btn"
                onClick={() => changeView('cards')}
                className="ws-press w-7 h-7 flex items-center justify-center"
                style={{
                  background: viewMode === 'cards' ? 'rgba(200,170,130,0.15)' : 'transparent',
                  color: viewMode === 'cards' ? '#c8aa82' : '#7a756d',
                }}
                title="Vue cards"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle size={32} className="mx-auto mb-3" style={{ color: '#2a2a2c' }} />
            <p className="text-sm" style={{ color: '#4a4540' }}>
              No messages yet
            </p>
            <p className="text-xs mt-1" style={{ color: '#3a3a3c' }}>
              Share your link to start receiving messages
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
          <div className="flex flex-col gap-2">
            {messages.map((msg: Message, i: number) => (
              <div
                key={msg.id}
                className="ws-lift rounded-xl cursor-pointer animate-fade-up"
                style={{
                  animationDelay: `${Math.min(i * 0.04, 0.3)}s`,
                  background: expanded === msg.id ? '#1c1c1e' : '#161618',
                  border:
                    expanded === msg.id
                      ? '1px solid rgba(200,170,130,0.15)'
                      : '1px solid rgba(255,255,255,0.05)',
                }}
                onClick={() => toggleExpand(msg)}
              >
                <div className="px-4 py-3.5 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: msg.read ? 'transparent' : '#c8aa82' }}
                      />
                      <span className="text-xs" style={{ color: '#4a4540' }}>
                        {timeAgo(msg.time)}
                      </span>
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: '#ede8e1',
                        display: expanded === msg.id ? 'block' : '-webkit-box',
                        WebkitLineClamp: expanded === msg.id ? undefined : 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: expanded === msg.id ? 'visible' : 'hidden',
                      }}
                    >
                      {msg.text}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    style={{
                      color: '#4a4540',
                      transform: expanded === msg.id ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                </div>

                {expanded === msg.id && (
                  <div
                    className="px-4 pb-3.5 flex justify-between items-center gap-2 animate-fade-in"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      id={`share-msg-${msg.id}`}
                      onClick={() => shareMessageAsStory(msg)}
                      disabled={sharingId === msg.id}
                      className="ws-press flex items-center gap-1.5 text-xs mt-2 px-3 py-1.5 rounded-lg"
                      style={{
                        background: 'rgba(200,170,130,0.1)',
                        color: '#c8aa82',
                        border: '1px solid rgba(200,170,130,0.2)',
                      }}
                    >
                      <ImageIcon size={12} />
                      {sharingId === msg.id ? 'Génération...' : 'Partager en story'}
                    </button>
                    <button
                      id={`delete-msg-${msg.id}`}
                      onClick={() => deleteMessage(msg.id)}
                      className="ws-press flex items-center gap-1.5 text-xs mt-2 px-3 py-1.5 rounded-lg hover:opacity-80"
                      style={{ color: '#c87a7a' }}
                    >
                      <Trash2 size={12} />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom navigation menu */}
      <BottomNav unreadCount={unreadCount} />
    </div>
  )
}
