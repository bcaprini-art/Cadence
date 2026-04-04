const express = require('express')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')
const { ferpaSerializer } = require('../middleware/ferpa')
const { auditLog } = require('../middleware/auditLog')

const router = express.Router()

// All routes use FERPA serializer (coaches get redacted output)
router.use(auth)
router.use(ferpaSerializer)

// GET /api/schedule-blocks
// Athletes: own blocks only
// Coaches/AD/Admin: all blocks for their team (FERPA-redacted)
router.get('/', auditLog('GET_SCHEDULE_BLOCKS'), async (req, res) => {
  const { userId, teamId, start, end } = req.query
  const requester = req.user

  let where = {}

  if (requester.role === 'ATHLETE') {
    // Athletes only see their own blocks
    where.userId = requester.id
  } else if (requester.role === 'COACH') {
    // Coaches see blocks for athletes on their team
    if (teamId) {
      const athletes = await prisma.user.findMany({
        where: { teamId, role: 'ATHLETE' },
        select: { id: true },
      })
      where.userId = { in: athletes.map((a) => a.id) }
    } else {
      where.userId = userId || requester.id
    }
  } else {
    // AD/Admin can filter by userId or teamId
    if (userId) where.userId = userId
    else if (teamId) {
      const members = await prisma.user.findMany({
        where: { teamId },
        select: { id: true },
      })
      where.userId = { in: members.map((m) => m.id) }
    }
  }

  if (start) where.start = { gte: new Date(start) }
  if (end) where.end = { ...(where.end || {}), lte: new Date(end) }

  const blocks = await prisma.scheduleBlock.findMany({
    where,
    include: { user: { select: { id: true, name: true } } },
    orderBy: { start: 'asc' },
  })

  res.json(blocks)
})

// GET /api/schedule-blocks/:id
router.get('/:id', auditLog('GET_SCHEDULE_BLOCK_BY_ID'), async (req, res) => {
  const block = await prisma.scheduleBlock.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, name: true } } },
  })
  if (!block) return res.status(404).json({ error: 'Schedule block not found' })

  // Athletes can only see their own blocks
  if (req.user.role === 'ATHLETE' && block.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' })
  }

  res.json(block)
})

// POST /api/schedule-blocks — athletes create their own, admins can create for others
router.post('/', async (req, res) => {
  const { userId, title, start, end, type, isHardBlock, visibility, source } = req.body

  if (!start || !end || !type) {
    return res.status(400).json({ error: 'start, end, and type are required' })
  }

  // Athletes can only create blocks for themselves
  const targetUserId = req.user.role === 'ATHLETE' ? req.user.id : userId || req.user.id

  if (req.user.role === 'ATHLETE' && userId && userId !== req.user.id) {
    return res.status(403).json({ error: 'Athletes can only create blocks for themselves' })
  }

  const block = await prisma.scheduleBlock.create({
    data: {
      userId: targetUserId,
      title: title || null,
      start: new Date(start),
      end: new Date(end),
      type,
      isHardBlock: isHardBlock !== undefined ? isHardBlock : true,
      visibility: visibility || 'BUSY',
      source: source || 'MANUAL',
    },
  })
  res.status(201).json(block)
})

// PATCH /api/schedule-blocks/:id
router.patch('/:id', async (req, res) => {
  const block = await prisma.scheduleBlock.findUnique({ where: { id: req.params.id } })
  if (!block) return res.status(404).json({ error: 'Schedule block not found' })

  if (req.user.role === 'ATHLETE' && block.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' })
  }

  const { title, start, end, type, isHardBlock, visibility, source } = req.body
  const updated = await prisma.scheduleBlock.update({
    where: { id: req.params.id },
    data: {
      title,
      start: start ? new Date(start) : undefined,
      end: end ? new Date(end) : undefined,
      type,
      isHardBlock,
      visibility,
      source,
    },
  })
  res.json(updated)
})

// DELETE /api/schedule-blocks/:id
router.delete('/:id', async (req, res) => {
  const block = await prisma.scheduleBlock.findUnique({ where: { id: req.params.id } })
  if (!block) return res.status(404).json({ error: 'Schedule block not found' })

  if (req.user.role === 'ATHLETE' && block.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' })
  }

  await prisma.scheduleBlock.delete({ where: { id: req.params.id } })
  res.json({ message: 'Schedule block deleted' })
})

module.exports = router
