import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, Lock } from 'lucide-react'
import api from '@/lib/api'
import { BackButton } from '@/components/shared/BackButton'
import { LoadingScreen } from '@/components/shared/LoadingScreen'

const PROMPTS = [
  'What do you really think of me?',
  "Tell me something you've never said out loud.",
  "What's your honest first impression?",
  'Ask me anything.',
  "What's a secret you'd share anonymously?",
]

export function SendPage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [validatingUser, setValidatingUser] = useState(true)
  const [recipientExists, setRecipientExists] = useState(false)
  const [recipientUsername, setRecipientUsername] = useState('')
  const [convToken, setConvToken] = useState<string | null>(null)
  const [activePrompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)])

  useEffect(() => {
    if (!username) {
      navigate('/', { replace: true })
      return
    }

    let active = true

    async function validateRecipient() {
      setValidatingUser(true)
      setRecipientExists(false)

      try {
        const res = await api.get(`/api/auth/public/${username}`)
        if (!active) return
        setRecipientUsername(res.data.data.username)
        setRecipientExists(true)
      } catch {
        if (!active) return
        setRecipientExists(false)
      } finally {
        if (active) setValidatingUser(false)
      }
    }

    validateRecipient()

    return () => {
      active = false
    }
  }, [navigate, username])

  async function handleSend(asConversation = false) {
    if (!recipientExists || !message.trim() || sending) return
    setSending(true)
    try {
      if (asConversation) {
        const res = await api.post(`/api/conversations`, { username: recipientUsername, text: message.trim() })
        setConvToken(res.data.data.token)
      } else {
        await api.post(`/api/messages/${recipientUsername}`, { text: message.trim() })
      }
      setSent(true)
    } catch (error: any) {
      if (error.response?.status === 404) {
        setRecipientExists(false)
        return
      }
      if (error.response?.status === 429) {
        alert(error.response.data.message || 'Trop de requêtes, veuillez patienter.')
      }
    } finally {
      setSending(false)
    }
  }

  if (validatingUser) return <LoadingScreen />

  if (!recipientExists) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0e0e0f' }}>
        <div className="w-full max-w-sm text-center animate-fade-up">
          <div className="mb-8">
            <BackButton to="/" />
          </div>
          <h2
            className="mb-3"
            style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.8rem', color: '#ede8e1' }}
          >
            Compte introuvable
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', color: '#7a756d', lineHeight: 1.7 }}>
            Le lien @{username} ne correspond à aucun utilisateur Whispers.
          </p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="ws-press mt-8 px-5 py-3 rounded-xl text-sm"
            style={{ background: '#c8aa82', color: '#0e0e0f', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0e0e0f' }}>
        <div className="w-full max-w-sm text-center animate-fade-up">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 animate-pop"
            style={{ background: 'rgba(200,170,130,0.1)', border: '1px solid rgba(200,170,130,0.2)' }}
          >
            <Send size={20} style={{ color: '#c8aa82' }} />
          </div>
          <h2
            className="mb-2"
            style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.6rem', color: '#ede8e1' }}
          >
            {convToken ? 'Conversation créée.' : 'Sent.'}
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', color: '#7a756d', marginBottom: convToken ? '1.5rem' : '0' }}>
            {convToken 
              ? "Votre message a été envoyé. Voici le lien unique pour y accéder à tout moment :"
              : "Your message was delivered anonymously."}
          </p>

          {convToken && (
            <div className="mb-4 text-left p-4 rounded-xl" style={{ background: '#161618', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs mb-1.5" style={{ color: '#c87a7a', fontWeight: 500 }}>
                ⚠️ Sauvegarde ce lien, il ne sera plus affiché.
              </p>
              <div className="flex items-center justify-between gap-2 mb-3">
                <code className="text-xs truncate flex-1" style={{ color: '#ede8e1', background: '#0e0e0f', padding: '6px 8px', borderRadius: '6px' }}>
                  {window.location.origin}/c/{convToken}
                </code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/c/${convToken}`)
                  }}
                  className="ws-press px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: '#2a2a2c', color: '#c8aa82' }}
                >
                  Copier
                </button>
              </div>
              <button
                onClick={() => navigate(`/c/${convToken}`)}
                className="ws-press w-full py-2.5 rounded-lg text-sm"
                style={{ background: 'rgba(200,170,130,0.1)', color: '#c8aa82', border: '1px solid rgba(200,170,130,0.2)' }}
              >
                Accéder à la conversation
              </button>
            </div>
          )}

          <button
            id="send-another-btn"
            onClick={() => { setMessage(''); setSent(false); setConvToken(null) }}
            className="ws-press mt-4 text-sm underline underline-offset-4"
            style={{ color: '#c8aa82', fontFamily: "'Inter', sans-serif" }}
          >
            Envoyer un autre message
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#0e0e0f' }}>
      <div className="w-full max-w-sm animate-fade-up">
        {/* Back button */}
        <div className="mb-8">
          <BackButton to="/" />
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, #2a2420 0%, #1e1a16 100%)',
              border: '1px solid rgba(200,170,130,0.2)',
            }}
          >
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.5rem', color: '#c8aa82' }}>
              {recipientUsername[0].toUpperCase()}
            </span>
          </div>
          <p className="text-sm" style={{ fontFamily: "'Inter', sans-serif", color: '#7a756d' }}>
            Send an anonymous message to
          </p>
          <p className="mt-0.5" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, color: '#ede8e1' }}>
            @{recipientUsername}
          </p>
        </div>

        {/* Prompt hint */}
        <p
          className="text-center mb-4 italic"
          style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1rem', color: '#7a756d' }}
        >
          "{activePrompt}"
        </p>

        {/* Textarea */}
        <textarea
          id="message-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write something honest..."
          rows={5}
          maxLength={300}
          className="w-full resize-none outline-none rounded-xl px-4 py-3 transition-all"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.95rem',
            background: '#161618',
            border: '1px solid rgba(255,255,255,0.08)',
            lineHeight: '1.6',
            color: '#ede8e1',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(200,170,130,0.4)')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
        />
        <div className="flex justify-between items-center mt-1 mb-5">
          <span className="text-xs" style={{ color: '#4a4540', fontFamily: "'Inter', sans-serif" }}>
            {message.length}/300
          </span>
        </div>

        {/* Send buttons */}
        <div className="flex flex-col gap-3">
          <button
            id="send-btn"
            onClick={() => handleSend(false)}
            disabled={!message.trim() || sending}
            className="ws-press w-full py-3 rounded-xl flex items-center justify-center gap-2"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              background: message.trim() && !sending ? '#c8aa82' : '#1e1e20',
              color: message.trim() && !sending ? '#0e0e0f' : '#4a4540',
              cursor: message.trim() && !sending ? 'pointer' : 'not-allowed',
            }}
          >
            <Send size={15} />
            {sending ? 'Sending...' : 'Send anonymously'}
          </button>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}></div>
            <span className="flex-shrink-0 mx-4 text-xs" style={{ color: '#7a756d' }}>Ou bien</span>
            <div className="flex-grow border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}></div>
          </div>

          <button
            id="send-conv-btn"
            onClick={() => handleSend(true)}
            disabled={!message.trim() || sending}
            className="ws-press w-full py-3 rounded-xl flex items-center justify-center gap-2 border"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              background: message.trim() && !sending ? 'rgba(200,170,130,0.08)' : 'transparent',
              color: message.trim() && !sending ? '#c8aa82' : '#4a4540',
              borderColor: message.trim() && !sending ? 'rgba(200,170,130,0.2)' : 'rgba(255,255,255,0.06)',
              cursor: message.trim() && !sending ? 'pointer' : 'not-allowed',
            }}
          >
            Démarrer une conversation anonyme
          </button>
        </div>

        {/* Privacy note */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <Lock size={11} style={{ color: '#4a4540' }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', color: '#4a4540' }}>
            100% anonymous — your identity is never revealed
          </span>
        </div>
      </div>
    </div>
  )
}
