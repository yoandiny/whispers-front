import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquareText } from 'lucide-react'
import api from '@/lib/api'
import { BottomNav } from '@/components/shared/BottomNav'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import { useMessages } from '@/hooks/useMessages'

interface ConvListItem {
  id: string
  anonName: string
  createdAt: string
  unreadCount: number
  lastMessage: { content: string; sender: string; createdAt: string } | null
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
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

export function ConversationsListPage() {
  const navigate = useNavigate()
  const [convs, setConvs] = useState<ConvListItem[]>([])
  const [loading, setLoading] = useState(true)
  const { unreadCount: inboxUnread } = useMessages()

  useEffect(() => {
    api.get('/api/conversations/owner')
      .then(res => { setConvs(res.data.data); setLoading(false) })
      .catch(() => { setLoading(false) })
  }, [])

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen pb-24" style={{ background: BG, fontFamily: 'var(--font-sans)' }}>
      <BackgroundBlobs />
      {/* Texture grain */}
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat', backgroundSize: '128px',
        }}
      />

      {/* Header */}
      <div
        className="sticky top-0 z-10 px-5 py-4"
        style={{
          background: 'rgba(250, 246, 240, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(44,26,19,0.06)',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-gothic)', fontSize: '1.4rem', color: BROWN }}>
          Conversations
        </h1>
      </div>

      {/* List */}
      <div className="px-5 pt-5 relative z-10">
        {convs.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquareText size={32} className="mx-auto mb-4" style={{ color: 'rgba(44,26,19,0.15)' }} />
            <p className="text-sm font-medium" style={{ color: MUTED, fontFamily: 'var(--font-syne)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aucune conversation en cours</p>
            <p className="text-xs mt-1.5" style={{ color: '#C4A89E', fontFamily: 'var(--font-sans)' }}>Les gens peuvent en démarrer via ton lien.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {convs.map((c) => (
              <div 
                key={c.id} 
                onClick={() => navigate(`/conversations/${c.id}`)}
                className="card-explosive rounded-2xl cursor-pointer p-4 flex items-center gap-3 animate-fade-up"
                style={{
                  background: '#FFF8F5',
                  border: '1px solid rgba(44,26,19,0.06)',
                  boxShadow: '0 2px 8px rgba(44,26,19,0.04)',
                }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(192,57,43,0.08)', color: RED }}
                >
                  <span style={{ fontFamily: 'var(--font-gothic)', fontSize: '1.1rem', fontWeight: 900 }}>
                    {c.anonName[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold" style={{ color: BROWN, fontFamily: 'var(--font-sans)', fontSize: '0.95rem' }}>{c.anonName}</span>
                    <span className="text-xs" style={{ color: MUTED, fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                      {timeAgo(c.lastMessage?.createdAt || c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm truncate" style={{ color: c.unreadCount > 0 ? BROWN : MUTED, fontFamily: 'var(--font-sans)', fontWeight: c.unreadCount > 0 ? 600 : 400 }}>
                    {c.lastMessage ? (
                      <>
                        {c.lastMessage.sender === 'owner' ? <span style={{ opacity: 0.7 }}>Vous: </span> : ''}
                        {c.lastMessage.content}
                      </>
                    ) : (
                      <span style={{ fontStyle: 'italic' }}>Nouvelle conversation</span>
                    )}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: RED, boxShadow: '0 2px 6px rgba(192,57,43,0.4)' }}
                  >
                    <span className="text-[10px] font-black text-[#FFF8F5] pb-0.5" style={{ fontFamily: 'var(--font-serif)' }}>{c.unreadCount}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav unreadCount={inboxUnread} />
    </div>
  )
}
