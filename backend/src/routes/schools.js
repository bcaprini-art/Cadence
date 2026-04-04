const express = require('express')
const path = require('path')
const fs = require('fs')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')
const role = require('../middleware/role')
const upload = require('../lib/upload')

const router = express.Router()

// GET /api/schools
router.get('/', auth, async (req, res) => {
  const schools = await prisma.school.findMany({
    orderBy: { name: 'asc' },
  })
  res.json(schools)
})

// GET /api/schools/:id
router.get('/:id', auth, async (req, res) => {
  const school = await prisma.school.findUnique({
    where: { id: req.params.id },
    include: { teams: true },
  })
  if (!school) return res.status(404).json({ error: 'School not found' })
  res.json(school)
})

// POST /api/schools — Admin only
router.post('/', auth, role('ADMIN'), async (req, res) => {
  const { name, timezone, conference } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })

  const school = await prisma.school.create({
    data: { name, timezone: timezone || 'America/Chicago', conference },
  })
  res.status(201).json(school)
})

// PATCH /api/schools/:id — Admin or AD
router.patch('/:id', auth, role('ADMIN', 'AD'), async (req, res) => {
  const { name, timezone, conference, division } = req.body
  const school = await prisma.school.update({
    where: { id: req.params.id },
    data: { name, timezone, conference, division },
  })
  res.json(school)
})

// PUT /api/schools/:id — Admin or AD (alias for PATCH)
router.put('/:id', auth, role('ADMIN', 'AD'), async (req, res) => {
  const { name, timezone, conference, division } = req.body
  const school = await prisma.school.update({
    where: { id: req.params.id },
    data: { name, timezone, conference, division },
  })
  res.json(school)
})

// POST /api/schools/:id/logo — Upload school logo (Admin or AD)
router.post('/:id/logo', auth, role('ADMIN', 'AD'), upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  const schoolId = req.params.id

  // Build public URL
  const logoUrl = `/uploads/logos/${req.file.filename}`

  // Remove old logo file if it exists
  const existing = await prisma.school.findUnique({ where: { id: schoolId }, select: { logoUrl: true } })
  if (existing?.logoUrl) {
    const oldPath = path.join(__dirname, '../../public', existing.logoUrl)
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath)
    }
  }

  const school = await prisma.school.update({
    where: { id: schoolId },
    data: { logoUrl },
  })

  res.json({ logoUrl: school.logoUrl })
})

// DELETE /api/schools/:id/logo — Remove school logo (Admin or AD)
router.delete('/:id/logo', auth, role('ADMIN', 'AD'), async (req, res) => {
  const school = await prisma.school.findUnique({
    where: { id: req.params.id },
    select: { logoUrl: true },
  })

  if (school?.logoUrl) {
    const filePath = path.join(__dirname, '../../public', school.logoUrl)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    await prisma.school.update({
      where: { id: req.params.id },
      data: { logoUrl: null },
    })
  }

  res.json({ message: 'Logo removed' })
})

// DELETE /api/schools/:id — Admin only
router.delete('/:id', auth, role('ADMIN'), async (req, res) => {
  await prisma.school.delete({ where: { id: req.params.id } })
  res.json({ message: 'School deleted' })
})

module.exports = router
