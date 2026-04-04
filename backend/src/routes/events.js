const express = require('express')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')
const role = require('../middleware/role')
const { sendPracticeScheduled, sendScheduleChange } = require('../lib/email')
const { sendPushToTeamAthletes, sendPushToUser } = require('../lib/push')

const router = express.Router()

router.use(auth)

// GET /api/events
router.get('/', async (req, res) => {
  const { teamId, start, end, type } = req.query
  const requester = req.user

  let where = {}

  if (requester.role === 'ATHLETE') {
    // Athletes see events for their team
    if (requester.teamId) where.teamId = requester.teamId
    else return res.json([])
  } else if (teamId) {
    where.teamId = teamId
  }

  if (type) where.type = type
  if (start || end) {
    where.start = {}
    if (start) where.start.gte = new Date(start)
    if (end) where.end = { lte: new Date(end) }
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      venue: { select: { id: true, name: true, type: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { attendees: true } },
    },
    orderBy: { start: 'asc' },
  })
  res.json(events)
})

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: {
      venue: true,
      createdBy: { select: { id: true, name: true } },
      attendees: {
        include: { user: { select: { id: true, name: true, role: true } } },
      },
    },
  })
  if (!event) return res.status(404).json({ error: 'Event not found' })
  res.json(event)
})

// POST /api/events — Coaches, AD, Admin
router.post('/', role('COACH', 'AD', 'ADMIN'), async (req, res) => {
  const { teamId, title, start, end, type, venueId } = req.body

  if (!teamId || !title || !start || !end || !type) {
    return res.status(400).json({ error: 'teamId, title, start, end, and type are required' })
  }

  const event = await prisma.event.create({
    data: {
      teamId,
      title,
      start: new Date(start),
      end: new Date(end),
      type,
      venueId: venueId || null,
      createdById: req.user.id,
    },
    include: { venue: { select: { id: true, name: true } } },
  })

  // Auto-create venue booking if venue provided
  if (venueId) {
    await prisma.venueBooking.create({
      data: { venueId, eventId: event.id, start: new Date(start), end: new Date(end) },
    })
  }

  // Fire-and-forget: notify team athletes of new event (email + push)
  prisma.user.findMany({
    where: { teamId, role: 'ATHLETE' },
    select: { id: true, name: true, email: true },
  }).then((athletes) => {
    sendPracticeScheduled(req.user, athletes, event).catch(console.error)
  }).catch(console.error)

  const startDate = new Date(start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  sendPushToTeamAthletes(teamId, 'New Practice Scheduled', `${title} on ${startDate}`, { eventId: event.id, type: 'EVENT_CREATED' })

  res.status(201).json(event)
})

// PATCH /api/events/:id — Coaches, AD, Admin
router.patch('/:id', role('COACH', 'AD', 'ADMIN'), async (req, res) => {
  const { title, start, end, type, venueId } = req.body
  const event = await prisma.event.update({
    where: { id: req.params.id },
    data: {
      title,
      start: start ? new Date(start) : undefined,
      end: end ? new Date(end) : undefined,
      type,
      venueId,
    },
    include: { venue: { select: { id: true, name: true } } },
  })

  // Fire-and-forget: notify team athletes of schedule change (email + push)
  prisma.eventAttendee.findMany({
    where: { eventId: req.params.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  }).then((attendees) => {
    const athletes = attendees.map((a) => a.user)
    sendScheduleChange(athletes, event, 'UPDATED').catch(console.error)
  }).catch(console.error)

  sendPushToTeamAthletes(event.teamId, 'Schedule Update', `${event.title} has been changed`, { eventId: event.id, type: 'EVENT_UPDATED' })

  res.json(event)
})

// DELETE /api/events/:id — Coaches, AD, Admin
router.delete('/:id', role('COACH', 'AD', 'ADMIN'), async (req, res) => {
  // Fetch event + attendees before deletion for notification
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: {
      attendees: { include: { user: { select: { id: true, name: true, email: true } } } },
      venue: { select: { id: true, name: true } },
    },
  })

  await prisma.event.delete({ where: { id: req.params.id } })

  // Fire-and-forget: notify attendees of cancellation (email + push)
  if (event) {
    const athletes = event.attendees.map((a) => a.user)
    sendScheduleChange(athletes, event, 'CANCELLED').catch(console.error)
    sendPushToTeamAthletes(event.teamId, 'Event Cancelled', `${event.title} has been cancelled`, { type: 'EVENT_DELETED' })
  }

  res.json({ message: 'Event deleted' })
})

// PATCH /api/events/:id/voluntary — toggle isVoluntary (COACH, AD, ADMIN only)
router.patch('/:id/voluntary', role('COACH', 'AD', 'ADMIN'), async (req, res) => {
  const { isVoluntary } = req.body
  if (typeof isVoluntary !== 'boolean') {
    return res.status(400).json({ error: 'isVoluntary must be a boolean' })
  }

  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: {
      attendees: { where: { status: 'REQUIRED' }, select: { userId: true } },
    },
  })
  if (!event) return res.status(404).json({ error: 'Event not found' })

  // Only allow toggling on FILM and MEETING events
  if (!['FILM', 'MEETING'].includes(event.type)) {
    return res.status(400).json({ error: 'Only FILM and MEETING events can be made voluntary' })
  }

  // Compute week start for this event (Monday)
  const eventDate = new Date(event.start)
  const day = eventDate.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const weekStart = new Date(eventDate)
  weekStart.setDate(eventDate.getDate() + diff)
  weekStart.setHours(0, 0, 0, 0)

  const eventHours = (new Date(event.end) - new Date(event.start)) / (1000 * 60 * 60)

  if (isVoluntary) {
    // Delete all CARA log entries for this event — it's now non-countable
    await prisma.cARALog.deleteMany({ where: { eventId: event.id } })
  } else {
    // Recreate CARA log entries for all required attendees
    const athleteIds = event.attendees.map((a) => a.userId)
    if (athleteIds.length > 0) {
      await prisma.cARALog.createMany({
        data: athleteIds.map((athleteId) => ({
          athleteId,
          eventId: event.id,
          hours: eventHours,
          weekStart,
        })),
        skipDuplicates: true,
      })
    }
  }

  const updated = await prisma.event.update({
    where: { id: req.params.id },
    data: { isVoluntary },
    include: { venue: { select: { id: true, name: true } } },
  })

  res.json(updated)
})

// ─── Attendees ────────────────────────────────────────────────────────────────

// GET /api/events/:id/attendees
router.get('/:id/attendees', async (req, res) => {
  const attendees = await prisma.eventAttendee.findMany({
    where: { eventId: req.params.id },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  })
  res.json(attendees)
})

// POST /api/events/:id/attendees — add or update attendee
router.post('/:id/attendees', role('COACH', 'AD', 'ADMIN'), async (req, res) => {
  const { userId, status = 'REQUIRED' } = req.body
  if (!userId) return res.status(400).json({ error: 'userId is required' })

  const attendee = await prisma.eventAttendee.upsert({
    where: { eventId_userId: { eventId: req.params.id, userId } },
    update: { status },
    create: { eventId: req.params.id, userId, status },
  })
  res.status(201).json(attendee)
})

// PATCH /api/events/:id/attendees/:userId — update status
router.patch('/:id/attendees/:userId', role('COACH', 'AD', 'ADMIN'), async (req, res) => {
  const { status } = req.body
  const attendee = await prisma.eventAttendee.update({
    where: { eventId_userId: { eventId: req.params.id, userId: req.params.userId } },
    data: { status },
  })
  res.json(attendee)
})

// DELETE /api/events/:id/attendees/:userId
router.delete('/:id/attendees/:userId', role('COACH', 'AD', 'ADMIN'), async (req, res) => {
  await prisma.eventAttendee.delete({
    where: { eventId_userId: { eventId: req.params.id, userId: req.params.userId } },
  })
  res.json({ message: 'Attendee removed' })
})

module.exports = router
