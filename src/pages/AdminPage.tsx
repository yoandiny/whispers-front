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
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'users', label: 'Comptes', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #faf7f2 0%, #f3ecff 45%, #ffeef4 100%)', fontFamily: "'Inter', sans-serif" }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between"
        style={{ background: '#faf7f2', borderBottom: '1px solid rgba(40,30,70,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <button
            id="admin-back-btn"
            onClick={() => navigate('/home')}
            className="ws-press w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: '#efe9f7', border: '1px solid rgba(40,30,70,0.06)', color: '#857e95' }}
            title="Retour à l'application"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={18} style={{ color: '#7c5cfc' }} />
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.25rem', color: '#2b2540' }}>
              Administration
            </span>
          </div>
        </div>
        <button
          id="admin-logout-btn"
          onClick={handleLogout}
          className="ws-press w-8 h-8 flex items-center justify-center rounded-lg"
          style={{ background: '#efe9f7', border: '1px solid rgba(40,30,70,0.06)', color: '#857e95' }}
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
              className="ws-press flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
              style={{
                background: active ? 'rgba(124,92,252,0.12)' : '#ffffff',
                color: active ? '#7c5cfc' : '#857e95',
                border: active ? '1px solid rgba(124,92,252,0.2)' : '1px solid rgba(40,30,70,0.05)',
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
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: '#ffffff', border: '1px solid rgba(40,30,70,0.05)' }}
              >
                <button onClick={() => openProfile(u.id)} className="ws-press flex items-center gap-3 text-left flex-1 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(124,92,252,0.1)', color: '#7c5cfc' }}
                  >
                    {u.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm flex items-center gap-1.5" style={{ color: '#2b2540' }}>
                      @{u.username}
                      {u.role === 'admin' && <Shield size={11} style={{ color: '#7c5cfc' }} />}
                    </p>
                    <p className="text-xs" style={{ color: '#857e95' }}>
                      {u.messageCount} message(s) · {fmtDate(u.createdAt)}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => openProfile(u.id)} className="ws-press" style={{ color: '#857e95' }}>
                    <ChevronRight size={16} />
                  </button>
                  <button id={`admin-delete-user-${u.id}`} className="ws-press" onClick={() => deleteUser(u.id)} style={{ color: '#ff6b6b' }}>
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
              className="rounded-xl px-4 py-3 flex items-start gap-3"
              style={{ background: 'rgba(124,92,252,0.06)', border: '1px solid rgba(124,92,252,0.12)' }}
            >
              <Bell size={15} style={{ color: '#7c5cfc', marginTop: 2, flexShrink: 0 }} />
              <p className="text-xs leading-relaxed" style={{ color: '#857e95' }}>
                Envoie une notification personnalisée <strong style={{ color: '#7c5cfc' }}>in-app</strong> et{' '}
                <strong style={{ color: '#7c5cfc' }}>web-push</strong> — à tous les utilisateurs ou à un compte précis.
                Les notifications push ne sont envoyées qu'aux appareils ayant activé l'autorisation.
              </p>
            </div>

            {/* Target toggle */}
            <div>
              <p className="text-xs mb-2" style={{ color: '#857e95' }}>Destinataire</p>
              <div className="flex gap-2">
                {([
                  { id: 'all', label: '📣 Tout le monde' },
                  { id: 'user', label: '🎯 Utilisateur ciblé' },
                ] as const).map((opt) => {
                  const active = notifTarget === opt.id
                  return (
                    <button
                      key={opt.id}
                      id={`admin-notif-target-${opt.id}`}
                      onClick={() => setNotifTarget(opt.id)}
                      className="ws-press flex-1 py-2.5 rounded-xl text-sm"
                      style={{
                        background: active ? 'rgba(124,92,252,0.12)' : '#ffffff',
                        color: active ? '#7c5cfc' : '#857e95',
                        border: active ? '1px solid rgba(124,92,252,0.2)' : '1px solid rgba(40,30,70,0.05)',
                        fontWeight: active ? 600 : 400,
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
                <p className="text-xs mb-2" style={{ color: '#857e95' }}>Sélectionner un compte</p>
                <select
                  id="admin-notif-user"
                  value={notifUserId}
                  onChange={(e) => setNotifUserId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: '#ffffff', border: '1px solid rgba(40,30,70,0.06)', color: '#2b2540' }}
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
              <p className="text-xs mb-2" style={{ color: '#857e95' }}>Titre</p>
              <input
                id="admin-notif-title"
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Ex: Maintenance programmée"
                maxLength={120}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: '#ffffff', border: '1px solid rgba(40,30,70,0.06)', color: '#2b2540' }}
              />
              <p className="text-xs mt-1 text-right" style={{ color: '#3a3530' }}>{notifTitle.length}/120</p>
            </div>

            <div>
              <p className="text-xs mb-2" style={{ color: '#857e95' }}>Message</p>
              <textarea
                id="admin-notif-body"
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                placeholder="Contenu de la notification…"
                maxLength={300}
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: '#ffffff', border: '1px solid rgba(40,30,70,0.06)', color: '#2b2540' }}
              />
              <p className="text-xs mt-1 text-right" style={{ color: '#3a3530' }}>{notifBody.length}/300</p>
            </div>

            <button
              id="admin-notif-send"
              onClick={sendNotification}
              disabled={sendingNotif || !notifTitle.trim() || !notifBody.trim() || (notifTarget === 'user' && !notifUserId)}
              className="ws-press w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm"
              style={{
                background: (!notifTitle.trim() || !notifBody.trim() || (notifTarget === 'user' && !notifUserId))
                  ? 'rgba(124,92,252,0.15)'
                  : '#7c5cfc',
                color: (!notifTitle.trim() || !notifBody.trim() || (notifTarget === 'user' && !notifUserId))
                  ? '#6a5d48'
                  : '#faf7f2',
                fontWeight: 500,
                cursor: sendingNotif ? 'wait' : 'pointer',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              <Send size={15} />
              {sendingNotif ? 'Envoi en cours...' : notifTarget === 'all' ? 'Envoyer à tous' : 'Envoyer à cet utilisateur'}
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
                className="rounded-xl px-4 py-3"
                style={{ background: '#ffffff', border: '1px solid rgba(40,30,70,0.05)' }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: '#7c5cfc' }}>
                    → @{m.recipient.username}
                  </span>
                  <span className="text-xs" style={{ color: '#b3acc2' }}>
                    {fmtDate(m.createdAt)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#2b2540' }}>
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
          style={{ background: '#faf7f2' }}
        >
          <div
            className="px-5 py-4 flex items-center gap-3"
            style={{ borderBottom: '1px solid rgba(40,30,70,0.06)' }}
          >
            <button onClick={() => setProfile(null)} style={{ color: '#857e95' }}>
              <ArrowLeft size={18} />
            </button>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.1rem', color: '#2b2540' }}>
              Profil
            </span>
          </div>

          <div className="px-5 py-6 overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl"
                style={{ background: 'rgba(124,92,252,0.1)', color: '#7c5cfc' }}
              >
                {profile.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-lg flex items-center gap-2" style={{ color: '#2b2540' }}>
                  @{profile.username}
                  {profile.role === 'admin' && <Shield size={14} style={{ color: '#7c5cfc' }} />}
                </p>
                <p className="text-xs" style={{ color: '#857e95' }}>
                  Inscrit le {fmtDate(profile.createdAt)}
                </p>
              </div>
            </div>

            <button
              id="admin-profile-delete-btn"
              onClick={() => deleteUser(profile.id)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm mb-6"
              style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', color: '#ff6b6b' }}
            >
              <Trash2 size={14} />
              Supprimer ce compte
            </button>

            <p className="text-xs mb-2" style={{ color: '#857e95' }}>
              Messages reçus ({profile.messages.length})
            </p>
            <div className="flex flex-col gap-2">
              {profile.messages.length === 0 && <Empty label="Aucun message" />}
              {profile.messages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl px-4 py-3"
                  style={{ background: '#ffffff', border: '1px solid rgba(40,30,70,0.05)' }}
                >
                  <p className="text-sm" style={{ color: '#2b2540' }}>
                    {m.text}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#b3acc2' }}>
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
      className="ws-lift rounded-2xl p-4"
      style={{
        background: highlight ? 'rgba(124,92,252,0.07)' : '#ffffff',
        border: highlight ? '1px solid rgba(124,92,252,0.18)' : '1px solid rgba(40,30,70,0.05)',
      }}
    >
      <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.8rem', color: highlight ? '#7c5cfc' : '#7c5cfc' }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: highlight ? '#8a7a62' : '#857e95' }}>
        {label}
      </p>
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="text-center py-12 text-sm" style={{ color: '#b3acc2' }}>
      {label}
    </div>
  )
}
