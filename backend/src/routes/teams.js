const express = require('express')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')
const role = require('../middleware/role')

const router = express.Router()

// GET /api/teams — scoped to user's school
router.get('/', auth, async (req, res) => {
  const { schoolId } = req.user
  const teams = await prisma.team.findMany({
    where: { schoolId },
    include: { complianceRuleset: true, _count: { select: { members: true } } },
    orderBy: { sport: 'asc' },
  })
  res.json(teams)
})

// GET /api/teams/:id
router.get('/:id', auth, async (req, res) => {
  const team = await prisma.team.findUnique({
    where: { id: req.params.id },
    include: {
      complianceRuleset: true,
      members: { select: { id: true, name: true, email: true, role: true } },
    },
  })
  if (!team) return res.status(404).json({ error: 'Team not found' })
  res.json(team)
})

// POST /api/teams — AD or Admin
router.post('/', auth, role('AD', 'ADMIN'), async (req, res) => {
  const { sport, division, complianceRulesetId } = req.body
  if (!sport || !division) return res.status(400).json({ error: 'sport and division are required' })

  const team = await prisma.team.create({
    data: {
      sport,
      division,
      schoolId: req.user.schoolId,
      complianceRulesetId: complianceRulesetId || null,
    },
  })
  res.status(201).json(team)
})

// PATCH /api/teams/:id — AD or Admin
router.patch('/:id', auth, role('AD', 'ADMIN'), async (req, res) => {
  const { sport, division, complianceRulesetId } = req.body
  const team = await prisma.team.update({
    where: { id: req.params.id },
    data: { sport, division, complianceRulesetId },
  })
  res.json(team)
})

// DELETE /api/teams/:id — Admin only
router.delete('/:id', auth, role('ADMIN'), async (req, res) => {
  await prisma.team.delete({ where: { id: req.params.id } })
  res.json({ message: 'Team deleted' })
})

module.exports = router
