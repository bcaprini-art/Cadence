const express = require('express')
const auth = require('../middleware/auth')
const role = require('../middleware/role')
const { runConflictCheck, pass1HardBlocks, pass2CaraCompliance, pass3SuggestedWindows } = require('../lib/conflictEngine')
const { generateCoachPrompts } = require('../lib/scheduleAdvisor')
const { sendConflictAlert } = require('../lib/email')
const prisma = require('../lib/prisma')

const router = express.Router()

/**
 * POST /api/conflict-check
 * Body: { teamId, start, end, venueId?, type?, title? }
 * Runs 3-pass algorithm:
 *   1. Hard block overlaps
 *   2. CARA compliance violations
 *   3. Suggested alternative windows (top 3)
 * Returns full result + coachPrompts
 */
router.post('/', auth, role('COACH', 'AD', 'ADMIN'), async (req, res) => {
  const { teamId, start, end, venueId, type, title } = req.body

  if (!teamId || !start || !end) {
    return res.status(400).json({ error: 'teamId, start, and end are required' })
  }

  const startDate = new Date(start)
  const endDate = new Date(end)

  if (isNaN(startDate) || isNaN(endDate)) {
    return res.status(400).json({ error: 'start and end must be valid ISO date strings' })
  }

  if (endDate <= startDate) {
    return res.status(400).json({ error: 'end must be after start' })
  }

  const result = await runConflictCheck({ teamId, start: startDate, end: endDate, venueId })

  // Fetch roster for total athlete count
  const roster = await prisma.user.findMany({
    where: { teamId, role: 'ATHLETE' },
    select: { id: true, name: true },
  })

  // Generate coach prompts
  const coachPrompts = generateCoachPrompts(
    result,
    { start: startDate, end: endDate, type, title, venue: req.body.venue },
    roster
  )

  // Fire-and-forget: notify coach of hard conflicts
  if (result.hardConflicts.length > 0) {
    const proposedEvent = { title: title || 'Proposed Event', start: startDate, end: endDate, type: type || 'PRACTICE' }
    sendConflictAlert(req.user, result.hardConflicts, proposedEvent).catch(console.error)
  }

  res.json({
    teamId,
    proposedWindow: { start: startDate, end: endDate },
    hardConflicts: result.hardConflicts,
    caraViolations: result.caraViolations,
    suggestedWindows: result.suggestedWindows,
    smartSuggestions: result.smartSuggestions || [],
    coachPrompts,
    summary: {
      hasConflicts: result.hardConflicts.length > 0 || result.caraViolations.length > 0,
      conflictCount: result.hardConflicts.length,
      caraViolationCount: result.caraViolations.length,
      topWindowScore: result.suggestedWindows[0]?.score ?? null,
    },
  })
})

/**
 * POST /api/conflict-check/suggest
 * Body: { teamId, durationMinutes, lookAheadDays?, venueId?, type? }
 * Slides a window across the next N days in 30-min increments,
 * scores each slot, returns top 3 with coachPrompts attached.
 */
router.post('/suggest', auth, role('COACH', 'AD', 'ADMIN'), async (req, res) => {
  const { teamId, durationMinutes, lookAheadDays = 7, venueId, type } = req.body

  if (!teamId || !durationMinutes) {
    return res.status(400).json({ error: 'teamId and durationMinutes are required' })
  }

  const durationMs = Number(durationMinutes) * 60 * 1000
  if (isNaN(durationMs) || durationMs <= 0) {
    return res.status(400).json({ error: 'durationMinutes must be a positive number' })
  }

  // Fetch roster once
  const roster = await prisma.user.findMany({
    where: { teamId, role: 'ATHLETE' },
    select: { id: true, name: true },
  })

  if (roster.length === 0) {
    return res.status(400).json({ error: 'No athletes found for this team' })
  }

  const now = new Date()
  // Round up to next 30-min boundary
  const startMinute = Math.ceil(now.getMinutes() / 30) * 30
  now.setMinutes(startMinute, 0, 0)

  const searchEnd = new Date(now.getTime() + lookAheadDays * 24 * 60 * 60 * 1000)

  const candidates = []
  let cursor = new Date(now)

  // Batch-fetch hard blocks for the whole search window to avoid N+1
  const athleteIds = roster.map((a) => a.id)
  const [allBlocks, team] = await Promise.all([
    prisma.scheduleBlock.findMany({
      where: {
        userId: { in: athleteIds },
        isHardBlock: true,
        start: { lt: searchEnd },
        end: { gt: cursor },
      },
      select: { userId: true, start: true, end: true },
    }),
    prisma.team.findUnique({
      where: { id: teamId },
      include: { complianceRuleset: true },
    }),
  ])

  // Batch-fetch CARA logs for the full window
  const caraLogs = await prisma.cARALog.findMany({
    where: {
      athleteId: { in: athleteIds },
      weekStart: { gte: cursor },
    },
  })

  // Score each 30-min slot
  while (cursor.getTime() + durationMs <= searchEnd.getTime() && candidates.length < 200) {
    const windowStart = new Date(cursor)
    const windowEnd = new Date(cursor.getTime() + durationMs)

    // Count athletes with hard blocks in this window
    const blockedIds = new Set(
      allBlocks
        .filter((b) => b.start < windowEnd && b.end > windowStart)
        .map((b) => b.userId)
    )
    const availableCount = roster.length - blockedIds.size
    const availabilityRatio = availableCount / roster.length

    // CARA utilization
    let caraUtil = 0
    if (team?.complianceRuleset) {
      const limit = team.complianceRuleset.maxCaraHoursWeek
      const relevantLogs = caraLogs.filter((l) => l.weekStart >= windowStart)
      const totalHours = relevantLogs.reduce((sum, l) => sum + l.hours, 0)
      const avgHours = roster.length > 0 ? totalHours / roster.length : 0
      caraUtil = Math.min(avgHours / limit, 1)
    }

    const score = availabilityRatio * 0.5 + (1 - caraUtil) * 0.3 + 0.2 // venue assumed free

    candidates.push({ start: windowStart, end: windowEnd, score, availableCount })
    cursor = new Date(cursor.getTime() + 30 * 60 * 1000)
  }

  // Sort by score descending, pick top 3
  candidates.sort((a, b) => b.score - a.score)
  const top3 = candidates.slice(0, 3)

  // Build full conflict results + coachPrompts for each
  const suggestions = await Promise.all(
    top3.map(async (w) => {
      const result = await runConflictCheck({
        teamId,
        start: w.start,
        end: w.end,
        venueId,
      })
      const coachPrompts = generateCoachPrompts(
        result,
        { start: w.start, end: w.end, type, venue: req.body.venue },
        roster
      )
      return {
        window: { start: w.start, end: w.end },
        score: Math.round(w.score * 100),
        availableCount: w.availableCount,
        totalAthletes: roster.length,
        hardConflicts: result.hardConflicts,
        caraViolations: result.caraViolations,
        coachPrompts,
      }
    })
  )

  res.json({ teamId, durationMinutes, suggestions })
})

module.exports = router
