import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import api from '@/lib/api'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  /** True while the initial token validation is in progress. */
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  /** Persist a freshly issued session (after login/register). */
  login: (token: string, user: User) => void
  /** Clear the session locally. */
  logout: () => void
  /** Re-validate the stored token against the API. */
  refresh: () => Promise<void>
}

const TOKEN_KEY = 'whispers_token'
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const res = await api.get('/api/auth/me')
      const me: User = res.data.data
      setUser(me)
      // Keep cached values in sync for non-React consumers
      localStorage.setItem('whispers_username', me.username)
      localStorage.setItem('whispers_role', me.role)
    } catch {
      // Invalid / expired token — clear the session
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('whispers_username')
      localStorage.removeItem('whispers_role')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Validate the stored token once on mount
  useEffect(() => {
    refresh()
  }, [refresh])

  // Keep auth state in sync across tabs / when the interceptor clears the token
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === TOKEN_KEY && !e.newValue) setUser(null)
    }
    function onUnauthorized() {
      setUser(null)
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('whispers:unauthorized', onUnauthorized)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('whispers:unauthorized', onUnauthorized)
    }
  }, [])

  const login = useCallback((token: string, nextUser: User) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem('whispers_username', nextUser.username)
    localStorage.setItem('whispers_role', nextUser.role)
    setUser(nextUser)
    setLoading(false)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('whispers_username')
    localStorage.removeItem('whispers_role')
    setUser(null)
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    refresh,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un <AuthProvider>')
  return ctx
}
