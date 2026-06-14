/* Whispers — Service Worker v2
 * Handles: web-push, notification click + action routing
 */

const APP_NAME = 'Whispers'
const ICON = '/favicon.svg'
const BADGE = '/favicon.svg'

// ─── Push received ────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: APP_NAME, body: event.data ? event.data.text() : '' }
  }

  const type   = payload.data?.type || 'message'
  const title  = payload.title || APP_NAME
  const body   = payload.body  || ''
  const data   = payload.data  || {}
  const url    = data.url || '/home'

  // Vibration pattern: message = double pulse, admin = single long
  const vibrate = type === 'message' ? [100, 50, 100] : [200]

  // Actions shown in the notification (where supported)
  const actions = type === 'message'
    ? [{ action: 'open_inbox', title: '📬 Voir la boîte' }]
    : [{ action: 'open_home',  title: '🏠 Ouvrir Whispers' }]

  // Group messages together; admin notifications stack separately
  const tag = type === 'message' ? 'whispers-messages' : `whispers-admin-${data.notificationId || Date.now()}`

  const options = {
    body,
    icon:    ICON,
    badge:   BADGE,
    vibrate,
    actions,
    tag,
    renotify:  true,
    data:      { url, type, notificationId: data.notificationId },
    timestamp: Date.now(),
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const notifData = event.notification.data || {}
  let targetUrl = notifData.url || '/home'

  // Override URL based on action button pressed
  if (event.action === 'open_inbox') targetUrl = '/inbox'
  if (event.action === 'open_home')  targetUrl = '/home'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus an already-open tab
        for (const client of clientList) {
          if ('focus' in client) {
            if ('navigate' in client) client.navigate(targetUrl)
            return client.focus()
          }
        }
        // No open tab — open a new one
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
      })
  )
})

// ─── Notification close (analytics hook, optional) ────────────────────────────
self.addEventListener('notificationclose', (_event) => {
  // Could be used to track dismissed notifications
})
