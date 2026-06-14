import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquareText } from 'lucide-react'
import api from '@/lib/api'
import { BottomNav } from '@/components/shared/BottomNav'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import { useMessages } from '@/hooks/useMessages'

interface ConvListItem {
  id: string
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

export function ConversationsListPage() {
  const navigate = useNavigate()
  const [convs, setConvs] = useState<ConvListItem[]>([])
  const [loading, setLoading] = useState(true)
  const { unreadCount: inboxUnread } = useMessages()

  useEffect(() => {
    api.get('/api/conversations/owner')
      .then(res => {
        setConvs(res.data.data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0e0e0f', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-5 py-4" style={{ background: '#0e0e0f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.4rem', color: '#ede8e1' }}>Conversations</h1>
      </div>

      {/* List */}
      <div className="px-5 pt-4">
        {convs.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquareText size={32} className="mx-auto mb-3 text-[#2a2a2c]" />
            <p className="text-sm text-[#4a4540]">Aucune conversation en cours</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {convs.map((c) => (
              <div 
                key={c.id} 
                onClick={() => navigate(`/conversations/${c.id}`)}
                className="ws-lift rounded-xl cursor-pointer p-4 flex items-center gap-3"
                style={{ background: '#161618', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1e1e20] text-[#7a756d] flex-shrink-0">
                  <MessageSquareText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#ede8e1]">Anonyme</span>
                    <span className="text-xs text-[#7a756d]">
                      {timeAgo(c.lastMessage?.createdAt || c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-[#7a756d] truncate">
                    {c.lastMessage ? (
                      <>
                        {c.lastMessage.sender === 'owner' ? 'Vous: ' : ''}
                        {c.lastMessage.content}
                      </>
                    ) : (
                      'Nouvelle conversation'
                    )}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[#c8aa82] flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#0e0e0f]">{c.unreadCount}</span>
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
