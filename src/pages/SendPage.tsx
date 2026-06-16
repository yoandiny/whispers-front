import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, Lock, Bell, BellOff } from 'lucide-react'
import api from '@/lib/api'
import { BackButton } from '@/components/shared/BackButton'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import { subscribeAnonPush, type PushState } from '@/lib/push'
import { BackgroundBlobs } from '@/components/shared/BackgroundBlobs'

const PROMPTS = [
  'What do you really think of me?',
  "Tell me something you've never said out loud.",
  "What's your honest first impression?",
  'Ask me anything.',
  "What's a secret you'd share anonymously?",
]

const BG = 'linear-gradient(160deg, #FAF6F0 0%, #F5EBE6 55%, #FAF0EE 100%)'
const FONT_SERIF = "var(--font-serif)"
const FONT_SANS = "var(--font-sans)"
const RED = '#C0392B'
const BROWN = '#2C1A13'
const MUTED = '#8A6B5E'

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
  const [pushState, setPushState] = useState<PushState>('idle')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!convToken) { setPushState('idle'); return }
    if (!('Notification' in window) || Notification.permission === 'denied') { setPushState('denied'); return }
    if (!('PushManager' in window)) { setPushState('unsupported'); return }
    if (Notification.permission === 'granted') {
      setPushState('subscribing')
      subscribeAnonPush(convToken).then(setPushState)
    }
  }, [convToken])

  async function handleEnablePush() {
    if (!convToken || pushState === 'subscribing' || pushState === 'subscribed') return
    setPushState('subscribing')
    const result = await subscribeAnonPush(convToken)
    setPushState(result)
  }

  useEffect(() => {
    if (!username) { navigate('/', { replace: true }); return }
    let active = true
    async function validateRecipient() {
      setValidatingUser(true); setRecipientExists(false)
      try {
        const res = await api.get(`/api/auth/public/${username}`)
        if (!active) return
        setRecipientUsername(res.data.data.username); setRecipientExists(true)
      } catch {
        if (!active) return
        setRecipientExists(false)
      } finally {
        if (active) setValidatingUser(false)
      }
    }
    validateRecipient()
    return () => { active = false }
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
      if (error.response?.status === 404) { setRecipientExists(false); return }
      if (error.response?.status === 429) {
        alert(error.response.data.message || 'Trop de requêtes, veuillez patienter.')
      }
    } finally {
      setSending(false)
    }
  }

  if (validatingUser) return <LoadingScreen />

  /* ── Compte introuvable ── */
  if (!recipientExists) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: BG }}>
        <div className="w-full max-w-sm text-center animate-fade-up">
          <div className="mb-8"><BackButton to="/" /></div>
          <h2 className="mb-3" style={{ fontFamily: FONT_SERIF, fontSize: '1.8rem', color: BROWN }}>
            Compte introuvable
          </h2>
          <p style={{ fontSize: '0.9rem', color: MUTED, lineHeight: 1.7 }}>
            Le lien @{username} ne correspond à aucun utilisateur Whispers.
          </p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="ws-press mt-8 px-6 py-3 rounded-xl text-sm"
            style={{
              background: 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)',
              color: '#FFF8F5', fontWeight: 600,
              boxShadow: '0 6px 20px rgba(192,57,43,0.3)',
            }}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  /* ── Message envoyé ── */
  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: BG, fontFamily: FONT_SANS }}>
        <BackgroundBlobs />
        {/* Grain */}
        <div
          style={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat', backgroundSize: '128px',
          }}
        />
        <div className="w-full max-w-sm text-center animate-fade-up" style={{ position: 'relative', zIndex: 1 }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-pop"
            style={{
              background: 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)',
              boxShadow: '0 8px 24px rgba(192,57,43,0.3)',
            }}
          >
            <Send size={20} style={{ color: '#FFF8F5' }} />
          </div>
          <h2 className="mb-2" style={{ fontFamily: FONT_SERIF, fontSize: '1.8rem', color: BROWN, fontWeight: 700 }}>
            {convToken ? 'Conversation créée.' : 'Envoyé.'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: MUTED, marginBottom: convToken ? '1.5rem' : '0', lineHeight: 1.7 }}>
            {convToken
              ? 'Votre message a été envoyé. Voici le lien unique pour y accéder à tout moment :'
              : 'Ton message a été livré anonymement.'}
          </p>

          {convToken && (
            <div
              className="mb-4 text-left p-4 rounded-2xl"
              style={{
                background: '#FFF8F5',
                border: '1px solid rgba(44,26,19,0.08)',
                boxShadow: '0 2px 12px rgba(44,26,19,0.07)',
              }}
            >
              <p className="text-xs mb-2" style={{ color: '#C0392B', fontWeight: 600 }}>
                ⚠️ Sauvegarde ce lien, il ne sera plus affiché.
              </p>
              <div className="flex items-center justify-between gap-2 mb-3">
                <code
                  className="text-xs truncate flex-1"
                  style={{ color: BROWN, background: '#F5EBE6', padding: '6px 8px', borderRadius: '8px' }}
                >
                  {window.location.origin}/c/{convToken}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/c/${convToken}`)}
                  className="btn-explosive px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: BROWN, color: '#FFF8F5', fontWeight: 500 }}
                >
                  Copier
                </button>
              </div>
              <button
                onClick={() => navigate(`/c/${convToken}`)}
                className="btn-explosive w-full py-2.5 rounded-xl text-sm mb-3"
                style={{
                  background: 'rgba(192,57,43,0.08)',
                  color: RED,
                  border: '1px solid rgba(192,57,43,0.2)',
                  fontWeight: 500,
                }}
              >
                Accéder à la conversation
              </button>

              {pushState !== 'unsupported' && pushState !== 'subscribed' && (
                <button
                  onClick={handleEnablePush}
                  disabled={pushState === 'subscribing' || pushState === 'denied'}
                  className="btn-explosive w-full py-2.5 flex items-center justify-center gap-2 rounded-xl text-sm"
                  style={{
                    background: pushState === 'denied' ? 'rgba(44,26,19,0.04)' : 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)',
                    color: pushState === 'denied' ? MUTED : '#FFF8F5',
                    cursor: pushState === 'denied' ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                    boxShadow: pushState !== 'denied' ? '0 4px 14px rgba(192,57,43,0.25)' : 'none',
                  }}
                >
                  {pushState === 'denied' ? <BellOff size={16} /> : <Bell size={16} />}
                  {pushState === 'subscribing' ? 'Activation...' : pushState === 'denied' ? 'Notifications refusées' : "M'alerter si on me répond"}
                </button>
              )}
              {pushState === 'subscribed' && (
                <div
                  className="w-full py-2.5 flex items-center justify-center gap-2 rounded-xl text-sm"
                  style={{ color: RED, background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)' }}
                >
                  <Bell size={16} />
                  Notifications activées ✓
                </div>
              )}
            </div>
          )}

          <button
            id="send-another-btn"
            onClick={() => { setMessage(''); setSent(false); setConvToken(null) }}
            className="btn-explosive mt-4 text-sm"
            style={{ color: RED, textDecoration: 'underline', textUnderlineOffset: '4px' }}
          >
            Envoyer un autre message
          </button>
        </div>
      </div>
    )
  }

  /* ── Formulaire principal ── */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: BG, fontFamily: FONT_SANS }}>
      <BackgroundBlobs />
      {/* Grain */}
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat', backgroundSize: '128px',
        }}
      />
      <div className="w-full max-w-sm animate-fade-up" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mb-8"><BackButton to="/" /></div>

        {/* Avatar destinataire */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-18 h-18 rounded-full flex items-center justify-center mb-4 animate-pop"
            style={{
              width: 72, height: 72,
              background: 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)',
              border: '3px solid rgba(192,57,43,0.2)',
              boxShadow: '0 8px 24px rgba(192,57,43,0.25)',
            }}
          >
            <span style={{ fontFamily: FONT_SERIF, fontSize: '1.8rem', color: '#FFF8F5', fontWeight: 700 }}>
              {recipientUsername[0] ? recipientUsername[0].toUpperCase() : ''}
            </span>
          </div>
          <p className="text-sm" style={{ color: MUTED }}>Message anonyme pour</p>
          <p className="mt-0.5 font-semibold animate-tracking-in" style={{ color: BROWN, fontSize: '1.1rem' }}>@{recipientUsername}</p>
        </div>

        {/* Prompt en italique serif */}
        <p
          className="text-center mb-5 px-2"
          style={{
            fontFamily: FONT_SERIF,
            fontStyle: 'italic',
            fontSize: '1.05rem',
            color: MUTED,
            lineHeight: 1.6,
          }}
        >
          "{activePrompt}"
        </p>

        {/* Textarea style papier à lettres */}
        <div
          style={{
            background: '#FFF8F5',
            border: `1.5px solid ${focused ? 'rgba(192,57,43,0.4)' : 'rgba(44,26,19,0.08)'}`,
            borderRadius: '16px',
            padding: '16px',
            boxShadow: focused ? '0 4px 20px rgba(192,57,43,0.1)' : '0 2px 12px rgba(44,26,19,0.06)',
            transition: 'all 0.2s',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Lignes horizontales subtiles style papier */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 16, right: 16,
                top: `${52 + i * 28}px`,
                height: '1px',
                background: 'rgba(44,26,19,0.04)',
              }}
            />
          ))}
          <textarea
            id="message-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écris quelque chose d'honnête..."
            rows={5}
            maxLength={300}
            className="w-full resize-none outline-none"
            style={{
              fontSize: '0.95rem',
              background: 'transparent',
              lineHeight: '1.75',
              color: BROWN,
              position: 'relative',
              zIndex: 1,
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
        <div className="flex justify-end mt-1 mb-5">
          <span className="text-xs" style={{ color: message.length > 260 ? RED : '#C4A89E' }}>
            {message.length}/300
          </span>
        </div>

        {/* Boutons d'envoi */}
        <div className="flex flex-col gap-3">
          <button
            id="send-btn"
            onClick={() => handleSend(false)}
            disabled={!message.trim() || sending}
            className="btn-explosive w-full py-3.5 rounded-xl flex items-center justify-center gap-2"
            style={{
              fontWeight: 600,
              fontSize: '0.95rem',
              background: message.trim() && !sending
                ? 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)'
                : 'rgba(44, 26, 19, 0.06)',
              color: message.trim() && !sending ? '#FFF8F5' : '#C4A89E',
              cursor: message.trim() && !sending ? 'pointer' : 'not-allowed',
              boxShadow: message.trim() && !sending ? '0 6px 20px rgba(192,57,43,0.28)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Send size={16} />
            {sending ? 'Envoi...' : 'Envoyer anonymement'}
          </button>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t" style={{ borderColor: 'rgba(44,26,19,0.07)' }} />
            <span className="flex-shrink-0 mx-4 text-xs" style={{ color: MUTED }}>ou bien</span>
            <div className="flex-grow border-t" style={{ borderColor: 'rgba(44,26,19,0.07)' }} />
          </div>

          <button
            id="send-conv-btn"
            onClick={() => handleSend(true)}
            disabled={!message.trim() || sending}
            className="btn-explosive w-full py-3.5 rounded-xl flex items-center justify-center gap-2 border"
            style={{
              fontWeight: 500,
              background: message.trim() && !sending ? 'rgba(192,57,43,0.06)' : 'transparent',
              color: message.trim() && !sending ? RED : '#C4A89E',
              borderColor: message.trim() && !sending ? 'rgba(192,57,43,0.2)' : 'rgba(44,26,19,0.07)',
              cursor: message.trim() && !sending ? 'pointer' : 'not-allowed',
            }}
          >
            Démarrer une conversation anonyme
          </button>
        </div>

        {/* Note confidentialité */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <Lock size={11} style={{ color: '#C4A89E' }} />
          <span style={{ fontSize: '0.72rem', color: '#C4A89E', letterSpacing: '0.01em' }}>
            100% anonyme — ton identité n'est jamais révélée
          </span>
        </div>
      </div>
    </div>
  )
}
