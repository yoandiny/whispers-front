import api from './api'

export function isPushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** Register the service worker (safe to call multiple times). */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch {
    return null
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export type EnablePushResult = { ok: boolean; reason?: 'unsupported' | 'denied' | 'no-vapid' | 'error' }

/** Request permission, subscribe to push and persist the subscription on the backend. */
export async function enablePush(): Promise<EnablePushResult> {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return { ok: false, reason: 'denied' }

    await registerServiceWorker()
    const reg = await navigator.serviceWorker.ready

    const { data } = await api.get('/api/notifications/vapid-public-key')
    const publicKey: string | null = data?.data?.publicKey
    if (!publicKey) return { ok: false, reason: 'no-vapid' }

    const existing = await reg.pushManager.getSubscription()
    const subscription =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }))

    await api.post('/api/notifications/subscribe', { subscription })
    return { ok: true }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

/** Unsubscribe locally and on the backend. */
export async function disablePush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await api.post('/api/notifications/unsubscribe', { endpoint: sub.endpoint }).catch(() => {})
      await sub.unsubscribe()
    }
  } catch {
    /* ignore */
  }
}

/** Current browser permission state. */
export function pushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

export type PushState = 'idle' | 'subscribing' | 'subscribed' | 'denied' | 'unsupported' | 'error'

/** Subscribe to anonymous conversation notifications. */
export async function subscribeAnonPush(token: string): Promise<PushState> {
  if (!isPushSupported()) return 'unsupported'
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return 'denied'

    await registerServiceWorker()
    const reg = await navigator.serviceWorker.ready

    const { data } = await api.get('/api/notifications/vapid-public-key')
    const publicKey: string | null = data?.data?.publicKey
    if (!publicKey) return 'error'

    const existing = await reg.pushManager.getSubscription()
    const subscription =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }))

    await api.post(`/api/conversations/token/${token}/subscribe-push`, { subscription })
    return 'subscribed'
  } catch {
    return 'error'
  }
}

