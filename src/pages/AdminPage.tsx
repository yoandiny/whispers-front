import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Trash2,
  LogOut,
  ArrowLeft,
  Shield,
  ChevronRight,
} from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'

type Tab = 'dashboard' | 'users' | 'messages'

interface Stats {
  totalUsers: number
  totalAdmins: number
  totalMessages: number
  unreadMessages: number
  newUsers7d: number
  newMessages7d: number
}

interface AdminUser {
  id: string
  username: string
  role: 'user' | 'admin'
  createdAt: string
  messageCount: number
}

interface AdminMessage {
  id: string
  text: string
  read: boolean
  createdAt: string
  recipient: { id: string; username: string }
}

interface UserProfile extends AdminUser {
  messages: { id: string; text: string; read: boolean; createdAt: string }[]
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

export function AdminPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const loadDashboard = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/dashboard')
      setStats(res.data.data)
    } catch {
      toast.error('Erreur lors du chargement du tableau de bord')
    }
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/users')
      setUsers(res.data.data)
    } catch {
      toast.error('Erreur lors du chargement des comptes')
    }
  }, [])

  const loadMessages = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/messages')
      setMessages(res.data.data)
    } catch {
      toast.error('Erreur lors du chargement des messages')
    }
  }, [])

  useEffect(() => {
    if (tab === 'dashboard') loadDashboard()
    if (tab === 'users') loadUsers()
    if (tab === 'messages') loadMessages()
  }, [tab, loadDashboard, loadUsers, loadMessages])

  async function openProfile(id: string) {
    try {
      const res = await api.get(`/api/admin/users/${id}`)
      setProfile(res.data.data)
    } catch {
      toast.error('Profil introuvable')
    }
  }

  async function deleteUser(id: string) {
    if (!confirm('Supprimer définitivement ce compte et ses messages ?')) return
    try {
      await api.delete(`/api/admin/users/${id}`)
      toast.success('Compte supprimé')
      setProfile(null)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Suppression impossible')
    }
  }

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'users', label: 'Comptes', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0e0e0f', fontFamily: "'Inter', sans-serif" }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between"
        style={{ background: '#0e0e0f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <button
            id="admin-back-btn"
            onClick={() => navigate('/home')}
            className="ws-press w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: '#1e1e20', border: '1px solid rgba(255,255,255,0.06)', color: '#7a756d' }}
            title="Retour à l'application"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={18} style={{ color: '#c8aa82' }} />
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.25rem', color: '#ede8e1' }}>
              Administration
            </span>
          </div>
        </div>
        <button
          id="admin-logout-btn"
          onClick={handleLogout}
          className="ws-press w-8 h-8 flex items-center justify-center rounded-lg"
          style={{ background: '#1e1e20', border: '1px solid rgba(255,255,255,0.06)', color: '#7a756d' }}
          title="Déconnexion"
        >
          <LogOut size={13} />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="px-5 pt-4 flex gap-2">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              id={`admin-tab-${id}`}
              onClick={() => setTab(id)}
              className="ws-press flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
              style={{
                background: active ? 'rgba(200,170,130,0.12)' : '#161618',
                color: active ? '#c8aa82' : '#7a756d',
                border: active ? '1px solid rgba(200,170,130,0.2)' : '1px solid rgba(255,255,255,0.05)',
                fontWeight: active ? 600 : 400,
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          )
        })}
      </div>

      <div className="px-5 py-5" key={tab}>
        {/* Dashboard */}
        {tab === 'dashboard' && stats && (
          <div className="grid grid-cols-2 gap-3 animate-fade-up">
            <StatCard label="Utilisateurs" value={stats.totalUsers} />
            <StatCard label="Administrateurs" value={stats.totalAdmins} />
            <StatCard label="Messages" value={stats.totalMessages} />
            <StatCard label="Non lus" value={stats.unreadMessages} />
            <StatCard label="Nouveaux comptes (7j)" value={stats.newUsers7d} />
            <StatCard label="Nouveaux messages (7j)" value={stats.newMessages7d} />
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="flex flex-col gap-2 animate-fade-up">
            {users.length === 0 && <Empty label="Aucun compte" />}
            {users.map((u) => (
              <div
                key={u.id}
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: '#161618', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <button onClick={() => openProfile(u.id)} className="ws-press flex items-center gap-3 text-left flex-1 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(200,170,130,0.1)', color: '#c8aa82' }}
                  >
                    {u.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm flex items-center gap-1.5" style={{ color: '#ede8e1' }}>
                      @{u.username}
                      {u.role === 'admin' && <Shield size={11} style={{ color: '#c8aa82' }} />}
                    </p>
                    <p className="text-xs" style={{ color: '#7a756d' }}>
                      {u.messageCount} message(s) · {fmtDate(u.createdAt)}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => openProfile(u.id)} className="ws-press" style={{ color: '#7a756d' }}>
                    <ChevronRight size={16} />
                  </button>
                  <button id={`admin-delete-user-${u.id}`} className="ws-press" onClick={() => deleteUser(u.id)} style={{ color: '#c87a7a' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All messages */}
        {tab === 'messages' && (
          <div className="flex flex-col gap-2 animate-fade-up">
            {messages.length === 0 && <Empty label="Aucun message" />}
            {messages.map((m) => (
              <div
                key={m.id}
                className="rounded-xl px-4 py-3"
                style={{ background: '#161618', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: '#c8aa82' }}>
                    → @{m.recipient.username}
                  </span>
                  <span className="text-xs" style={{ color: '#4a4540' }}>
                    {fmtDate(m.createdAt)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#ede8e1' }}>
                  {m.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile drawer */}
      {profile && (
        <div
          className="fixed inset-0 z-30 flex flex-col animate-slide-up"
          style={{ background: '#0e0e0f' }}
        >
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button onClick={() => setProfile(null)} style={{ color: '#7a756d' }}>
              <ArrowLeft size={18} />
            </button>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.1rem', color: '#ede8e1' }}>
              Profil
            </span>
          </div>

          <div className="px-5 py-6 overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl"
                style={{ background: 'rgba(200,170,130,0.1)', color: '#c8aa82' }}
              >
                {profile.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-lg flex items-center gap-2" style={{ color: '#ede8e1' }}>
                  @{profile.username}
                  {profile.role === 'admin' && <Shield size={14} style={{ color: '#c8aa82' }} />}
                </p>
                <p className="text-xs" style={{ color: '#7a756d' }}>
                  Inscrit le {fmtDate(profile.createdAt)}
                </p>
              </div>
            </div>

            <button
              id="admin-profile-delete-btn"
              onClick={() => deleteUser(profile.id)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm mb-6"
              style={{ background: 'rgba(120,60,60,0.1)', border: '1px solid rgba(120,60,60,0.2)', color: '#c87a7a' }}
            >
              <Trash2 size={14} />
              Supprimer ce compte
            </button>

            <p className="text-xs mb-2" style={{ color: '#7a756d' }}>
              Messages reçus ({profile.messages.length})
            </p>
            <div className="flex flex-col gap-2">
              {profile.messages.length === 0 && <Empty label="Aucun message" />}
              {profile.messages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl px-4 py-3"
                  style={{ background: '#161618', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <p className="text-sm" style={{ color: '#ede8e1' }}>
                    {m.text}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#4a4540' }}>
                    {fmtDate(m.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="ws-lift rounded-2xl p-4" style={{ background: '#161618', border: '1px solid rgba(255,255,255,0.05)' }}>
      <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.8rem', color: '#c8aa82' }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: '#7a756d' }}>
        {label}
      </p>
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="text-center py-12 text-sm" style={{ color: '#4a4540' }}>
      {label}
    </div>
  )
}
