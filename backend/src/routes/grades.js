const express = require('express')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')
const role = require('../middleware/role')

const router = express.Router()

router.use(auth)

// GET /athlete — athlete sees own grades
router.get('/athlete', async (req, res) => {
  const grades = await prisma.grade.findMany({
    where: { athleteId: req.user.id },
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      school: { select: { id: true, name: true } },
    },
    orderBy: [{ year: 'desc' }, { term: 'asc' }],
  })

  res.json(grades)
})

// GET /team/:teamId — coach sees their team's athletes' grades
router.get('/team/:teamId', role('COACH', 'ASSISTANT_COACH', 'AD', 'ADMIN'), async (req, res) => {
  // Fetch all athletes on that team
  const athletes = await prisma.user.findMany({
    where: { teamId: req.params.teamId, role: 'ATHLETE' },
    select: { id: true, name: true, email: true },
  })

  const athleteIds = athletes.map((a) => a.id)

  const grades = await prisma.grade.findMany({
    where: { athleteId: { in: athleteIds } },
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      school: { select: { id: true, name: true } },
    },
    orderBy: [{ year: 'desc' }, { term: 'asc' }],
  })

  // Group grades by athlete for cleaner response
  const athleteMap = {}
  for (const athlete of athletes) {
    athleteMap[athlete.id] = { ...athlete, grades: [] }
  }
  for (const grade of grades) {
    if (athleteMap[grade.athleteId]) {
      athleteMap[grade.athleteId].grades.push(grade)
    }
  }

  res.json(Object.values(athleteMap))
})

// POST / — create/update a grade (TEACHER, AD, ADMIN)
router.post('/', role('TEACHER', 'AD', 'ADMIN'), async (req, res) => {
  const { athleteId, courseName, grade, term, year, notes } = req.body

  if (!athleteId || !courseName || !grade || !term || year === undefined) {
    return res.status(400).json({ error: 'athleteId, courseName, grade, term, and year are required' })
  }

  const result = await prisma.grade.upsert({
    where: {
      athleteId_courseName_term_year: {
        athleteId,
        courseName,
        term,
        year,
      },
    },
    update: {
      grade,
      notes,
      teacherId: req.user.id,
      schoolId: req.user.schoolId,
    },
    create: {
      schoolId: req.user.schoolId,
      athleteId,
      teacherId: req.user.id,
      courseName,
      grade,
      term,
      year,
      notes,
    },
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      school: { select: { id: true, name: true } },
    },
  })

  res.status(201).json(result)
})

// GET /teacher — teacher sees grades they entered
router.get('/teacher', role('TEACHER'), async (req, res) => {
  const grades = await prisma.grade.findMany({
    where: { teacherId: req.user.id },
    include: {
      athlete: { select: { id: true, name: true, email: true } },
      school: { select: { id: true, name: true } },
    },
    orderBy: [{ year: 'desc' }, { term: 'asc' }],
  })

  res.json(grades)
})

module.exports = router
