import { Navigate, useLocation } from 'react-router-dom'
import { type ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { LoadingScreen } from '@/components/shared/LoadingScreen'

interface ProtectedRouteProps {
  children: ReactNode
  /** Require the admin role to access this route. */
  requireAdmin?: boolean
}

/**
 * Gate authenticated sections:
 * - Shows a loading screen while the session is being validated.
 * - Redirects to the login page (remembering the target) when unauthenticated.
 * - Redirects non-admins away from admin-only routes.
 */
export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { loading, isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen label="Vérification de la session..." />

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}
