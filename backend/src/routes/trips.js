const express = require('express')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')
const role = require('../middleware/role')

const router = express.Router()

router.use(auth)

// GET / — list trips for user's team
router.get('/', async (req, res) => {
  let teamId

  if (req.user.role === 'ATHLETE') {
    teamId = req.user.teamId
  } else {
    teamId = req.query.teamId || req.user.teamId
  }

  if (!teamId) {
    return res.status(400).json({ error: 'No team ID available' })
  }

  const trips = await prisma.trip.findMany({
    where: { teamId },
    include: {
      events: true,
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(trips)
})

// GET /:id — get single trip with events
router.get('/:id', async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: {
      events: true,
      createdBy: { select: { id: true, name: true } },
      team: { select: { id: true, sport: true } },
    },
  })

  if (!trip) return res.status(404).json({ error: 'Trip not found' })

  res.json(trip)
})

// POST / — create trip (COACH, ADMIN)
router.post('/', role('COACH', 'ADMIN'), async (req, res) => {
  const {
    teamId,
    destination,
    hotelName,
    hotelAddress,
    hotelPhone,
    checkIn,
    checkOut,
    departTime,
    returnTime,
    foodOptions,
    notes,
  } = req.body

  if (!teamId || !destination) {
    return res.status(400).json({ error: 'teamId and destination are required' })
  }

  const trip = await prisma.trip.create({
    data: {
      teamId,
      destination,
      hotelName,
      hotelAddress,
      hotelPhone,
      checkIn: checkIn ? new Date(checkIn) : undefined,
      checkOut: checkOut ? new Date(checkOut) : undefined,
      departTime: departTime ? new Date(departTime) : undefined,
      returnTime: returnTime ? new Date(returnTime) : undefined,
      foodOptions: foodOptions || undefined,
      notes,
      createdById: req.user.id,
    },
    include: {
      events: true,
      createdBy: { select: { id: true, name: true } },
    },
  })

  res.status(201).json(trip)
})

// PUT /:id — update trip (COACH, ADMIN)
router.put('/:id', role('COACH', 'ADMIN'), async (req, res) => {
  const {
    destination,
    hotelName,
    hotelAddress,
    hotelPhone,
    checkIn,
    checkOut,
    departTime,
    returnTime,
    foodOptions,
    notes,
  } = req.body

  const existing = await prisma.trip.findUnique({
    where: { id: req.params.id },
  })

  if (!existing) return res.status(404).json({ error: 'Trip not found' })

  const trip = await prisma.trip.update({
    where: { id: req.params.id },
    data: {
      destination,
      hotelName,
      hotelAddress,
      hotelPhone,
      checkIn: checkIn !== undefined ? (checkIn ? new Date(checkIn) : null) : undefined,
      checkOut: checkOut !== undefined ? (checkOut ? new Date(checkOut) : null) : undefined,
      departTime: departTime !== undefined ? (departTime ? new Date(departTime) : null) : undefined,
      returnTime: returnTime !== undefined ? (returnTime ? new Date(returnTime) : null) : undefined,
      foodOptions: foodOptions !== undefined ? foodOptions : undefined,
      notes,
    },
    include: {
      events: true,
      createdBy: { select: { id: true, name: true } },
    },
  })

  res.json(trip)
})

// DELETE /:id — delete trip (COACH, ADMIN)
router.delete('/:id', role('COACH', 'ADMIN'), async (req, res) => {
  const existing = await prisma.trip.findUnique({
    where: { id: req.params.id },
  })

  if (!existing) return res.status(404).json({ error: 'Trip not found' })

  await prisma.trip.delete({
    where: { id: req.params.id },
  })

  res.json({ message: 'Trip deleted' })
})

module.exports = router
