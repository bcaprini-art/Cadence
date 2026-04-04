const express = require('express')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')
const role = require('../middleware/role')
const { generatePDFReport, generateCSVReport } = require('../lib/complianceReport')

const router = express.Router()
router.use(auth)

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get Monday of the current week if no weekStart provided
 */
function getWeekStartDate(weekStartStr) {
  if (weekStartStr) {
    const d = new Date(weekStartStr)
    if (!isNaN(d.getTime())) return d
  }
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/**
 * Get Sunday (end) of a week given its Monday
 */
function getWeekEndDate(weekStart) {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Load team with school, members, and compliance ruleset
 */
async function loadTeam(teamId) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      school: true,
      members: { select: { id: true, name: true, role: true, email: true } },
      complianceRuleset: true,
    },
  })
}

/**
 * Load CARA logs for a team's athletes in a week window
 */
async function loadCARALogs(athleteIds, weekStart, weekEnd) {
  return prisma.cARALog.findMany({
    where: {
      athleteId: { in: athleteIds },
      weekStart: { gte: weekStart, lte: weekEnd },
    },
    include: {
      athlete: { select: { id: true, name: true } },
      event: { select: { id: true, title: true, type: true } },
    },
    orderBy: { weekStart: 'asc' },
  })
}

// ─── GET /api/compliance/summary ──────────────────────────────────────────────
/**
 * Returns per-athlete CARA summary for a team and week
 * Query: teamId, weekStart (optional, defaults to current week)
 */
router.get('/summary', role('COACH', 'AD', 'ADMIN'), async (req, res) => {
  const { teamId, weekStart: weekStartStr } = req.query
  if (!teamId) return res.status(400).json({ error: 'teamId is required' })

  const team = await loadTeam(teamId)
  if (!team) return res.status(404).json({ error: 'Team not found' })

  const weekStart = getWeekStartDate(weekStartStr)
  const weekEnd = getWeekEndDate(weekStart)

  const athletes = team.members.filter((m) => m.role === 'ATHLETE')
  const athleteIds = athletes.map((a) => a.id)

  const caraLogs = athleteIds.length > 0
    ? await loadCARALogs(athleteIds, weekStart, weekEnd)
    : []

  const maxWeek = team.complianceRuleset?.maxCaraHoursWeek || 20
  const maxDay = team.complianceRuleset?.maxCaraHoursDay || 4

  // Build per-athlete summary
  const athleteSummary = athletes.map((athlete) => {
    const athleteLogs = caraLogs.filter((l) => l.athleteId === athlete.id)
    const weeklyTotal = athleteLogs.reduce((sum, l) => sum + l.hours, 0)

    // Build daily hours (Mon-Sun)
    const wsTime = weekStart.getTime()
    const daily = [0, 0, 0, 0, 0, 0, 0]
    for (const log of athleteLogs) {
      const logDate = new Date(log.weekStart || log.createdAt)
      const offset = Math.floor((logDate.getTime() - wsTime) / (24 * 60 * 60 * 1000))
      if (offset >= 0 && offset <= 6) {
        daily[offset] += log.hours
      }
    }

    const status =
      weeklyTotal >= maxWeek
        ? 'violation'
        : weeklyTotal >= maxWeek * 0.85
        ? 'warning'
        : 'ok'

    return {
      athlete: { id: athlete.id, name: athlete.name },
      weeklyTotal: parseFloat(weeklyTotal.toFixed(2)),
      dailyHours: {
        Mon: parseFloat(daily[0].toFixed(2)),
        Tue: parseFloat(daily[1].toFixed(2)),
        Wed: parseFloat(daily[2].toFixed(2)),
        Thu: parseFloat(daily[3].toFixed(2)),
        Fri: parseFloat(daily[4].toFixed(2)),
        Sat: parseFloat(daily[5].toFixed(2)),
        Sun: parseFloat(daily[6].toFixed(2)),
      },
      status,
      logs: athleteLogs,
    }
  })

  const violations = athleteSummary.filter((a) => a.status === 'violation')
  const warnings = athleteSummary.filter((a) => a.status === 'warning')

  res.json({
    team: {
      id: team.id,
      sport: team.sport,
      division: team.division,
      school: team.school,
    },
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    maxHoursWeek: maxWeek,
    maxHoursDay: maxDay,
    athletes: athleteSummary,
    totals: {
      total: athletes.length,
      violations: violations.length,
      warnings: warnings.length,
      ok: athletes.length - violations.length - warnings.length,
      avgHours: athletes.length > 0
        ? parseFloat((athleteSummary.reduce((s, a) => s + a.weeklyTotal, 0) / athletes.length).toFixed(1))
        : 0,
    },
  })
})

// ─── GET /api/compliance/forecast ─────────────────────────────────────────────
/**
 * Returns per-athlete CARA forecast for a team and week.
 * Combines logged hours with upcoming scheduled (countable) events.
 * Query: teamId, weekStart (optional — defaults to next Monday or current week)
 */
router.get('/forecast', role('COACH', 'AD', 'ADMIN'), async (req, res) => {
  const { teamId, weekStart: weekStartStr } = req.query
  if (!teamId) return res.status(400).json({ error: 'teamId is required' })

  const team = await loadTeam(teamId)
  if (!team) return res.status(404).json({ error: 'Team not found' })

  const weekStart = getWeekStartDate(weekStartStr)
  const weekEnd = getWeekEndDate(weekStart)

  const athletes = team.members.filter((m) => m.role === 'ATHLETE')
  const athleteIds = athletes.map((a) => a.id)

  const maxWeek = team.complianceRuleset?.maxCaraHoursWeek || 20

  // Current CARA logs for the week
  const caraLogs = athleteIds.length > 0
    ? await loadCARALogs(athleteIds, weekStart, weekEnd)
    : []

  // Upcoming events this week that are countable (not voluntary)
  const upcomingEvents = await prisma.event.findMany({
    where: {
      teamId,
      start: { gte: new Date(), lte: weekEnd },
      isVoluntary: false,
    },
    include: {
      attendees: { select: { userId: true, status: true } },
    },
    orderBy: { start: 'asc' },
  })

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const athleteForecasts = athletes.map((athlete) => {
    // Current hours from logs
    const athleteLogs = caraLogs.filter((l) => l.athleteId === athlete.id)
    const currentHours = parseFloat(athleteLogs.reduce((sum, l) => sum + l.hours, 0).toFixed(2))

    // Scheduled upcoming hours from events where athlete is REQUIRED attendee
    const athleteUpcoming = upcomingEvents
      .filter((e) => e.attendees.some((att) => att.userId === athlete.id && att.status === 'REQUIRED'))
      .map((e) => {
        const hours = parseFloat(((new Date(e.end) - new Date(e.start)) / (1000 * 60 * 60)).toFixed(2))
        const dayName = dayNames[new Date(e.start).getDay()]
        return {
          id: e.id,
          title: e.title,
          date: dayName,
          hours,
          isVoluntary: e.isVoluntary,
        }
      })

    const scheduledHours = parseFloat(athleteUpcoming.reduce((sum, e) => sum + e.hours, 0).toFixed(2))
    const projectedHours = parseFloat((currentHours + scheduledHours).toFixed(2))
    const remainingHours = parseFloat(Math.max(0, maxWeek - currentHours).toFixed(2))
    const projectedRemaining = parseFloat(Math.max(0, maxWeek - projectedHours).toFixed(2))

    const status =
      projectedHours >= maxWeek
        ? 'violation'
        : projectedHours >= maxWeek * 0.95
        ? 'risk'
        : projectedHours >= maxWeek * 0.85
        ? 'warning'
        : 'ok'

    // Daily breakdown (current + scheduled)
    const daily = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }

    // Add current logged hours by day
    const wsTime = weekStart.getTime()
    for (const log of athleteLogs) {
      const logDate = new Date(log.createdAt)
      const offset = Math.floor((logDate.getTime() - wsTime) / (24 * 60 * 60 * 1000))
      if (offset >= 0 && offset <= 6) {
        const key = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][offset]
        if (key) daily[key] = parseFloat((daily[key] + log.hours).toFixed(2))
      }
    }

    // Add upcoming event hours by day
    for (const evt of athleteUpcoming) {
      if (daily[evt.date] !== undefined) {
        daily[evt.date] = parseFloat((daily[evt.date] + evt.hours).toFixed(2))
      }
    }

    return {
      id: athlete.id,
      name: athlete.name,
      currentHours,
      scheduledHours,
      projectedHours,
      limit: maxWeek,
      remainingHours,
      projectedRemaining,
      status,
      dailyBreakdown: daily,
      upcomingEvents: athleteUpcoming,
    }
  })

  // Smart insights — find athletes projected to exceed limit
  const overLimitAthletes = athleteForecasts.filter((a) => a.projectedHours > maxWeek)
  const insights = overLimitAthletes.map((a) => {
    const overage = parseFloat((a.projectedHours - maxWeek).toFixed(2))
    // Find the most recent upcoming event that could be made voluntary
    const filmOrMeeting = a.upcomingEvents.find(
      (e) => !e.isVoluntary
    )
    const suggestion = filmOrMeeting
      ? `Consider making [${filmOrMeeting.title} ${filmOrMeeting.date}] voluntary.`
      : 'Consider reducing scheduled hours.'
    return {
      athleteId: a.id,
      athleteName: a.name,
      projectedHours: a.projectedHours,
      overage,
      message: `⚠️ If all planned events run, ${a.name} will exceed D1 weekly limit by ${overage} hours. ${suggestion}`,
    }
  })

  res.json({
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    limit: maxWeek,
    athletes: athleteForecasts,
    totals: {
      total: athletes.length,
      onTrack: athleteForecasts.filter((a) => a.status === 'ok').length,
      warning: athleteForecasts.filter((a) => a.status === 'warning').length,
      risk: athleteForecasts.filter((a) => a.status === 'risk').length,
      violation: athleteForecasts.filter((a) => a.status === 'violation').length,
    },
    insights,
  })
})

// ─── GET /api/compliance/export/pdf ───────────────────────────────────────────
router.get('/export/pdf', role('COACH', 'AD', 'ADMIN'), async (req, res) => {
  const { teamId, weekStart: weekStartStr } = req.query
  if (!teamId) return res.status(400).json({ error: 'teamId is required' })

  const team = await loadTeam(teamId)
  if (!team) return res.status(404).json({ error: 'Team not found' })

  const weekStart = getWeekStartDate(weekStartStr)
  const weekEnd = getWeekEndDate(weekStart)

  const athletes = team.members.filter((m) => m.role === 'ATHLETE')
  const athleteIds = athletes.map((a) => a.id)
  const caraLogs = athleteIds.length > 0
    ? await loadCARALogs(athleteIds, weekStart, weekEnd)
    : []

  try {
    const pdfBuffer = await generatePDFReport({
      teamId,
      weekStart,
      weekEnd,
      caraLogs,
      ruleset: team.complianceRuleset,
      team,
    })

    const weekStr = weekStart.toISOString().split('T')[0]
    const filename = `compliance-${team.sport.replace(/\s+/g, '-').toLowerCase()}-${weekStr}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    res.send(pdfBuffer)
  } catch (err) {
    console.error('[compliance/export/pdf]', err)
    res.status(500).json({ error: 'Failed to generate PDF report' })
  }
})

// ─── GET /api/compliance/export/csv ───────────────────────────────────────────
router.get('/export/csv', role('COACH', 'AD', 'ADMIN'), async (req, res) => {
  const { teamId, weekStart: weekStartStr } = req.query
  if (!teamId) return res.status(400).json({ error: 'teamId is required' })

  const team = await loadTeam(teamId)
  if (!team) return res.status(404).json({ error: 'Team not found' })

  const weekStart = getWeekStartDate(weekStartStr)
  const weekEnd = getWeekEndDate(weekStart)

  const athletes = team.members.filter((m) => m.role === 'ATHLETE')
  const athleteIds = athletes.map((a) => a.id)
  const caraLogs = athleteIds.length > 0
    ? await loadCARALogs(athleteIds, weekStart, weekEnd)
    : []

  const csv = generateCSVReport({
    teamId,
    weekStart,
    weekEnd,
    caraLogs,
    ruleset: team.complianceRuleset,
    team,
  })

  const weekStr = weekStart.toISOString().split('T')[0]
  const filename = `compliance-${team.sport.replace(/\s+/g, '-').toLowerCase()}-${weekStr}.csv`

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(csv)
})

module.exports = router
