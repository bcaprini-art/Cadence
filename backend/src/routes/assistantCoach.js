const express = require('express')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')
const role = require('../middleware/role')

const router = express.Router()

router.use(auth)

// GET /team/:teamId — list assistant coaches for a team with their permissions
router.get('/team/:teamId', role('COACH', 'AD', 'ADMIN'), async (req, res) => {
  const assistants = await prisma.assistantCoachTeam.findMany({
    where: { teamId: req.params.teamId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  res.json(assistants)
})

// POST / — add assistant coach to team
router.post('/', role('COACH', 'ADMIN'), async (req, res) => {
  const {
    userId,
    teamId,
    canManageRoster,
    canSchedule,
    canViewGrades,
    canViewTravel,
  } = req.body

  if (!userId || !teamId) {
    return res.status(400).json({ error: 'userId and teamId are required' })
  }

  const assistant = await prisma.assistantCoachTeam.upsert({
    where: {
      userId_teamId: { userId, teamId },
    },
    update: {
      canManageRoster: canManageRoster !== undefined ? canManageRoster : undefined,
      canSchedule: canSchedule !== undefined ? canSchedule : undefined,
      canViewGrades: canViewGrades !== undefined ? canViewGrades : undefined,
      canViewTravel: canViewTravel !== undefined ? canViewTravel : undefined,
    },
    create: {
      userId,
      teamId,
      canManageRoster: canManageRoster || false,
      canSchedule: canSchedule !== undefined ? canSchedule : true,
      canViewGrades: canViewGrades !== undefined ? canViewGrades : true,
      canViewTravel: canViewTravel !== undefined ? canViewTravel : true,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  res.status(201).json(assistant)
})

// PUT /:id — update assistant coach permissions
router.put('/:id', role('COACH', 'ADMIN'), async (req, res) => {
  const { canManageRoster, canSchedule, canViewGrades, canViewTravel } = req.body

  const existing = await prisma.assistantCoachTeam.findUnique({
    where: { id: req.params.id },
  })

  if (!existing) return res.status(404).json({ error: 'Assistant coach entry not found' })

  const assistant = await prisma.assistantCoachTeam.update({
    where: { id: req.params.id },
    data: {
      canManageRoster,
      canSchedule,
      canViewGrades,
      canViewTravel,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  res.json(assistant)
})

// DELETE /:id — remove assistant coach from team
router.delete('/:id', role('COACH', 'ADMIN'), async (req, res) => {
  const existing = await prisma.assistantCoachTeam.findUnique({
    where: { id: req.params.id },
  })

  if (!existing) return res.status(404).json({ error: 'Assistant coach entry not found' })

  await prisma.assistantCoachTeam.delete({
    where: { id: req.params.id },
  })

  res.json({ message: 'Assistant coach removed from team' })
})

module.exports = router
