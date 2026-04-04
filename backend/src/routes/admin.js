const express = require('express')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')
const role = require('../middleware/role')

const router = express.Router()

// All admin routes require authentication + AD or ADMIN role
router.use(auth)
router.use(role('AD', 'ADMIN'))

/**
 * GET /api/admin/schools
 * List all schools with team counts and athlete counts
 */
router.get('/schools', async (req, res) => {
  const schools = await prisma.school.findMany({
    orderBy: { name: 'asc' },
    include: {
      teams: {
        include: {
          members: {
            where: { role: 'ATHLETE' },
            select: { id: true },
          },
        },
      },
      users: {
        where: { role: 'ATHLETE' },
        select: { id: true },
      },
    },
  })

  // Also fetch CARA logs for the current week per school
  const now = new Date()
  const dayOfWeek = now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  weekStart.setHours(0, 0, 0, 0)

  const result = await Promise.all(
    schools.map(async (school) => {
      const athleteIds = school.users.map((u) => u.id)

      let avgCARAHours = 0
      let athletesAtRisk = 0

      if (athleteIds.length > 0) {
        const caraLogs = await prisma.cARALog.findMany({
          where: {
            athleteId: { in: athleteIds },
            weekStart: { gte: weekStart },
          },
        })

        // Sum hours per athlete
        const hoursByAthlete = {}
        for (const log of caraLogs) {
          hoursByAthlete[log.athleteId] = (hoursByAthlete[log.athleteId] || 0) + log.hours
        }

        const hoursArr = Object.values(hoursByAthlete)
        if (hoursArr.length > 0) {
          avgCARAHours = hoursArr.reduce((a, b) => a + b, 0) / hoursArr.length
        }

        // At risk = >= 85% of 20h (D1 default)
        athletesAtRisk = hoursArr.filter((h) => h >= 17).length
      }

      return {
        id: school.id,
        name: school.name,
        conference: school.conference,
        timezone: school.timezone,
        teamCount: school.teams.length,
        athleteCount: school.users.length,
        avgCARAHours: parseFloat(avgCARAHours.toFixed(1)),
        athletesAtRisk,
        riskStatus:
          athletesAtRisk > 0
            ? athletesAtRisk >= 3
              ? 'high'
              : 'medium'
            : 'low',
      }
    })
  )

  res.json(result)
})

/**
 * GET /api/admin/schools/:id/teams
 * All teams for a school with compliance overview
 */
router.get('/schools/:id/teams', async (req, res) => {
  const school = await prisma.school.findUnique({
    where: { id: req.params.id },
  })
  if (!school) return res.status(404).json({ error: 'School not found' })

  const teams = await prisma.team.findMany({
    where: { schoolId: req.params.id },
    include: {
      members: {
        select: { id: true, name: true, role: true },
      },
      complianceRuleset: true,
      events: {
        where: { start: { gte: new Date() } },
        orderBy: { start: 'asc' },
        take: 5,
        select: { id: true, title: true, type: true, start: true, end: true },
      },
    },
    orderBy: { sport: 'asc' },
  })

  const now = new Date()
  const dayOfWeek = now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  weekStart.setHours(0, 0, 0, 0)

  const result = await Promise.all(
    teams.map(async (team) => {
      const athletes = team.members.filter((m) => m.role === 'ATHLETE')
      const coaches = team.members.filter((m) => m.role === 'COACH')
      const athleteIds = athletes.map((a) => a.id)

      let avgCARAHours = 0
      let violations = 0
      let warnings = 0

      if (athleteIds.length > 0) {
        const caraLogs = await prisma.cARALog.findMany({
          where: { athleteId: { in: athleteIds }, weekStart: { gte: weekStart } },
        })

        const hoursByAthlete = {}
        for (const log of caraLogs) {
          hoursByAthlete[log.athleteId] = (hoursByAthlete[log.athleteId] || 0) + log.hours
        }

        const maxWeek =
          team.complianceRuleset?.maxCaraHoursWeek || 20

        const hoursArr = Object.values(hoursByAthlete)
        if (hoursArr.length > 0) {
          avgCARAHours = hoursArr.reduce((a, b) => a + b, 0) / hoursArr.length
        }
        violations = hoursArr.filter((h) => h >= maxWeek).length
        warnings = hoursArr.filter((h) => h >= maxWeek * 0.85 && h < maxWeek).length
      }

      return {
        id: team.id,
        sport: team.sport,
        division: team.division,
        athleteCount: athletes.length,
        coachCount: coaches.length,
        avgCARAHours: parseFloat(avgCARAHours.toFixed(1)),
        violations,
        warnings,
        complianceStatus:
          violations > 0 ? 'violation' : warnings > 0 ? 'warning' : 'ok',
        upcomingEvents: team.events,
      }
    })
  )

  res.json({ school, teams: result })
})

/**
 * GET /api/admin/schools/:id/stats
 * Aggregate stats for a school
 */
router.get('/schools/:id/stats', async (req, res) => {
  const school = await prisma.school.findUnique({
    where: { id: req.params.id },
    include: {
      users: { select: { id: true, role: true } },
      teams: { select: { id: true } },
    },
  })
  if (!school) return res.status(404).json({ error: 'School not found' })

  const athletes = school.users.filter((u) => u.role === 'ATHLETE')
  const coaches = school.users.filter((u) => u.role === 'COACH')
  const athleteIds = athletes.map((a) => a.id)

  const now = new Date()
  const dayOfWeek = now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  weekStart.setHours(0, 0, 0, 0)

  let avgCARAHours = 0
  let athletesAtRisk = 0

  if (athleteIds.length > 0) {
    const caraLogs = await prisma.cARALog.findMany({
      where: { athleteId: { in: athleteIds }, weekStart: { gte: weekStart } },
    })

    const hoursByAthlete = {}
    for (const log of caraLogs) {
      hoursByAthlete[log.athleteId] = (hoursByAthlete[log.athleteId] || 0) + log.hours
    }

    const hoursArr = Object.values(hoursByAthlete)
    if (hoursArr.length > 0) {
      avgCARAHours = hoursArr.reduce((a, b) => a + b, 0) / hoursArr.length
    }
    athletesAtRisk = hoursArr.filter((h) => h >= 17).length
  }

  const upcomingEvents = await prisma.event.findMany({
    where: {
      team: { schoolId: req.params.id },
      start: { gte: new Date() },
    },
    orderBy: { start: 'asc' },
    take: 10,
    select: {
      id: true,
      title: true,
      type: true,
      start: true,
      end: true,
      team: { select: { sport: true } },
    },
  })

  res.json({
    totalAthletes: athletes.length,
    totalCoaches: coaches.length,
    totalTeams: school.teams.length,
    avgCARAHours: parseFloat(avgCARAHours.toFixed(1)),
    athletesAtRisk,
    upcomingEvents,
  })
})

/**
 * GET /api/admin/venues
 * All venues across all schools (or filtered by schoolId) with booking calendar
 */
router.get('/venues', async (req, res) => {
  const { schoolId } = req.query

  const where = schoolId ? { schoolId } : {}

  const venues = await prisma.venue.findMany({
    where,
    orderBy: [{ schoolId: 'asc' }, { name: 'asc' }],
    include: {
      school: { select: { id: true, name: true } },
      bookings: {
        where: {
          start: { gte: new Date() },
          end: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // next 30 days
          },
        },
        orderBy: { start: 'asc' },
        include: {
          event: { select: { id: true, title: true, type: true, team: { select: { sport: true } } } },
        },
      },
    },
  })

  res.json(venues)
})

module.exports = router
