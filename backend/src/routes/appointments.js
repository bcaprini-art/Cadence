const express = require('express')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')
const role = require('../middleware/role')

const router = express.Router()

router.use(auth)

// GET /api/appointments — list appointments (athlete sees own, coach sees theirs + athletes')
router.get('/', async (req, res) => {
  const { role: userRole, id: userId, teamId } = req.user

  let where = {}
  if (userRole === 'ATHLETE') {
    where.athleteId = userId
  } else if (userRole === 'COACH' || userRole === 'ASSISTANT_COACH') {
    // Coaches see their own appointments + appointments of athletes on their team
    where.OR = [
      { coachId: userId },
      { athlete: { teamId } },
    ]
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      athlete: { select: { id: true, name: true, email: true } },
      coach: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'asc' },
  })

  res.json(appointments)
})

// GET /api/appointments/:id
router.get('/:id', async (req, res) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: {
      athlete: { select: { id: true, name: true, email: true } },
      coach: { select: { id: true, name: true } },
    },
  })

  if (!appointment) return res.status(404).json({ error: 'Appointment not found' })
  res.json(appointment)
})

// POST /api/appointments — athletes book, coaches can create on behalf
router.post('/', async (req, res) => {
  const { title, type, startTime, endTime, notes, coachId } = req.body
  const athleteId = req.user.role === 'ATHLETE' ? req.user.id : (req.body.athleteId || req.user.id)

  if (!title || !type || !startTime) {
    return res.status(400).json({ error: 'title, type, and startTime are required' })
  }

  const validTypes = ['OFFICE_VISIT', 'TRAINING_SESSION', 'ATHLETIC_TRAINING', 'SPORTS_PSYCHOLOGY']
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` })
  }

  const appointment = await prisma.appointment.create({
    data: {
      athleteId,
      coachId: coachId || null,
      title,
      type,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      notes: notes || null,
    },
    include: {
      athlete: { select: { id: true, name: true } },
      coach: { select: { id: true, name: true } },
    },
  })

  // Create notification for the coach if assigned
  if (coachId) {
    prisma.notification.create({
      data: {
        userId: coachId,
        title: 'New Appointment Booked',
        body: `${req.user.name} booked a ${type.replace(/_/g, ' ').toLowerCase()}: ${title}`,
        type: 'APPOINTMENT_BOOKED',
        link: `/appointments`,
      },
    }).catch(console.error)
  }

  res.status(201).json(appointment)
})

// PATCH /api/appointments/:id — update status (coach confirms, cancel, etc.)
router.patch('/:id', async (req, res) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: req.params.id },
  })

  if (!existing) return res.status(404).json({ error: 'Appointment not found' })

  // Only the athlete or the coach/AD can update
  const isOwner = existing.athleteId === req.user.id
  const isCoach = existing.coachId === req.user.id
  const isAdmin = req.user.role === 'AD' || req.user.role === 'ADMIN'

  if (!isOwner && !isCoach && !isAdmin) {
    return res.status(403).json({ error: 'Not authorized to update this appointment' })
  }

  const { title, type, status, startTime, endTime, notes, coachId } = req.body

  const appointment = await prisma.appointment.update({
    where: { id: req.params.id },
    data: {
      title,
      type,
      status,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime !== undefined ? (endTime ? new Date(endTime) : null) : undefined,
      notes,
      coachId: coachId !== undefined ? coachId : undefined,
    },
    include: {
      athlete: { select: { id: true, name: true } },
      coach: { select: { id: true, name: true } },
    },
  })

  // Notify athlete of status change
  if (status) {
    const statusMsg = status === 'CONFIRMED' ? 'confirmed'
      : status === 'CANCELLED' ? 'cancelled'
      : status === 'COMPLETED' ? 'completed'
      : 'updated'

    prisma.notification.create({
      data: {
        userId: existing.athleteId,
        title: `Appointment ${statusMsg}`,
        body: `Your ${existing.type.replace(/_/g, ' ').toLowerCase()} "${existing.title}" has been ${statusMsg}`,
        type: 'APPOINTMENT_STATUS',
        link: '/appointments',
      },
    }).catch(console.error)
  }

  res.json(appointment)
})

// DELETE /api/appointments/:id
router.delete('/:id', role('ATHLETE', 'COACH', 'AD', 'ADMIN'), async (req, res) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: req.params.id },
  })

  if (!existing) return res.status(404).json({ error: 'Appointment not found' })

  const isOwner = existing.athleteId === req.user.id
  const isCoach = existing.coachId === req.user.id || req.user.role === 'COACH'
  const isAdmin = req.user.role === 'AD' || req.user.role === 'ADMIN'

  if (!isOwner && !isCoach && !isAdmin) {
    return res.status(403).json({ error: 'Not authorized to delete this appointment' })
  }

  await prisma.appointment.delete({ where: { id: req.params.id } })
  res.json({ message: 'Appointment deleted' })
})

module.exports = router
