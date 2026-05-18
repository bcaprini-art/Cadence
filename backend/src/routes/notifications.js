const express = require('express')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')

const router = express.Router()

router.use(auth)

// GET /api/notifications — list current user's notifications (newest first)
router.get('/', async (req, res) => {
  const { unreadOnly } = req.query

  let where = { userId: req.user.id }
  if (unreadOnly === 'true') where.read = false

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  res.json(notifications)
})

// GET /api/notifications/unread-count
router.get('/unread-count', async (req, res) => {
  const count = await prisma.notification.count({
    where: { userId: req.user.id, read: false },
  })
  res.json({ count })
})

// PATCH /api/notifications/:id/read — mark single notification as read
router.patch('/:id/read', async (req, res) => {
  const existing = await prisma.notification.findUnique({
    where: { id: req.params.id },
  })

  if (!existing) return res.status(404).json({ error: 'Notification not found' })
  if (existing.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

  const notif = await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  })

  res.json(notif)
})

// POST /api/notifications/read-all — mark all as read
router.post('/read-all', async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true },
  })
  res.json({ message: 'All notifications marked as read' })
})

module.exports = router
