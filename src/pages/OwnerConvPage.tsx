import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { useConvSSE } from '@/hooks/useConvSSE'
import { LoadingScreen } from '@/components/shared/LoadingScreen'

interface Message {
  id: string
  content: string
  sender: 'anon' | 'owner'
  createdAt: string
}

interface Conversation {
  id: string
  recipient_id: string
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
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0e0e0f' }}>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.8rem', color: '#ede8e1' }}>Conversation introuvable</h2>
        <button onClick={() => navigate('/conversations')} className="mt-6 px-4 py-2 bg-[#1e1e20] text-[#ede8e1] rounded-lg">Retour</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0e0e0f', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-5 py-4 flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)]" style={{ background: '#0e0e0f' }}>
        <button onClick={() => navigate('/conversations')} className="p-2 -ml-2 text-[#7a756d] hover:text-[#ede8e1]">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.4rem', color: '#ede8e1', lineHeight: 1 }}>Anonyme</h1>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {conv.messages.map((m, i) => {
          const isOwner = m.sender === 'owner'
          return (
            <div key={m.id || i} className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                style={{
                  background: isOwner ? '#c8aa82' : '#1e1e20',
                  color: isOwner ? '#0e0e0f' : '#ede8e1',
                  borderBottomRightRadius: isOwner ? '4px' : '16px',
                  borderBottomLeftRadius: isOwner ? '16px' : '4px',
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
      <div className="p-4 border-t border-[rgba(255,255,255,0.06)] bg-[#0e0e0f]">
        <div className="flex items-end gap-2 bg-[#161618] border border-[rgba(255,255,255,0.08)] rounded-xl p-2 focus-within:border-[rgba(200,170,130,0.4)] transition-colors">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Répondre..."
            className="flex-1 bg-transparent resize-none outline-none text-sm text-[#ede8e1] px-2 py-1 max-h-32"
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
            className="p-2 rounded-lg bg-[#c8aa82] text-[#0e0e0f] disabled:opacity-50 disabled:bg-[#2a2a2c] disabled:text-[#7a756d] transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
