const express = require('express')
const prisma = require('../lib/prisma')
const auth = require('../middleware/auth')

const router = express.Router()

router.use(auth)

// GET / — list current user's todos, ordered by createdAt desc
router.get('/', async (req, res) => {
  const todos = await prisma.todoItem.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  })
  res.json(todos)
})

// POST / — create a todo
router.post('/', async (req, res) => {
  const { title, description, dueDate, priority, category } = req.body

  if (!title) {
    return res.status(400).json({ error: 'title is required' })
  }

  const todo = await prisma.todoItem.create({
    data: {
      userId: req.user.id,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority || 'medium',
      category,
    },
  })

  res.status(201).json(todo)
})

// PUT /:id — update a todo (verify ownership)
router.put('/:id', async (req, res) => {
  const existing = await prisma.todoItem.findUnique({
    where: { id: req.params.id },
  })

  if (!existing) return res.status(404).json({ error: 'Todo not found' })
  if (existing.userId !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to update this todo' })
  }

  const { title, description, dueDate, completed, priority, category } = req.body

  const todo = await prisma.todoItem.update({
    where: { id: req.params.id },
    data: {
      title,
      description,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      completed,
      priority,
      category,
    },
  })

  res.json(todo)
})

// DELETE /:id — delete a todo (verify ownership)
router.delete('/:id', async (req, res) => {
  const existing = await prisma.todoItem.findUnique({
    where: { id: req.params.id },
  })

  if (!existing) return res.status(404).json({ error: 'Todo not found' })
  if (existing.userId !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to delete this todo' })
  }

  await prisma.todoItem.delete({
    where: { id: req.params.id },
  })

  res.json({ message: 'Todo deleted' })
})

// PATCH /:id/toggle — toggle completed status
router.patch('/:id/toggle', async (req, res) => {
  const existing = await prisma.todoItem.findUnique({
    where: { id: req.params.id },
  })

  if (!existing) return res.status(404).json({ error: 'Todo not found' })
  if (existing.userId !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to update this todo' })
  }

  const todo = await prisma.todoItem.update({
    where: { id: req.params.id },
    data: { completed: !existing.completed },
  })

  res.json(todo)
})

module.exports = router
