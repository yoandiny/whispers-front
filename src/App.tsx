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
import { AnonConvPage } from '@/pages/AnonConvPage'
import { ConversationsListPage } from '@/pages/ConversationsListPage'
import { OwnerConvPage } from '@/pages/OwnerConvPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#FFF8F5',
                color: '#2C1A13',
                border: '1px solid rgba(192,57,43,0.18)',
                boxShadow: '0 4px 20px rgba(192,57,43,0.15)',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 500,
              },
              success: {
                iconTheme: { primary: '#C0392B', secondary: '#FFF8F5' },
              },
              error: {
                iconTheme: { primary: '#922B21', secondary: '#FFF8F5' },
              },
            }}
          />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/conversations" element={<ProtectedRoute><ConversationsListPage /></ProtectedRoute>} />
            <Route path="/conversations/:id" element={<ProtectedRoute><OwnerConvPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
            <Route path="/:username" element={<SendPage />} />
            <Route path="/c/:token" element={<AnonConvPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
