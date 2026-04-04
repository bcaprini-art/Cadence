const express = require('express')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')

const router = express.Router()

router.use(auth)

/**
 * POST /api/push/register
 * Body: { token: string, platform?: 'WEB' | 'IOS' | 'ANDROID' }
 * Saves (or upserts) an FCM device token for the current user.
 */
router.post('/register', async (req, res) => {
  const { token, platform = 'WEB' } = req.body
  if (!token) return res.status(400).json({ error: 'token is required' })

  const validPlatforms = ['WEB', 'IOS', 'ANDROID']
  if (!validPlatforms.includes(platform)) {
    return res.status(400).json({ error: `platform must be one of: ${validPlatforms.join(', ')}` })
  }

  const fcmToken = await prisma.fCMToken.upsert({
    where: { token },
    update: { userId: req.user.id, platform },
    create: { userId: req.user.id, token, platform },
  })

  res.status(201).json({ id: fcmToken.id, platform: fcmToken.platform })
})

/**
 * DELETE /api/push/unregister
 * Body: { token: string }
 * Removes the FCM token (must belong to the current user).
 */
router.delete('/unregister', async (req, res) => {
  const { token } = req.body
  if (!token) return res.status(400).json({ error: 'token is required' })

  const existing = await prisma.fCMToken.findUnique({ where: { token } })
  if (!existing) return res.status(404).json({ error: 'Token not found' })
  if (existing.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

  await prisma.fCMToken.delete({ where: { token } })
  res.json({ message: 'Token removed' })
})

module.exports = router
