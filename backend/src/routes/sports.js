const express = require('express')
const { SPORTS } = require('../lib/sports')

const router = express.Router()

// GET /api/sports — public, no auth required
router.get('/', (_req, res) => {
  res.json(SPORTS)
})

module.exports = router
