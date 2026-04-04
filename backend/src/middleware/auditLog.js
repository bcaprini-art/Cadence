const fs = require('fs')
const path = require('path')

const LOG_DIR = path.join(__dirname, '../../logs')
const LOG_FILE = path.join(LOG_DIR, 'audit.log')

/**
 * Ensure the logs directory exists (create if missing).
 * Never throws — if the log can't be written, we silently skip it.
 */
function ensureLogDir() {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true })
    }
  } catch {
    // noop — non-fatal
  }
}

/**
 * Write an audit log entry to logs/audit.log.
 */
function writeAuditLog(entry) {
  try {
    ensureLogDir()
    const line = JSON.stringify(entry) + '\n'
    fs.appendFileSync(LOG_FILE, line, 'utf8')
  } catch {
    // noop — non-fatal
  }
}

/**
 * Express middleware factory.
 * Logs when a COACH accesses athlete schedule data.
 *
 * @param {string} action - Description of the action (e.g., 'GET_SCHEDULE_BLOCKS')
 */
function auditLog(action) {
  return (req, res, next) => {
    if (req.user && req.user.role === 'COACH') {
      const athleteIds = req.query.userId
        ? [req.query.userId]
        : req.query.teamId
        ? [`team:${req.query.teamId}`]
        : []

      const entry = {
        timestamp: new Date().toISOString(),
        coachId: req.user.id,
        athleteIds,
        endpoint: req.originalUrl,
        method: req.method,
        action,
      }

      writeAuditLog(entry)
    }
    next()
  }
}

module.exports = { auditLog, writeAuditLog }
