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
  Bell,
  Send,
} from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'

type Tab = 'dashboard' | 'users' | 'messages' | 'notifications'

interface Stats {
  totalUsers: number
  totalAdmins: number
  totalMessages: number
  unreadMessages: number
  newUsers7d: number
  newMessages7d: number
  pushSubscriptions: number
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

const RED = '#C0392B'
const BROWN = '#2C1A13'
const MUTED = '#8A6B5E'
const BG = 'linear-gradient(180deg, #FAF6F0 0%, #F5EBE6 50%, #FAF0EE 100%)'

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

  // ─── Notification composer state ─────────────────────────────
  const [notifTarget, setNotifTarget] = useState<'all' | 'user'>('all')
  const [notifUserId, setNotifUserId] = useState('')
  const [notifTitle, setNotifTitle] = useState('')
  const [notifBody, setNotifBody] = useState('')
  const [sendingNotif, setSendingNotif] = useState(false)

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
    if (tab === 'notifications') loadUsers()
  }, [tab, loadDashboard, loadUsers, loadMessages])

  async function sendNotification() {
    if (!notifTitle.trim() || !notifBody.trim()) {
      toast.error('Titre et message requis')
      return
    }
    if (notifTarget === 'user' && !notifUserId) {
      toast.error('Sélectionne un utilisateur')
      return
    }
    setSendingNotif(true)
    try {
      const res = await api.post('/api/admin/notifications', {
        target: notifTarget === 'all' ? 'all' : notifUserId,
        title: notifTitle.trim(),
        body: notifBody.trim(),
      })
      toast.success(res.data.message || 'Notification envoyée')
      setNotifTitle('')
      setNotifBody('')
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Envoi impossible")
    } finally {
      setSendingNotif(false)
    }
  }

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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Comptes', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'notifications', label: 'Alertes', icon: Bell },
  ]

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: 'var(--font-sans)' }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between"
        style={{ background: '#FFF8F5', borderBottom: '1px solid rgba(44, 26, 19, 0.08)' }}
      >
        <div className="flex items-center gap-3">
          <button
            id="admin-back-btn"
            onClick={() => navigate('/home')}
            className="btn-explosive w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: '#FFF8F5', border: '1px solid rgba(44, 26, 19, 0.08)', color: MUTED }}
            title="Retour à l'application"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={18} style={{ color: RED }} />
            <span style={{ fontFamily: 'var(--font-gothic)', fontSize: '1.1rem', color: BROWN }}>
              Admin
            </span>
          </div>
        </div>
        <button
          id="admin-logout-btn"
          onClick={handleLogout}
          className="btn-explosive w-8 h-8 flex items-center justify-center rounded-lg"
          style={{ background: '#FFF8F5', border: '1px solid rgba(44, 26, 19, 0.08)', color: MUTED }}
          title="Déconnexion"
        >
          <LogOut size={13} />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="px-5 pt-4 flex gap-2 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              id={`admin-tab-${id}`}
              onClick={() => setTab(id)}
              className="btn-explosive flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
              style={{
                background: active ? 'rgba(192, 57, 43, 0.08)' : '#FFF8F5',
                color: active ? RED : MUTED,
                border: active ? '1px solid rgba(192, 57, 43, 0.2)' : '1px solid rgba(44, 26, 19, 0.08)',
                fontWeight: 700,
                fontFamily: 'var(--font-tech)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
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
            <StatCard label="Admins" value={stats.totalAdmins} />
            <StatCard label="Messages" value={stats.totalMessages} />
            <StatCard label="Non lus" value={stats.unreadMessages} />
            <StatCard label="Nouveaux users (7j)" value={stats.newUsers7d} />
            <StatCard label="Nouveaux msg (7j)" value={stats.newMessages7d} />
            <StatCard label="Abonnés push" value={stats.pushSubscriptions} highlight />
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="flex flex-col gap-2 animate-fade-up">
            {users.length === 0 && <Empty label="Aucun compte" />}
            {users.map((u) => (
              <div
                key={u.id}
                className="card-explosive rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: '#FFF8F5', border: '1px solid rgba(44, 26, 19, 0.06)' }}
              >
                <button onClick={() => openProfile(u.id)} className="flex items-center gap-3 text-left flex-1 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(192, 57, 43, 0.08)', color: RED, fontFamily: 'var(--font-gothic)', fontSize: '0.9rem' }}
                  >
                    {u.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm flex items-center gap-1.5" style={{ color: BROWN, fontWeight: 600 }}>
                      @{u.username}
                      {u.role === 'admin' && <Shield size={11} style={{ color: RED }} />}
                    </p>
                    <p className="text-xs" style={{ color: MUTED, fontFamily: 'var(--font-mono)' }}>
                      {u.messageCount} msg · {fmtDate(u.createdAt)}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => openProfile(u.id)} className="btn-explosive" style={{ color: MUTED }}>
                    <ChevronRight size={16} />
                  </button>
                  <button id={`admin-delete-user-${u.id}`} className="btn-explosive" onClick={() => deleteUser(u.id)} style={{ color: RED }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notification composer */}
        {tab === 'notifications' && (
          <div className="flex flex-col gap-4 animate-fade-up">
            {/* Info banner */}
            <div
              className="card-explosive rounded-xl px-4 py-3 flex items-start gap-3"
              style={{ background: 'rgba(192, 57, 43, 0.04)', border: '1px solid rgba(192, 57, 43, 0.12)' }}
            >
              <Bell size={15} style={{ color: RED, marginTop: 2, flexShrink: 0 }} />
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
                Envoie une notification personnalisée <strong style={{ color: RED }}>in-app</strong> et{' '}
                <strong style={{ color: RED }}>web-push</strong> — à tous les utilisateurs ou à un compte précis.
              </p>
            </div>

            {/* Target toggle */}
            <div>
              <p className="text-xs mb-2" style={{ color: MUTED, fontFamily: 'var(--font-mono)' }}>Destinataire</p>
              <div className="flex gap-2">
                {([
                  { id: 'all', label: '📣 Tous' },
                  { id: 'user', label: '🎯 Cible' },
                ] as const).map((opt) => {
                  const active = notifTarget === opt.id
                  return (
                    <button
                      key={opt.id}
                      id={`admin-notif-target-${opt.id}`}
                      onClick={() => setNotifTarget(opt.id)}
                      className="btn-explosive flex-1 py-2.5 rounded-xl text-xs"
                      style={{
                        background: active ? 'rgba(192, 57, 43, 0.08)' : '#FFF8F5',
                        color: active ? RED : MUTED,
                        border: active ? '1px solid rgba(192, 57, 43, 0.2)' : '1px solid rgba(44, 26, 19, 0.08)',
                        fontWeight: 700,
                        fontFamily: 'var(--font-tech)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {notifTarget === 'user' && (
              <div>
                <p className="text-xs mb-2" style={{ color: MUTED, fontFamily: 'var(--font-mono)' }}>Sélectionner un compte</p>
                <select
                  id="admin-notif-user"
                  value={notifUserId}
                  onChange={(e) => setNotifUserId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: '#FFF8F5', border: '1px solid rgba(44, 26, 19, 0.08)', color: BROWN }}
                >
                  <option value="">Sélectionner un utilisateur…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      @{u.username}{u.role === 'admin' ? ' (admin)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <p className="text-xs mb-2" style={{ color: MUTED, fontFamily: 'var(--font-mono)' }}>Titre</p>
              <input
                id="admin-notif-title"
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Ex: Maintenance programmée"
                maxLength={120}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: '#FFF8F5', border: '1px solid rgba(44, 26, 19, 0.08)', color: BROWN }}
              />
              <p className="text-xs mt-1 text-right" style={{ color: MUTED, fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{notifTitle.length}/120</p>
            </div>

            <div>
              <p className="text-xs mb-2" style={{ color: MUTED, fontFamily: 'var(--font-mono)' }}>Message</p>
              <textarea
                id="admin-notif-body"
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                placeholder="Contenu de la notification…"
                maxLength={300}
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: '#FFF8F5', border: '1px solid rgba(44, 26, 19, 0.08)', color: BROWN }}
              />
              <p className="text-xs mt-1 text-right" style={{ color: MUTED, fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{notifBody.length}/300</p>
            </div>

            <button
              id="admin-notif-send"
              onClick={sendNotification}
              disabled={sendingNotif || !notifTitle.trim() || !notifBody.trim() || (notifTarget === 'user' && !notifUserId)}
              className="btn-explosive w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs"
              style={{
                background: (!notifTitle.trim() || !notifBody.trim() || (notifTarget === 'user' && !notifUserId))
                  ? 'rgba(44, 26, 19, 0.05)'
                  : 'linear-gradient(135deg, #C0392B 0%, #8B0000 100%)',
                color: (!notifTitle.trim() || !notifBody.trim() || (notifTarget === 'user' && !notifUserId))
                  ? '#C4A89E'
                  : '#FFF8F5',
                fontWeight: 700,
                cursor: sendingNotif ? 'wait' : 'pointer',
                fontFamily: 'var(--font-tech)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <Send size={15} />
              {sendingNotif ? 'Envoi...' : notifTarget === 'all' ? 'Envoyer à tous' : 'Envoyer'}
            </button>
          </div>
        )}

        {/* All messages */}
        {tab === 'messages' && (
          <div className="flex flex-col gap-2 animate-fade-up">
            {messages.length === 0 && <Empty label="Aucun message" />}
            {messages.map((m) => (
              <div
                key={m.id}
                className="card-explosive rounded-xl px-4 py-3"
                style={{ background: '#FFF8F5', border: '1px solid rgba(44, 26, 19, 0.06)' }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: RED, fontWeight: 600 }}>
                    → @{m.recipient.username}
                  </span>
                  <span className="text-[10px]" style={{ color: MUTED, fontFamily: 'var(--font-mono)' }}>
                    {fmtDate(m.createdAt)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: BROWN }}>
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
          style={{ background: '#FAF6F0' }}
        >
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ background: '#FFF8F5', borderBottom: '1px solid rgba(44, 26, 19, 0.08)' }}
          >
            <button onClick={() => setProfile(null)} style={{ color: MUTED }}>
              <ArrowLeft size={18} />
            </button>
            <span style={{ fontFamily: 'var(--font-gothic)', fontSize: '1.1rem', color: BROWN }}>
              Profil Admin
            </span>
          </div>

          <div className="px-5 py-6 overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl"
                style={{ background: 'rgba(192, 57, 43, 0.08)', color: RED, fontFamily: 'var(--font-gothic)' }}
              >
                {profile.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-lg flex items-center gap-2" style={{ color: BROWN, fontWeight: 600 }}>
                  @{profile.username}
                  {profile.role === 'admin' && <Shield size={14} style={{ color: RED }} />}
                </p>
                <p className="text-xs" style={{ color: MUTED, fontFamily: 'var(--font-mono)' }}>
                  Inscrit le {fmtDate(profile.createdAt)}
                </p>
              </div>
            </div>

            <button
              id="admin-profile-delete-btn"
              onClick={() => deleteUser(profile.id)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs mb-6 btn-explosive"
              style={{
                background: 'rgba(192, 57, 43, 0.06)',
                border: '1px solid rgba(192, 57, 43, 0.2)',
                color: RED,
                fontFamily: 'var(--font-tech)',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              <Trash2 size={14} />
              Supprimer ce compte
            </button>

            <p className="text-xs mb-2" style={{ color: MUTED, fontFamily: 'var(--font-mono)' }}>
              Messages reçus ({profile.messages.length})
            </p>
            <div className="flex flex-col gap-2">
              {profile.messages.length === 0 && <Empty label="Aucun message" />}
              {profile.messages.map((m) => (
                <div
                  key={m.id}
                  className="card-explosive rounded-xl px-4 py-3"
                  style={{ background: '#FFF8F5', border: '1px solid rgba(44, 26, 19, 0.06)' }}
                >
                  <p className="text-sm" style={{ color: BROWN }}>
                    {m.text}
                  </p>
                  <p style={{ color: MUTED, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', marginTop: '6px' }}>
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

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className="card-explosive rounded-2xl p-4"
      style={{
        background: highlight ? 'rgba(192, 57, 43, 0.06)' : '#FFF8F5',
        border: highlight ? '1px solid rgba(192, 57, 43, 0.18)' : '1px solid rgba(44, 26, 19, 0.05)',
      }}
    >
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: highlight ? RED : BROWN, fontWeight: 900, lineHeight: 1.1 }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: MUTED }}>
        {label}
      </p>
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="text-center py-12 text-sm" style={{ color: MUTED, fontFamily: 'var(--font-sans)' }}>
      {label}
    </div>
  )
}
