const express = require('express')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')
const role = require('../middleware/role')

const router = express.Router()

router.use(auth)

// GET / — get current user's profile
router.get('/', async (req, res) => {
  const profile = await prisma.playerProfile.findUnique({
    where: { userId: req.user.id },
  })
  if (!profile) return res.status(404).json({ error: 'Profile not found' })
  res.json(profile)
})

// PUT / — upsert current user's profile
router.put('/', async (req, res) => {
  const {
    hometown,
    likes,
    dislikes,
    foodAllergies,
    bio,
    photoUrl,
    jerseyNumber,
    position,
    height,
    weight,
    year,
    major,
  } = req.body

  const profile = await prisma.playerProfile.upsert({
    where: { userId: req.user.id },
    update: {
      hometown,
      likes,
      dislikes,
      foodAllergies,
      bio,
      photoUrl,
      jerseyNumber,
      position,
      height,
      weight,
      year,
      major,
    },
    create: {
      userId: req.user.id,
      hometown,
      likes,
      dislikes,
      foodAllergies,
      bio,
      photoUrl,
      jerseyNumber,
      position,
      height,
      weight,
      year,
      major,
    },
  })

  res.json(profile)
})

// GET /athlete/:athleteId — get a specific athlete's profile (coach/AD/admin)
router.get('/athlete/:athleteId', role('COACH', 'ASSISTANT_COACH', 'AD', 'ADMIN'), async (req, res) => {
  const profile = await prisma.playerProfile.findUnique({
    where: { userId: req.params.athleteId },
  })
  if (!profile) return res.status(404).json({ error: 'Profile not found for this athlete' })
  res.json(profile)
})

module.exports = router
