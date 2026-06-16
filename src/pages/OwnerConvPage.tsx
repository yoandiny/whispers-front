import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { useConvSSE } from '@/hooks/useConvSSE'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import { BackgroundBlobs } from '@/components/shared/BackgroundBlobs'

const BG = 'linear-gradient(160deg, #FAF6F0 0%, #F5EBE6 55%, #FAF0EE 100%)'
const RED = '#C0392B'
const BROWN = '#2C1A13'

interface Message {
  id: string
  content: string
  sender: 'anon' | 'owner'
  createdAt: string
}

interface Conversation {
  id: string
  recipient_id: string
  anonName: string
  created_at: string
  messages: Message[]
}

export function OwnerConvPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [conv, setConv] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Determine SSE URL with JWT token in query for auth
  const jwt = localStorage.getItem('whispers_token')
  const sseUrl = (conv && jwt) ? `/api/conversations/owner/${id}/stream?token=${jwt}` : null

  useEffect(() => {
    if (!id) {
      navigate('/conversations', { replace: true })
      return
    }

    api.get(`/api/conversations/owner/${id}`)
      .then(res => {
        setConv(res.data.data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [id, navigate])

  const handleNewMessage = useCallback((msg: Message) => {
    setConv(prev => {
      if (!prev) return prev
      if (prev.messages.some(m => m.id === msg.id)) return prev
      return { ...prev, messages: [...prev.messages, msg] }
    })
  }, [])

  useConvSSE(sseUrl, handleNewMessage)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv?.messages])

  async function handleSend() {
    if (!text.trim() || sending || !id) return
    setSending(true)
    try {
      const res = await api.post(`/api/conversations/owner/${id}/messages`, { text: text.trim() })
      handleNewMessage(res.data.data)
      setText('')
    } catch (err) {
      alert("Erreur lors de l'envoi du message")
    } finally {
      setSending(false)
    }
  }

  if (loading) return <LoadingScreen />

  if (error || !conv) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: BG }}>
        <BackgroundBlobs />
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: '1.8rem', color: BROWN, fontWeight: 700 }}>Conversation introuvable</h2>
        <button onClick={() => navigate('/conversations')} className="btn-explosive mt-6 px-4 py-2 bg-[#FFF8F5] text-red-600 border border-red-200 rounded-lg">Retour</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG, fontFamily: "var(--font-sans)" }}>
      <BackgroundBlobs />
      {/* Texture grain */}
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat', backgroundSize: '128px',
        }}
      />

      <div className="flex-1 flex flex-col" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3 border-b"
          style={{
            background: 'rgba(250, 246, 240, 0.85)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(44, 26, 19, 0.06)',
          }}
        >
          <button onClick={() => navigate('/conversations')} className="btn-explosive p-2 -ml-2 text-[#8A6B5E] hover:text-[#C0392B] rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontFamily: "var(--font-cursive)", fontSize: '1.65rem', color: BROWN, fontWeight: 700, lineHeight: 1.1 }}>
              {conv.anonName}
            </h1>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {conv.messages.map((m, i) => {
            const isOwner = m.sender === 'owner'
            return (
              <div key={m.id || i} className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm"
                  style={{
                    background: isOwner ? 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)' : '#FFF8F5',
                    color: isOwner ? '#FFF8F5' : BROWN,
                    border: isOwner ? 'none' : '1px solid rgba(44, 26, 19, 0.06)',
                    boxShadow: isOwner ? '0 4px 12px rgba(192, 57, 43, 0.15)' : '0 2px 8px rgba(44, 26, 19, 0.03)',
                    borderBottomRightRadius: isOwner ? '4px' : '16px',
                    borderBottomLeftRadius: isOwner ? '16px' : '4px',
                    fontFamily: isOwner ? 'var(--font-sans)' : 'var(--font-cursive)',
                    fontSize: isOwner ? '0.9rem' : '1.25rem',
                    lineHeight: isOwner ? '1.4' : '1.3',
                  }}
                >
                  {m.content}
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          className="p-4 border-t"
          style={{
            background: 'rgba(250, 246, 240, 0.85)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(44, 26, 19, 0.06)',
          }}
        >
          <div
            className="flex items-end gap-2 bg-[#FFF8F5] border rounded-xl p-2 transition-colors focus-within:border-[rgba(192,57,43,0.4)]"
            style={{ borderColor: 'rgba(44, 26, 19, 0.08)' }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Répondre..."
              className="flex-1 bg-transparent resize-none outline-none text-sm px-2 py-1 max-h-32"
              style={{ color: BROWN, fontFamily: 'var(--font-sans)' }}
              rows={1}
              maxLength={500}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="btn-explosive p-2 rounded-lg text-[#FFF8F5] disabled:opacity-50 disabled:bg-[#FAF6F0] disabled:text-[#8A6B5E] transition-colors"
              style={{ background: RED }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
