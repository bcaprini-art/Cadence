const express = require('express')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')
const role = require('../middleware/role')

const router = express.Router()

// GET /api/users/me — current user profile
router.get('/me', auth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      schoolId: true,
      teamId: true,
      createdAt: true,
      team: { select: { id: true, sport: true, division: true } },
      school: { select: { id: true, name: true, timezone: true } },
    },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

// GET /api/users?teamId=... — list team members (coach/AD/admin)
router.get('/', auth, role('COACH', 'AD', 'ADMIN'), async (req, res) => {
  const { teamId } = req.query
  const where = teamId ? { teamId } : { schoolId: req.user.schoolId }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, teamId: true, createdAt: true },
    orderBy: { name: 'asc' },
  })
  res.json(users)
})

// GET /api/users/:id — get user profile
router.get('/:id', auth, async (req, res) => {
  const requestedId = req.params.id
  const requester = req.user

  // Athletes can only view their own profile unless they're a coach+
  if (requester.role === 'ATHLETE' && requester.id !== requestedId) {
    return res.status(403).json({ error: 'Access denied' })
  }

  const user = await prisma.user.findUnique({
    where: { id: requestedId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      schoolId: true,
      teamId: true,
      createdAt: true,
      team: { select: { id: true, sport: true, division: true } },
    },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

// PATCH /api/users/:id — update profile (own or admin)
router.patch('/:id', auth, async (req, res) => {
  const requestedId = req.params.id

  if (req.user.role !== 'ADMIN' && req.user.id !== requestedId) {
    return res.status(403).json({ error: 'Access denied' })
  }

  const { name, teamId } = req.body
  const user = await prisma.user.update({
    where: { id: requestedId },
    data: { name, teamId },
    select: { id: true, name: true, email: true, role: true, teamId: true },
  })
  res.json(user)
})

module.exports = router
