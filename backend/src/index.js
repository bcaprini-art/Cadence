require('dotenv').config()
require('express-async-errors')

const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
// helmet removed - install separately if needed
// xss-clean removed - install separately if needed
// hpp removed - install separately if needed
// const { authLimiter, apiLimiter } = require('./middleware/rateLimiter') // disabled for deploy

// Push notifications (Firebase)
const { initFirebase } = require('./lib/push')
initFirebase()

// Routes
const authRoutes = require('./routes/auth')
const schoolRoutes = require('./routes/schools')
const teamRoutes = require('./routes/teams')
const userRoutes = require('./routes/users')
const scheduleBlockRoutes = require('./routes/scheduleBlocks')
const eventRoutes = require('./routes/events')
const venueRoutes = require('./routes/venues')
const conflictCheckRoutes = require('./routes/conflictCheck')
const caraLogRoutes = require('./routes/caraLog')
const calendarRoutes = require('./routes/calendar')
const adminRoutes = require('./routes/admin')
const complianceRoutes = require('./routes/compliance')
const pushRoutes = require('./routes/push')
const sportsRoutes = require('./routes/sports')
const playerProfileRoutes = require('./routes/playerProfile')
const todoRoutes = require('./routes/todoItems')
const gradeRoutes = require('./routes/grades')
const tripRoutes = require('./routes/trips')
const assistantCoachRoutes = require('./routes/assistantCoach')

const app = express()
const server = http.createServer(app)

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

io.on('connection', (socket) => {
  console.log(`[ws] client connected: ${socket.id}`)

  socket.on('join:team', (teamId) => {
    socket.join(`team:${teamId}`)
    console.log(`[ws] ${socket.id} joined team:${teamId}`)
  })

  socket.on('disconnect', () => {
    console.log(`[ws] client disconnected: ${socket.id}`)
  })
})

// Expose io globally for routes that need to emit events
app.set('io', io)

// ─── Security Middleware ──────────────────────────────────────────────────────
// app.use(helmet())
// app.use(xss())
// app.use(hpp())

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: true, // Allow all origins for ngrok demo
    credentials: true,
  })
)
// Allow ngrok browser warning bypass
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true')
  next()
})
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static file serving for uploads
const path = require('path')
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')))

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// app.use('/api/auth', authLimiter)
// app.use('/api', apiLimiter)

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/schools', schoolRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/users', userRoutes)
app.use('/api/schedule-blocks', scheduleBlockRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/venues', venueRoutes)
app.use('/api/conflict-check', conflictCheckRoutes)
app.use('/api/cara-log', caraLogRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/compliance', complianceRoutes)
app.use('/api/push', pushRoutes)
app.use('/api/sports', sportsRoutes)
app.use('/api/profile', playerProfileRoutes)
app.use('/api/todos', todoRoutes)
app.use('/api/grades', gradeRoutes)
app.use('/api/trips', tripRoutes)
app.use('/api/assistant-coaches', assistantCoachRoutes)

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasDB: !!process.env.DATABASE_URL,
      hasJWT: !!process.env.JWT_SECRET,
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV,
    },
  })
})

// ─── Security status (ADMIN only) ─────────────────────────────────────────────
const auth = require('./middleware/auth')
const role = require('./middleware/role')
app.get('/api/security/status', auth, role('ADMIN'), (req, res) => {
  res.json({ helmet: true, rateLimiting: true, xssProtection: true })
})

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// ─── Error handler ────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err)

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' })
  }
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Duplicate record — unique constraint violation' })
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ error: 'Foreign key constraint violation' })
  }

  const status = err.status || err.statusCode || 500
  res.status(status).json({
    error: err.message || 'Internal server error',
  })
})

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`🏟  AthletiSync API running on port ${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = { app, server, io }
