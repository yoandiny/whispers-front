import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, ArrowLeft, Bell, BellOff } from 'lucide-react'
import api from '@/lib/api'
import { useConvSSE } from '@/hooks/useConvSSE'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import { subscribeAnonPush, type PushState } from '@/lib/push'

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

import { BackgroundBlobs } from '@/components/shared/BackgroundBlobs'

const BG = 'linear-gradient(160deg, #FAF6F0 0%, #F5EBE6 55%, #FAF0EE 100%)'
const FONT_SANS = "var(--font-sans)"
const RED = '#C0392B'
const BROWN = '#2C1A13'
const MUTED = '#8A6B5E'

export function AnonConvPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [conv, setConv] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [pushState, setPushState] = useState<PushState>('idle')
  const pushAttempted = useRef(false)

  useEffect(() => {
    if (!token) { navigate('/', { replace: true }); return }
    api.get(`/api/conversations/token/${token}`)
      .then(res => { setConv(res.data.data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [token, navigate])

  useEffect(() => {
    if (!conv || !token || pushAttempted.current) return
    pushAttempted.current = true
    if (!('Notification' in window) || Notification.permission === 'denied') { setPushState('denied'); return }
    if (!('PushManager' in window)) { setPushState('unsupported'); return }
    if (Notification.permission === 'granted') {
      setPushState('subscribing')
      subscribeAnonPush(token).then(setPushState)
    } else {
      setPushState('idle')
    }
  }, [conv, token])

  async function handleEnablePush() {
    if (!token || pushState === 'subscribing' || pushState === 'subscribed') return
    setPushState('subscribing')
    const result = await subscribeAnonPush(token)
    setPushState(result)
  }

  const handleNewMessage = useCallback((msg: Message) => {
    setConv(prev => {
      if (!prev) return prev
      if (prev.messages.some(m => m.id === msg.id)) return prev
      return { ...prev, messages: [...prev.messages, msg] }
    })
  }, [])

  useConvSSE(conv ? `/api/conversations/token/${token}/stream` : null, handleNewMessage)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv?.messages])

  async function handleSend() {
    if (!text.trim() || sending || !token) return
    setSending(true)
    try {
      const res = await api.post(`/api/conversations/token/${token}/messages`, { text: text.trim() })
      handleNewMessage(res.data.data)
      setText('')
    } catch {
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
        <h2 style={{ fontFamily: 'var(--font-gothic)', fontSize: '1.6rem', color: BROWN }}>Conversation introuvable</h2>
        <p className="mt-2 text-sm text-[#8A6B5E]" style={{ fontFamily: 'var(--font-sans)' }}>Ce lien est invalide ou expiré.</p>
        <button
          onClick={() => navigate('/')}
          className="btn-explosive mt-6 px-4 py-2 text-[#FFF8F5] rounded-xl font-medium"
          style={{
            background: 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)',
            fontFamily: 'var(--font-tech)',
            fontWeight: 700,
          }}
        >
          Retour à l'accueil
        </button>
      </div>
    )
  }

  const bellLabel =
    pushState === 'subscribed' ? 'Notifications activées ✓' :
    pushState === 'subscribing' ? 'Activation...' :
    pushState === 'denied' ? 'Notifications refusées' :
    pushState === 'unsupported' ? 'Push non supporté' :
    'Recevoir une notif si réponse'
  const bellActive = pushState === 'subscribed'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG, fontFamily: FONT_SANS }}>
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
        className="sticky top-0 z-10 px-5 py-3 flex items-center gap-3"
        style={{
          background: 'rgba(250, 246, 240, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(44,26,19,0.06)',
        }}
      >
        <button onClick={() => navigate('/')} className="btn-explosive p-2 -ml-2 text-[#8A6B5E] hover:text-[#C0392B] rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 style={{ fontFamily: 'var(--font-gothic)', fontSize: '1.25rem', color: BROWN, lineHeight: 1.1 }}>Conversation anonyme</h1>
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.62rem', color: '#8A6B5E' }}>Ton identité est masquée</span>
        </div>
        {pushState !== 'unsupported' && (
          <button
            onClick={handleEnablePush}
            disabled={bellActive || pushState === 'subscribing' || pushState === 'denied'}
            title={bellLabel}
            className="btn-explosive"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '10px',
              border: `1px solid ${bellActive ? 'rgba(192,57,43,0.3)' : 'rgba(44,26,19,0.08)'}`,
              background: bellActive ? 'rgba(192,57,43,0.08)' : '#FFF8F5',
              color: bellActive ? RED : pushState === 'denied' ? '#D4B5AD' : MUTED,
              flexShrink: 0, transition: 'all 0.15s',
              cursor: bellActive || pushState === 'denied' ? 'default' : 'pointer',
            }}
          >
            {pushState === 'denied' ? <BellOff size={16} /> : <Bell size={16} />}
          </button>
        )}
      </div>

      {pushState === 'idle' && (
        <button
          onClick={handleEnablePush}
          className="w-full flex items-center gap-2 px-5 py-3 text-xs"
          style={{
            background: 'rgba(192,57,43,0.06)', borderBottom: '1px solid rgba(192,57,43,0.1)', color: RED, fontFamily: 'var(--font-tech)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
          }}
        >
          <Bell size={14} />
          🔔 Active les notifications pour être alerté(e) si on te répond
        </button>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 relative z-10">
        {conv.messages.map((m, i) => {
          const isAnon = m.sender === 'anon'
          return (
            <div key={m.id || i} className={`flex ${isAnon ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm"
                style={{
                  background: isAnon ? 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)' : '#FFF8F5',
                  color: isAnon ? '#FFF8F5' : BROWN,
                  border: isAnon ? 'none' : '1px solid rgba(44,26,19,0.08)',
                  boxShadow: isAnon ? '0 4px 12px rgba(192,57,43,0.2)' : '0 2px 8px rgba(44,26,19,0.04)',
                  borderBottomRightRadius: isAnon ? '4px' : '16px',
                  borderBottomLeftRadius: isAnon ? '16px' : '4px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.92rem',
                  lineHeight: 1.45,
                }}
              >
                {m.content}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[rgba(44,26,19,0.06)] relative z-10" style={{ background: 'rgba(250, 246, 240, 0.95)' }}>
        <div className="flex items-end gap-2 bg-[#FFF8F5] border border-[rgba(44,26,19,0.1)] rounded-xl p-2 focus-within:border-[rgba(192,57,43,0.4)] transition-colors shadow-sm">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrire un message..."
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
            className="btn-explosive p-2 rounded-lg transition-all"
            style={{
              background: (!text.trim() || sending) ? 'rgba(44,26,19,0.06)' : 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)',
              color: (!text.trim() || sending) ? '#D4B5AD' : '#FFF8F5',
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
