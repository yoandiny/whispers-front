import { useNavigate, useLocation } from 'react-router-dom'
import { Home, MessageCircle, User, Shield, MessageSquareText } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface NavItem {
  to: string
  label: string
  icon: typeof Home
}

const BASE_ITEMS: NavItem[] = [
  { to: '/home', label: 'Accueil', icon: Home },
  { to: '/inbox', label: 'Messages', icon: MessageCircle },
  { to: '/conversations', label: 'Conversations', icon: MessageSquareText },
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

  const items = isAdmin ? [...BASE_ITEMS, ADMIN_ITEM] : BASE_ITEMS

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20"
      style={{
        background: 'rgba(250, 246, 240, 0.93)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(44, 26, 19, 0.07)',
        padding: '8px 0 18px',
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
              className="ws-press relative flex flex-col items-center gap-1 px-4 py-1.5"
              style={{ color: active ? '#C0392B' : '#8A6B5E' }}
            >
              <div className="relative">
                <Icon
                  size={20}
                  strokeWidth={active ? 2.2 : 1.7}
                  style={{
                    filter: active ? 'drop-shadow(0 1px 4px rgba(192,57,43,0.3))' : 'none',
                    transition: 'filter 0.2s',
                  }}
                />
                {to === '/inbox' && unreadCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)',
                      color: '#FFF8F5',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(192,57,43,0.4)',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>

              {/* Indicateur actif — point rouge sous l'icône */}
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: '0.65rem',
                  fontWeight: active ? 600 : 400,
                  letterSpacing: active ? '0.02em' : '0',
                }}
              >
                {label}
              </span>
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: -4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#C0392B',
                    boxShadow: '0 0 6px rgba(192,57,43,0.5)',
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
