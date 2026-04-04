const express = require('express')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')
const role = require('../middleware/role')

const router = express.Router()

router.use(auth)

// GET /api/venues
router.get('/', async (req, res) => {
  const { type } = req.query
  const where = { schoolId: req.user.schoolId }
  if (type) where.type = type

  const venues = await prisma.venue.findMany({
    where,
    orderBy: { name: 'asc' },
  })
  res.json(venues)
})

// GET /api/venues/:id
router.get('/:id', async (req, res) => {
  const venue = await prisma.venue.findUnique({
    where: { id: req.params.id },
    include: {
      bookings: {
        where: { start: { gte: new Date() } },
        orderBy: { start: 'asc' },
        take: 20,
      },
    },
  })
  if (!venue) return res.status(404).json({ error: 'Venue not found' })
  res.json(venue)
})

// POST /api/venues — AD, Admin
router.post('/', role('AD', 'ADMIN'), async (req, res) => {
  const { name, type, capacity } = req.body
  if (!name || !type) return res.status(400).json({ error: 'name and type are required' })

  const venue = await prisma.venue.create({
    data: { name, type, capacity: capacity || null, schoolId: req.user.schoolId },
  })
  res.status(201).json(venue)
})

// PATCH /api/venues/:id — AD, Admin
router.patch('/:id', role('AD', 'ADMIN'), async (req, res) => {
  const { name, type, capacity } = req.body
  const venue = await prisma.venue.update({
    where: { id: req.params.id },
    data: { name, type, capacity },
  })
  res.json(venue)
})

// DELETE /api/venues/:id — Admin
router.delete('/:id', role('ADMIN'), async (req, res) => {
  await prisma.venue.delete({ where: { id: req.params.id } })
  res.json({ message: 'Venue deleted' })
})

module.exports = router
