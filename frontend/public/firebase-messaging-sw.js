/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications for Cadence.
 *
 * This file must live at /firebase-messaging-sw.js (public root).
 * It runs in a separate SW context — no access to localStorage or DOM.
 */

// Firebase version must match the client SDK version
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Firebase config is injected at runtime via the app.
// The SW reads config passed via postMessage on activation.
let messaging = null

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    try {
      const app = firebase.initializeApp(event.data.config)
      messaging = firebase.messaging(app)

      messaging.onBackgroundMessage((payload) => {
        const { title, body } = payload.notification || {}
        const data = payload.data || {}

        self.registration.showNotification(title || 'Cadence', {
          body: body || '',
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          data: { ...data, url: data.url || '/' },
          tag: data.eventId || 'cadence-notification',
          renotify: true,
        })
      })
    } catch (err) {
      console.error('[sw] Firebase init error:', err)
    }
  }
})

// Handle notification click — open/focus app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
