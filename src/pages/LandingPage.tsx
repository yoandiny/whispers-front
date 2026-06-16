import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Lock } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { LoadingScreen } from '@/components/shared/LoadingScreen'

/* Icône enveloppe scellée à la cire */
function SealIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="2" y="7" width="22" height="15" rx="3" fill="#FFF8F5" stroke="rgba(192,57,43,0.3)" strokeWidth="1.2"/>
      <path d="M2 10L13 17L24 10" stroke="rgba(192,57,43,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="13" cy="13" r="4" fill="#C0392B" opacity="0.9"/>
      <circle cx="13" cy="13" r="2" fill="#FFF8F5" opacity="0.6"/>
    </svg>
  )
}

import { BackgroundBlobs } from '@/components/shared/BackgroundBlobs'

export function LandingPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<'user' | 'pass' | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isAdmin, loading: authLoading, login } = useAuth()

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
      const res = await api.post(endpoint, { username: trimmedUsername, password })
      const { token, user } = res.data.data
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

  if (authLoading || isAuthenticated) return <LoadingScreen />

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background: 'linear-gradient(160deg, #FAF6F0 0%, #F5EBE6 55%, #FAF0EE 100%)',
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Background blobs */}
      <BackgroundBlobs />

      {/* Grain texture overlay */}
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat', backgroundSize: '128px',
        }}
      />

      <div className="w-full max-w-xs text-center animate-fade-up" style={{ position: 'relative', zIndex: 1 }}>
        {/* Icône sceau */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 animate-pop"
          style={{
            background: 'linear-gradient(135deg, #FFF8F5 0%, #F5EBE6 100%)',
            border: '1px solid rgba(192, 57, 43, 0.2)',
            boxShadow: '0 6px 24px rgba(192, 57, 43, 0.12)',
          }}
        >
          <SealIcon />
        </div>

        {/* Titre */}
        <h1
          className="mb-1 animate-tracking-in"
          style={{
            fontFamily: "var(--font-gothic)",
            fontSize: "2.2rem",
            color: '#2C1A13',
            lineHeight: 1.05,
          }}
        >
          {isLogin ? 'Bon retour.' : 'Rejoins-nous.'}
        </h1>
        <p className="mb-8 text-xs px-2" style={{ color: '#8A6B5E', fontFamily: 'var(--font-syne)', fontWeight: 700, lineHeight: 1.6 }}>
          {isLogin
            ? 'Connecte-toi pour retrouver tes messages anonymes.'
            : 'Crée ton compte et commence à recevoir des confessions.'}
        </p>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Champ username — style ligne soulignée */}
          <div style={{ position: 'relative' }}>
            <div
              className="flex items-center"
              style={{
                borderBottom: `2px solid ${focusedField === 'user' ? '#C0392B' : 'rgba(44, 26, 19, 0.15)'}`,
                transition: 'border-color 0.2s',
                paddingBottom: '6px',
              }}
            >
              <span style={{ color: '#C0392B', fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 900, marginRight: 4 }}>@</span>
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                placeholder="ton pseudo"
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: '1rem', color: '#2C1A13', fontFamily: 'var(--font-sans)' }}
                autoFocus
                disabled={isLoading}
                onFocus={() => setFocusedField('user')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div
              className="flex items-center"
              style={{
                borderBottom: `2px solid ${focusedField === 'pass' ? '#C0392B' : 'rgba(44, 26, 19, 0.15)'}`,
                transition: 'border-color 0.2s',
                paddingBottom: '6px',
              }}
            >
              <Lock size={14} style={{ color: '#8A6B5E', marginRight: 8, flexShrink: 0 }} />
              <input
                id="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mot de passe"
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: '1rem', color: '#2C1A13', fontFamily: 'var(--font-sans)' }}
                disabled={isLoading}
                onFocus={() => setFocusedField('pass')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={!isValid || isLoading}
            className="btn-explosive w-full py-3.5 rounded-xl flex items-center justify-center gap-2 mt-3"
            style={{
              background: isValid && !isLoading
                ? 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)'
                : 'rgba(44, 26, 19, 0.06)',
              color: isValid && !isLoading ? '#FFF8F5' : '#C4A89E',
              fontFamily: 'var(--font-tech)',
              fontWeight: 700,
              fontSize: '0.88rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: isValid && !isLoading ? 'pointer' : 'not-allowed',
              boxShadow: isValid && !isLoading ? '0 6px 20px rgba(192, 57, 43, 0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {isLoading ? 'Patientez…' : (isLogin ? 'Se connecter' : "S'inscrire")}
            {!isLoading && <ArrowRight size={16} />}
          </button>

          {!isLogin && (
            <p className="text-xs mt-1" style={{ color: '#8A6B5E', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
              Le mot de passe doit contenir au moins 4 caractères.
            </p>
          )}
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          disabled={isLoading}
          className="btn-explosive mt-8 text-sm px-4 py-2 rounded-lg"
          style={{
            color: '#C0392B',
            fontFamily: 'var(--font-cursive)',
            fontSize: '1.2rem',
            fontWeight: 700,
            transition: 'all 0.2s',
            background: 'transparent',
            border: 'none',
          }}
        >
          {isLogin ? "Pas encore de compte ? S'inscrire →" : "Déjà un compte ? Se connecter →"}
        </button>
      </div>
    </div>
  )
}
