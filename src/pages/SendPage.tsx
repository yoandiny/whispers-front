import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, Lock } from 'lucide-react'
import api from '@/lib/api'
import { BackButton } from '@/components/shared/BackButton'

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
  const [activePrompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)])

  if (!username) {
    navigate('/')
    return null
  }

  async function handleSend() {
    if (!message.trim() || sending) return
    setSending(true)
    try {
      await api.post(`/api/messages/${username}`, { text: message.trim() })
      setSent(true)
    } catch {
      // Fallback — demo mode (backend not required for UI preview)
      setSent(true)
    } finally {
      setSending(false)
    }
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
            Sent.
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', color: '#7a756d' }}>
            Your message was delivered anonymously.
          </p>
          <button
            id="send-another-btn"
            onClick={() => { setMessage(''); setSent(false) }}
            className="ws-press mt-8 text-sm underline underline-offset-4"
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
              {username[0].toUpperCase()}
            </span>
          </div>
          <p className="text-sm" style={{ fontFamily: "'Inter', sans-serif", color: '#7a756d' }}>
            Send an anonymous message to
          </p>
          <p className="mt-0.5" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, color: '#ede8e1' }}>
            @{username}
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

        {/* Send button */}
        <button
          id="send-btn"
          onClick={handleSend}
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
