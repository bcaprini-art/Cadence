/**
 * Cadence Google Calendar Sync Routes
 * Handles OAuth 2.0 flow and calendar → ScheduleBlock import
 *
 * Routes:
 *   GET  /api/calendar/auth        — redirect to Google OAuth
 *   GET  /api/calendar/callback    — handle OAuth callback & store tokens
 *   GET  /api/calendar/sync        — sync upcoming Google events → ScheduleBlocks
 *   GET  /api/calendar/status      — return sync status for current user
 *   DELETE /api/calendar/disconnect — remove stored tokens
 */

const express = require('express')
const { google } = require('googleapis')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')

const router = express.Router()

// ─── OAuth2 Client factory ────────────────────────────────────────────────────

function createOAuth2Client() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    return null
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
}

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
]

// Map Google event summary keywords → Cadence BlockType
function inferBlockType(summary = '') {
  const lower = summary.toLowerCase()
  if (/class|lecture|lab|seminar|econ|math|bio|chem|phys|hist|eng|psy|soc|cs\s|cosc/.test(lower)) {
    return 'CLASS'
  }
  if (/study|homework|hw|exam|quiz|review|tutoring/.test(lower)) {
    return 'STUDY'
  }
  return 'PERSONAL'
}

// ─── Helper: refresh access token if expired ──────────────────────────────────

async function getRefreshedClient(userId) {
  const tokenRecord = await prisma.googleToken.findUnique({ where: { userId } })
  if (!tokenRecord) return null

  const oauth2Client = createOAuth2Client()
  if (!oauth2Client) return null

  oauth2Client.setCredentials({
    access_token: tokenRecord.accessToken,
    refresh_token: tokenRecord.refreshToken,
  })

  // If token expires in < 5 minutes, refresh now
  const expiresAt = new Date(tokenRecord.expiresAt)
  const fiveMinutes = 5 * 60 * 1000
  if (expiresAt.getTime() - Date.now() < fiveMinutes) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      const newExpiresAt = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600 * 1000)

      await prisma.googleToken.update({
        where: { userId },
        data: {
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token || tokenRecord.refreshToken,
          expiresAt: newExpiresAt,
        },
      })

      oauth2Client.setCredentials(credentials)
    } catch (err) {
      console.error('[calendar] Token refresh failed:', err.message)
      return null
    }
  }

  return oauth2Client
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/calendar/auth
 * Redirects user to Google OAuth consent screen
 * Requires: auth (JWT) — userId encoded in state param
 */
router.get('/auth', auth, (req, res) => {
  const oauth2Client = createOAuth2Client()
  if (!oauth2Client) {
    return res.status(503).json({
      error: 'Google Calendar integration is not configured on this server.',
    })
  }

  const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString('base64url')

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // force refresh_token every time
    state,
  })

  res.redirect(authUrl)
})

/**
 * GET /api/calendar/callback
 * Handles Google OAuth callback, stores tokens in DB
 */
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query

  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

  if (error) {
    console.error('[calendar] OAuth error:', error)
    return res.redirect(`${CLIENT_URL}/calendar/callback?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return res.redirect(`${CLIENT_URL}/calendar/callback?error=missing_params`)
  }

  let userId
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    userId = decoded.userId
  } catch {
    return res.redirect(`${CLIENT_URL}/calendar/callback?error=invalid_state`)
  }

  const oauth2Client = createOAuth2Client()
  if (!oauth2Client) {
    return res.redirect(`${CLIENT_URL}/calendar/callback?error=not_configured`)
  }

  try {
    const { tokens } = await oauth2Client.getToken(code)
    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000)

    await prisma.googleToken.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt,
      },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        expiresAt,
      },
    })

    console.log(`[calendar] Tokens stored for user ${userId}`)
    return res.redirect(`${CLIENT_URL}/calendar/callback?success=true`)
  } catch (err) {
    console.error('[calendar] Token exchange failed:', err.message)
    return res.redirect(
      `${CLIENT_URL}/calendar/callback?error=${encodeURIComponent('token_exchange_failed')}`
    )
  }
})

/**
 * GET /api/calendar/sync
 * Fetches upcoming events from Google Calendar, creates ScheduleBlocks
 * Requires: auth (JWT)
 */
router.get('/sync', auth, async (req, res) => {
  const userId = req.user.id

  const oauth2Client = await getRefreshedClient(userId)
  if (!oauth2Client) {
    return res.status(401).json({
      error: 'Google Calendar not connected. Please authenticate first.',
      authUrl: '/api/calendar/auth',
    })
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  // Sync window: now → 30 days ahead
  const timeMin = new Date().toISOString()
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  let googleEvents = []
  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    })
    googleEvents = response.data.items || []
  } catch (err) {
    console.error('[calendar] Failed to fetch events:', err.message)
    return res.status(502).json({ error: 'Failed to fetch Google Calendar events.' })
  }

  // Filter out all-day events (no dateTime) and events without end times
  const timedEvents = googleEvents.filter(
    (e) => e.start?.dateTime && e.end?.dateTime
  )

  let created = 0
  let skipped = 0

  for (const gEvent of timedEvents) {
    const start = new Date(gEvent.start.dateTime)
    const end = new Date(gEvent.end.dateTime)
    const title = gEvent.summary || 'Google Event'
    const blockType = inferBlockType(title)

    // Check for existing block with same source + overlapping time to avoid duplicates
    const existing = await prisma.scheduleBlock.findFirst({
      where: {
        userId,
        source: 'CALENDAR_SYNC',
        start,
        end,
        title,
      },
    })

    if (existing) {
      skipped++
      continue
    }

    await prisma.scheduleBlock.create({
      data: {
        userId,
        title,
        start,
        end,
        type: blockType,
        isHardBlock: true,
        visibility: 'BUSY',
        source: 'CALENDAR_SYNC',
      },
    })
    created++
  }

  // Update last-synced timestamp on the token record
  await prisma.googleToken.update({
    where: { userId },
    data: { updatedAt: new Date() },
  })

  res.json({
    message: `Synced ${created} events from Google Calendar (${skipped} duplicates skipped)`,
    created,
    skipped,
    total: timedEvents.length,
    syncedAt: new Date().toISOString(),
  })
})

/**
 * GET /api/calendar/status
 * Returns whether the user has Google Calendar connected + last sync time
 */
router.get('/status', auth, async (req, res) => {
  const tokenRecord = await prisma.googleToken.findUnique({
    where: { userId: req.user.id },
    select: { updatedAt: true, expiresAt: true },
  })

  if (!tokenRecord) {
    return res.json({ connected: false, lastSynced: null })
  }

  res.json({
    connected: true,
    lastSynced: tokenRecord.updatedAt,
    tokenExpiresAt: tokenRecord.expiresAt,
  })
})

/**
 * DELETE /api/calendar/disconnect
 * Removes stored Google tokens for the current user
 */
router.delete('/disconnect', auth, async (req, res) => {
  const userId = req.user.id

  const tokenRecord = await prisma.googleToken.findUnique({ where: { userId } })

  if (!tokenRecord) {
    return res.status(404).json({ error: 'No Google Calendar connection found.' })
  }

  // Optionally revoke the token with Google
  try {
    const oauth2Client = createOAuth2Client()
    if (oauth2Client && tokenRecord.accessToken) {
      oauth2Client.setCredentials({ access_token: tokenRecord.accessToken })
      await oauth2Client.revokeCredentials()
    }
  } catch (err) {
    console.warn('[calendar] Token revoke failed (continuing):', err.message)
  }

  await prisma.googleToken.delete({ where: { userId } })

  res.json({ message: 'Google Calendar disconnected successfully.' })
})

module.exports = router
