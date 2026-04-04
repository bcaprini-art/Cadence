const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

const router = express.Router()

const VALID_ROLES = ['ATHLETE', 'COACH', 'AD', 'ADMIN']

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      teamId: user.teamId,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role = 'ATHLETE', schoolId, teamId } = req.body

  if (!name || !email || !password || !schoolId) {
    return res.status(400).json({ error: 'name, email, password, and schoolId are required' })
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' })
  }

  const school = await prisma.school.findUnique({ where: { id: schoolId } })
  if (!school) {
    return res.status(404).json({ error: 'School not found' })
  }

  const hashed = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { name, email, password: hashed, role, schoolId, teamId: teamId || null },
    select: { id: true, name: true, email: true, role: true, schoolId: true, teamId: true, createdAt: true },
  })

  const token = signToken(user)
  res.status(201).json({ token, user })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = signToken(user)

  const { password: _pw, ...safeUser } = user
  res.json({ token, user: safeUser })
})

module.exports = router
