/**
 * firebase.js — Firebase client SDK for Cadence web push notifications.
 * The app works fine without Firebase configured — all functions are no-ops.
 */

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

const isConfigured = Boolean(
  FIREBASE_CONFIG.apiKey &&
  FIREBASE_CONFIG.projectId &&
  FIREBASE_CONFIG.messagingSenderId &&
  FIREBASE_CONFIG.appId &&
  VAPID_KEY
)

let messagingInstance = null

async function getMessaging() {
  if (messagingInstance) return messagingInstance
  if (!isConfigured) return null

  const { initializeApp, getApps } = await import('firebase/app')
  const { getMessaging: getFCM, isSupported } = await import('firebase/messaging')

  const supported = await isSupported()
  if (!supported) {
    console.log('[firebase] FCM not supported in this browser')
    return null
  }

  const apps = getApps()
  const app = apps.length ? apps[0] : initializeApp(FIREBASE_CONFIG)
  messagingInstance = getFCM(app)

  // Notify the service worker of the config so it can init Firebase too
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'FIREBASE_CONFIG',
      config: FIREBASE_CONFIG,
    })
  }

  return messagingInstance
}

/**
 * Request notification permission and retrieve the FCM token.
 * Returns the token string, or null if permission denied / not configured.
 */
export async function requestNotificationPermission() {
  if (!isConfigured) {
    console.log('[firebase] Not configured — skipping push setup')
    return null
  }

  if (!('Notification' in window)) {
    console.log('[firebase] Notifications not supported')
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('[firebase] Notification permission denied')
      return null
    }

    // Register/wait for SW
    let swRegistration
    if ('serviceWorker' in navigator) {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      await navigator.serviceWorker.ready
    }

    const messaging = await getMessaging()
    if (!messaging) return null

    const { getToken } = await import('firebase/messaging')
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    })

    if (token) {
      console.log('[firebase] FCM token obtained')
      await registerToken(token)
      return token
    }

    return null
  } catch (err) {
    console.error('[firebase] Push setup error:', err)
    return null
  }
}

/**
 * Register a device token with the Cadence backend.
 */
export async function registerToken(token) {
  try {
    const jwt = localStorage.getItem('cadence_token')
    if (!jwt) return

    await fetch('/api/push/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ token, platform: 'WEB' }),
    })
    console.log('[firebase] Token registered with backend')
  } catch (err) {
    console.error('[firebase] Token registration error:', err)
  }
}

/**
 * Unregister a device token from the backend (e.g., on logout).
 */
export async function unregisterToken(token) {
  try {
    const jwt = localStorage.getItem('cadence_token')
    if (!jwt || !token) return

    await fetch('/api/push/unregister', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ token }),
    })
  } catch (err) {
    console.error('[firebase] Token unregistration error:', err)
  }
}

/**
 * Listen for foreground push messages and store them in localStorage.
 */
export async function setupForegroundListener() {
  if (!isConfigured) return

  const messaging = await getMessaging()
  if (!messaging) return

  const { onMessage } = await import('firebase/messaging')

  onMessage(messaging, (payload) => {
    const { title, body } = payload.notification || {}
    const data = payload.data || {}

    // Store notification in localStorage for the NotificationBell
    const stored = getStoredNotifications()
    const notification = {
      id: Date.now().toString(),
      title: title || 'Cadence',
      body: body || '',
      data,
      timestamp: new Date().toISOString(),
      read: false,
    }

    stored.unshift(notification)
    const trimmed = stored.slice(0, 10)
    localStorage.setItem('cadence_notifications', JSON.stringify(trimmed))

    // Dispatch a custom event so NotificationBell can update
    window.dispatchEvent(new CustomEvent('cadence:notification', { detail: notification }))
  })
}

/**
 * Get stored notifications from localStorage.
 */
export function getStoredNotifications() {
  try {
    return JSON.parse(localStorage.getItem('cadence_notifications') || '[]')
  } catch {
    return []
  }
}

/**
 * Mark all notifications as read.
 */
export function markAllRead() {
  const stored = getStoredNotifications()
  const updated = stored.map((n) => ({ ...n, read: true }))
  localStorage.setItem('cadence_notifications', JSON.stringify(updated))
}

export { isConfigured }
