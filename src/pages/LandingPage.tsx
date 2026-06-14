import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, MessageCircle, Lock } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { LoadingScreen } from '@/components/shared/LoadingScreen'

export function LandingPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isAdmin, loading: authLoading, login } = useAuth()

  // Already logged in? Skip the login screen entirely.
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? (isAdmin ? '/admin' : '/home'), { replace: true })
    }
  }, [authLoading, isAuthenticated, isAdmin, location.state, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedUsername = username.trim().replace(/^@/, '')
    if (!trimmedUsername || !password) return

    setIsLoading(true)
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'

    try {
      const res = await api.post(endpoint, {
        username: trimmedUsername,
        password,
      })

      const { token, user } = res.data.data

      // Persist the session through the auth layer
      login(token, user)

      toast.success(isLogin ? 'Bienvenue de retour !' : 'Compte créé avec succès !')
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? (user.role === 'admin' ? '/admin' : '/home'), { replace: true })
    } catch (err: any) {
      const message = err.response?.data?.message || 'Une erreur est survenue'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const isValid = username.trim().length > 0 && password.length >= 4

  // While validating an existing session, avoid flashing the login form
  if (authLoading || isAuthenticated) return <LoadingScreen />

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#0e0e0f', fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-xs text-center animate-fade-up">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-8 animate-pop"
          style={{ background: 'rgba(200,170,130,0.08)', border: '1px solid rgba(200,170,130,0.15)' }}
        >
          <MessageCircle size={22} style={{ color: '#c8aa82' }} />
        </div>

        {/* Heading */}
        <h1
          className="mb-2"
          style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.4rem', color: '#ede8e1', lineHeight: 1.1 }}
        >
          Whispers
        </h1>
        <p className="mb-10 text-sm" style={{ color: '#7a756d', lineHeight: 1.7 }}>
          Receive anonymous messages from anyone. Honest. Human. Private.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div
            className="flex items-center rounded-xl overflow-hidden transition-colors"
            style={{ background: '#161618', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span className="pl-4 pr-1" style={{ color: '#4a4540', fontSize: '0.95rem' }}>
              @
            </span>
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
              placeholder="your username"
              className="flex-1 bg-transparent outline-none py-3 pr-4"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.95rem',
                color: '#ede8e1',
              }}
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div
            className="flex items-center rounded-xl overflow-hidden transition-colors"
            style={{ background: '#161618', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span className="pl-4 pr-2" style={{ color: '#4a4540' }}>
              <Lock size={15} />
            </span>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="flex-1 bg-transparent outline-none py-3 pr-4"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.95rem',
                color: '#ede8e1',
              }}
              disabled={isLoading}
            />
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={!isValid || isLoading}
            className="ws-press w-full py-3 rounded-xl flex items-center justify-center gap-2 mt-2"
            style={{
              background: isValid && !isLoading ? '#c8aa82' : '#1e1e20',
              color: isValid && !isLoading ? '#0e0e0f' : '#3a3a3c',
              fontWeight: 500,
              cursor: isValid && !isLoading ? 'pointer' : 'not-allowed',
            }}
          >
            {isLoading ? 'Patientez...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
            {!isLoading && <ArrowRight size={15} />}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          disabled={isLoading}
          className="ws-press mt-8 text-xs" 
          style={{ color: '#7a756d' }}
        >
          {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </button>
      </div>
    </div>
  )
}
