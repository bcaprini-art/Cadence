/**
 * push.js — Firebase Admin push notification service
 * Gracefully skips if Firebase env vars are not configured.
 */

let admin = null
let messaging = null
let firebaseInitialized = false

function initFirebase() {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.log('[push] Firebase not configured — push notifications disabled')
    return
  }

  try {
    admin = require('firebase-admin')

    // Avoid double-init if module is re-required
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      })
    }

    messaging = admin.messaging()
    firebaseInitialized = true
    console.log('[push] Firebase Admin initialized ✓')
  } catch (err) {
    console.error('[push] Firebase init failed:', err.message)
  }
}

/**
 * Send a push notification to a specific user's registered device tokens.
 * Fire-and-forget — never throws.
 */
async function sendPushToUser(userId, title, body, data = {}) {
  if (!firebaseInitialized) return

  const prisma = require('./prisma')

  try {
    const tokens = await prisma.fCMToken.findMany({
      where: { userId },
      select: { token: true },
    })

    if (!tokens.length) return

    const tokenStrings = tokens.map((t) => t.token)

    const message = {
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      tokens: tokenStrings,
    }

    const response = await messaging.sendEachForMulticast(message)
    console.log(`[push] Sent to user ${userId}: ${response.successCount}/${tokenStrings.length} delivered`)

    // Prune invalid tokens
    const toDelete = []
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const errCode = res.error?.code
        if (
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token'
        ) {
          toDelete.push(tokenStrings[idx])
        }
      }
    })

    if (toDelete.length) {
      await prisma.fCMToken.deleteMany({ where: { token: { in: toDelete } } })
      console.log(`[push] Pruned ${toDelete.length} stale token(s)`)
    }
  } catch (err) {
    console.error('[push] sendPushToUser error:', err.message)
  }
}

/**
 * Send a push notification to all members of a team.
 * Fire-and-forget — never throws.
 */
async function sendPushToTeam(teamId, title, body, data = {}) {
  if (!firebaseInitialized) return

  const prisma = require('./prisma')

  try {
    const members = await prisma.user.findMany({
      where: { teamId },
      select: { id: true },
    })

    await Promise.allSettled(
      members.map((m) => sendPushToUser(m.id, title, body, data))
    )
  } catch (err) {
    console.error('[push] sendPushToTeam error:', err.message)
  }
}

/**
 * Send push to all team athletes (role=ATHLETE) only.
 */
async function sendPushToTeamAthletes(teamId, title, body, data = {}) {
  if (!firebaseInitialized) {
    console.log(`[push] (no firebase) Would send "${title}" to athletes on team ${teamId}`)
    return
  }

  const prisma = require('./prisma')

  try {
    const athletes = await prisma.user.findMany({
      where: { teamId, role: 'ATHLETE' },
      select: { id: true },
    })

    await Promise.allSettled(
      athletes.map((a) => sendPushToUser(a.id, title, body, data))
    )
  } catch (err) {
    console.error('[push] sendPushToTeamAthletes error:', err.message)
  }
}

module.exports = { initFirebase, sendPushToUser, sendPushToTeam, sendPushToTeamAthletes }
