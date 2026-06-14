import { useNavigate, useLocation } from 'react-router-dom'
import { Home, MessageCircle, User, Shield } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface NavItem {
  to: string
  label: string
  icon: typeof Home
}

const BASE_ITEMS: NavItem[] = [
  { to: '/home', label: 'Accueil', icon: Home },
  { to: '/inbox', label: 'Messages', icon: MessageCircle },
  { to: '/profile', label: 'Profil', icon: User },
]

const ADMIN_ITEM: NavItem = { to: '/admin', label: 'Admin', icon: Shield }

interface BottomNavProps {
  /** Optional badge count shown on the Messages tab */
  unreadCount?: number
}

export function BottomNav({ unreadCount = 0 }: BottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin } = useAuth()

  // Activate the admin entry only when the authenticated role is admin
  const items = isAdmin ? [...BASE_ITEMS, ADMIN_ITEM] : BASE_ITEMS

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20"
      style={{
        background: 'rgba(14,14,15,0.92)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '8px 0 16px',
      }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to
          return (
            <button
              key={to}
              id={`nav-${label.toLowerCase()}`}
              onClick={() => navigate(to)}
              className="ws-press relative flex flex-col items-center gap-1 px-5 py-1.5"
              style={{ color: active ? '#c8aa82' : '#7a756d' }}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                {to === '/inbox' && unreadCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center"
                    style={{ background: '#c8aa82', color: '#0e0e0f', fontWeight: 600 }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.7rem',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
