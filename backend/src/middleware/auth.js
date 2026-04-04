const jwt = require('jsonwebtoken')

/**
 * Verify JWT and attach decoded user to req.user
 * Accepts token from:
 *   1. Authorization: Bearer <token> header (standard)
 *   2. ?token=<token> query param (used for OAuth redirects)
 */
function auth(req, res, next) {
  const authHeader = req.headers.authorization
  let token = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  } else if (req.query.token) {
    // Allow token via query string for redirect-based flows (e.g. Google OAuth)
    token = req.query.token
  }

  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

module.exports = auth
