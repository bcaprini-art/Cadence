const express = require('express')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')
const role = require('../middleware/role')
const { sendPushToUser } = require('../lib/push')

const router = express.Router()

router.use(auth)

/**
 * GET /api/cara-log
 * Query params:
 *   - athleteId (coaches/AD/admin only; defaults to self for athletes)
 *   - teamId (coaches/AD/admin: all athletes on team)
 *   - weeks (rolling window in weeks, default 4)
 */
router.get('/', async (req, res) => {
  const { athleteId, teamId, weeks = 4 } = req.query
  const requester = req.user

  const windowStart = new Date()
  windowStart.setDate(windowStart.getDate() - parseInt(weeks) * 7)

  let athleteIds = []

  if (requester.role === 'ATHLETE') {
    athleteIds = [requester.id]
  } else if (teamId) {
    const athletes = await prisma.user.findMany({
      where: { teamId, role: 'ATHLETE' },
      select: { id: true },
    })
    athleteIds = athletes.map((a) => a.id)
  } else if (athleteId) {
    athleteIds = [athleteId]
  } else {
    return res.status(400).json({ error: 'athleteId or teamId required for non-athlete roles' })
  }

  const logs = await prisma.cARALog.findMany({
    where: {
      athleteId: { in: athleteIds },
      weekStart: { gte: windowStart },
    },
    include: {
      athlete: { select: { id: true, name: true } },
      event: { select: { id: true, title: true, type: true, start: true, end: true } },
    },
    orderBy: { weekStart: 'desc' },
  })

  // Aggregate by athlete and week
  const summary = {}
  for (const log of logs) {
    const key = `${log.athleteId}_${log.weekStart.toISOString().split('T')[0]}`
    if (!summary[key]) {
      summary[key] = {
        athleteId: log.athleteId,
        athleteName: log.athlete.name,
        weekStart: log.weekStart,
        totalHours: 0,
        logs: [],
      }
    }
    summary[key].totalHours += log.hours
    summary[key].logs.push(log)
  }

  res.json({
    windowStart,
    windowEnd: new Date(),
    entries: Object.values(summary).sort((a, b) => b.weekStart - a.weekStart),
    raw: logs,
  })
})

// POST /api/cara-log — log CARA hours manually (coaches/admin)
router.post('/', role('COACH', 'AD', 'ADMIN'), async (req, res) => {
  const { athleteId, eventId, hours, weekStart } = req.body

  if (!athleteId || !hours) {
    return res.status(400).json({ error: 'athleteId and hours are required' })
  }

  const wkStart = weekStart ? new Date(weekStart) : new Date()
  const log = await prisma.cARALog.create({
    data: {
      athleteId,
      eventId: eventId || null,
      hours: parseFloat(hours),
      weekStart: wkStart,
    },
  })

  // Check CARA >85% threshold — fire-and-forget push to coach(es)
  ;(async () => {
    try {
      // Sum all hours for this athlete this week
      const weekEnd = new Date(wkStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      const weekLogs = await prisma.cARALog.findMany({
        where: { athleteId, weekStart: { gte: wkStart, lt: weekEnd } },
        select: { hours: true },
      })
      const totalHours = weekLogs.reduce((sum, l) => sum + l.hours, 0)

      // Get athlete + their team's compliance ruleset
      const athlete = await prisma.user.findUnique({
        where: { id: athleteId },
        include: {
          team: { include: { complianceRuleset: true } },
        },
      })
      const maxHours = athlete?.team?.complianceRuleset?.maxCaraHoursWeek || 20

      if (totalHours >= maxHours * 0.85) {
        // Find coaches on this team
        if (athlete?.teamId) {
          const coaches = await prisma.user.findMany({
            where: { teamId: athlete.teamId, role: 'COACH' },
            select: { id: true },
          })
          const alertTitle = 'CARA Alert'
          const alertBody = `${athlete.name} is at ${totalHours.toFixed(1)}/${maxHours} hours this week`
          for (const coach of coaches) {
            sendPushToUser(coach.id, alertTitle, alertBody, { athleteId, type: 'CARA_WARNING' })
          }
        }
      }
    } catch (err) {
      console.error('[push] CARA threshold check error:', err.message)
    }
  })()

  res.status(201).json(log)
})

module.exports = router
