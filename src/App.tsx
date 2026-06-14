import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { LandingPage } from '@/pages/LandingPage'
import { SendPage } from '@/pages/SendPage'
import { InboxPage } from '@/pages/InboxPage'
import { HomePage } from '@/pages/HomePage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AdminPage } from '@/pages/AdminPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <NotificationProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1c1c1e',
            color: '#ede8e1',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
          },
        }}
      />
      <Routes>
        {/* Landing — choose/enter a username (redirects if already logged in) */}
        <Route path="/" element={<LandingPage />} />

        {/* Authenticated app sections (bottom menu) */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <InboxPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Admin interface — admin role required */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Public send page — anyone can send to a username */}
        <Route path="/:username" element={<SendPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
