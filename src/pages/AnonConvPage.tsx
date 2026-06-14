import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, ArrowLeft, Bell, BellOff } from 'lucide-react'
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

// ─── Push helper (no auth needed) ────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

type PushState = 'idle' | 'subscribing' | 'subscribed' | 'denied' | 'unsupported' | 'error'

async function subscribeAnonPush(token: string): Promise<PushState> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported'
  }
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return 'denied'

    let reg = await navigator.serviceWorker.getRegistration('/sw.js')
    if (!reg) reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const { data } = await api.get('/api/notifications/vapid-public-key')
    const publicKey: string | null = data?.data?.publicKey
    if (!publicKey) return 'error'

    const existing = await reg.pushManager.getSubscription()
    const subscription =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }))

    await api.post(`/api/conversations/token/${token}/subscribe-push`, { subscription })
    return 'subscribed'
  } catch {
    return 'error'
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

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
    if (!token) {
      navigate('/', { replace: true })
      return
    }

    api.get(`/api/conversations/token/${token}`)
      .then(res => {
        setConv(res.data.data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [token, navigate])

  // Auto-subscribe to push once the conversation loads
  useEffect(() => {
    if (!conv || !token || pushAttempted.current) return
    pushAttempted.current = true

    // Only auto-prompt if not already denied
    if (!('Notification' in window) || Notification.permission === 'denied') {
      setPushState('denied')
      return
    }
    if (!('PushManager' in window)) {
      setPushState('unsupported')
      return
    }

    // If already granted, subscribe silently; otherwise prompt via the bell button
    if (Notification.permission === 'granted') {
      setPushState('subscribing')
      subscribeAnonPush(token).then(setPushState)
    } else {
      // Leave in 'idle' so the user can click the bell to enable
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
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0e0e0f' }}>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.8rem', color: '#ede8e1' }}>Conversation introuvable</h2>
        <p className="mt-2 text-sm text-[#7a756d]">Ce lien est invalide ou expiré.</p>
        <button onClick={() => navigate('/')} className="mt-6 px-4 py-2 bg-[#1e1e20] text-[#ede8e1] rounded-lg">Retour à l'accueil</button>
      </div>
    )
  }

  // Bell button state display
  const bellLabel =
    pushState === 'subscribed' ? 'Notifications activées ✓' :
    pushState === 'subscribing' ? 'Activation...' :
    pushState === 'denied' ? 'Notifications refusées' :
    pushState === 'unsupported' ? 'Push non supporté' :
    'Recevoir une notif si réponse'

  const bellActive = pushState === 'subscribed'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0e0e0f', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-5 py-4 flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)]" style={{ background: '#0e0e0f' }}>
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-[#7a756d] hover:text-[#ede8e1]">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.4rem', color: '#ede8e1', lineHeight: 1 }}>Conversation anonyme</h1>
          <span className="text-xs text-[#7a756d]">Ton identité est masquée</span>
        </div>
        {/* Push notification bell */}
        {pushState !== 'unsupported' && (
          <button
            onClick={handleEnablePush}
            disabled={bellActive || pushState === 'subscribing' || pushState === 'denied'}
            title={bellLabel}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: `1px solid ${bellActive ? 'rgba(200,170,130,0.3)' : 'rgba(255,255,255,0.08)'}`,
              background: bellActive ? 'rgba(200,170,130,0.12)' : '#1a1a1c',
              color: bellActive ? '#c8aa82' : pushState === 'denied' ? '#4a4540' : '#7a756d',
              flexShrink: 0,
              transition: 'all 0.15s',
              cursor: bellActive || pushState === 'denied' ? 'default' : 'pointer',
            }}
          >
            {pushState === 'denied' ? <BellOff size={16} /> : <Bell size={16} />}
          </button>
        )}
      </div>

      {/* Push CTA banner (only if idle — permission not yet asked) */}
      {pushState === 'idle' && (
        <button
          onClick={handleEnablePush}
          className="w-full flex items-center gap-2 px-5 py-2.5 text-xs"
          style={{
            background: 'rgba(200,170,130,0.07)',
            borderBottom: '1px solid rgba(200,170,130,0.12)',
            color: '#c8aa82',
          }}
        >
          <Bell size={13} />
          🔔 Active les notifications pour être alerté(e) si on te répond
        </button>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {conv.messages.map((m, i) => {
          const isAnon = m.sender === 'anon'
          return (
            <div key={m.id || i} className={`flex ${isAnon ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                style={{
                  background: isAnon ? '#c8aa82' : '#1e1e20',
                  color: isAnon ? '#0e0e0f' : '#ede8e1',
                  borderBottomRightRadius: isAnon ? '4px' : '16px',
                  borderBottomLeftRadius: isAnon ? '16px' : '4px',
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
            placeholder="Écrire un message..."
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
