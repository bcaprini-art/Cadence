/**
 * Cadence Email Service — powered by SendGrid
 * All functions are fire-and-forget: call without await, chain .catch(console.error)
 * Gracefully skips if SENDGRID_API_KEY is not configured.
 */

const sgMail = require('@sendgrid/mail')

const API_KEY = process.env.SENDGRID_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@cadence.app'
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

if (API_KEY) {
  sgMail.setApiKey(API_KEY)
} else {
  console.log('[email] SENDGRID_API_KEY not set — email notifications disabled (log-only mode)')
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

function baseTemplate({ title, preheader, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <!-- Preheader (hidden) -->
  <span style="display:none;font-size:1px;color:#0a0f1e;max-height:0;overflow:hidden;">${preheader}</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1e;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <!-- Logo / Header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <div style="display:inline-block;background:linear-gradient(135deg,#16a34a,#15803d);border-radius:12px;padding:10px 20px;">
                <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">⚡ Cadence</span>
              </div>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background-color:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">
                Cadence — College Athletics Scheduling &nbsp;•&nbsp;
                <a href="${CLIENT_URL}" style="color:rgba(255,255,255,0.4);text-decoration:none;">Open App</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(href, label) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
    <tr>
      <td style="background:linear-gradient(135deg,#16a34a,#15803d);border-radius:10px;">
        <a href="${href}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
          ${label} →
        </a>
      </td>
    </tr>
  </table>`
}

function eventInfoBlock(event) {
  const venue = event.venue?.name || 'TBD'
  return `<table cellpadding="0" cellspacing="0" width="100%" style="background-color:#1e2d4a;border-radius:10px;margin:16px 0;">
    <tr>
      <td style="padding:16px 20px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#4ade80;text-transform:uppercase;letter-spacing:1px;">${event.type || 'EVENT'}</p>
        <p style="margin:0 0 12px;font-size:20px;font-weight:700;color:#ffffff;">${event.title}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#94a3b8;">📅 ${formatDateTime(event.start)}</p>
        ${event.end ? `<p style="margin:0 0 4px;font-size:14px;color:#94a3b8;">⏱ Ends: ${formatDateTime(event.end)}</p>` : ''}
        <p style="margin:0;font-size:14px;color:#94a3b8;">📍 ${venue}</p>
      </td>
    </tr>
  </table>`
}

async function send(msg) {
  if (!API_KEY) {
    console.log(`[email] [log-only] To: ${Array.isArray(msg.to) ? msg.to.join(', ') : msg.to} | Subject: ${msg.subject}`)
    return
  }
  return sgMail.send(msg)
}

// ─── Email Functions ──────────────────────────────────────────────────────────

/**
 * sendPracticeScheduled — Notify athletes when a practice/event is created
 * @param {Object} coach  - User object for the coach
 * @param {Array}  athletes - Array of User objects
 * @param {Object} event  - Event object (with optional venue relation)
 */
async function sendPracticeScheduled(coach, athletes, event) {
  if (!athletes || athletes.length === 0) return

  const emails = athletes.map((a) => a.email).filter(Boolean)
  if (emails.length === 0) return

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">New Practice Scheduled</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;">
      Coach <strong style="color:#ffffff;">${coach.name}</strong> has scheduled a new event for your team.
    </p>
    ${eventInfoBlock(event)}
    ${ctaButton(`${CLIENT_URL}/my-schedule`, 'View in Cadence')}
  `

  await send({
    to: emails,
    from: { email: FROM_EMAIL, name: 'Cadence Athletics' },
    subject: `📅 New ${event.type}: ${event.title}`,
    html: baseTemplate({
      title: `New ${event.type}: ${event.title}`,
      preheader: `Coach ${coach.name} scheduled ${event.title} — check your schedule.`,
      body,
    }),
  })
}

/**
 * sendConflictAlert — Notify coach of hard conflicts found during scheduling
 * @param {Object} coach     - User object for the coach
 * @param {Array}  conflicts - Array of conflict objects from conflict engine
 * @param {Object} event     - The proposed event object
 */
async function sendConflictAlert(coach, conflicts, event) {
  if (!coach?.email || !conflicts || conflicts.length === 0) return

  const conflictRows = conflicts
    .map(
      (c) => `<tr>
        <td style="padding:8px 12px;font-size:14px;color:#ffffff;border-bottom:1px solid rgba(255,255,255,0.06);">${c.athleteName}</td>
        <td style="padding:8px 12px;font-size:14px;color:#f87171;border-bottom:1px solid rgba(255,255,255,0.06);">${c.reason?.replace(/_/g, ' ') || 'CONFLICT'}</td>
        <td style="padding:8px 12px;font-size:13px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.06);">${formatDateTime(c.start)}</td>
      </tr>`
    )
    .join('')

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">⚠️ Scheduling Conflicts Detected</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;">
      <strong style="color:#f87171;">${conflicts.length} conflict${conflicts.length !== 1 ? 's' : ''}</strong> found when scheduling:
    </p>
    ${eventInfoBlock(event)}
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e2d4a;border-radius:10px;margin:16px 0;overflow:hidden;">
      <thead>
        <tr style="background-color:#162032;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#4ade80;text-transform:uppercase;letter-spacing:0.8px;">Athlete</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#4ade80;text-transform:uppercase;letter-spacing:0.8px;">Type</th>
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#4ade80;text-transform:uppercase;letter-spacing:0.8px;">Block Time</th>
        </tr>
      </thead>
      <tbody>${conflictRows}</tbody>
    </table>
    ${ctaButton(`${CLIENT_URL}/schedule-event`, 'Review in Cadence')}
  `

  await send({
    to: coach.email,
    from: { email: FROM_EMAIL, name: 'Cadence Athletics' },
    subject: `⚠️ ${conflicts.length} Conflict${conflicts.length !== 1 ? 's' : ''}: ${event.title || 'Proposed Event'}`,
    html: baseTemplate({
      title: 'Scheduling Conflicts Detected',
      preheader: `${conflicts.length} scheduling conflict(s) found for ${event.title || 'your proposed event'}.`,
      body,
    }),
  })
}

/**
 * sendScheduleChange — Notify athletes when an event is updated or cancelled
 * @param {Array}  athletes   - Array of User objects
 * @param {Object} event      - The updated/deleted event
 * @param {string} changeType - 'UPDATED' | 'CANCELLED'
 */
async function sendScheduleChange(athletes, event, changeType = 'UPDATED') {
  if (!athletes || athletes.length === 0) return

  const emails = athletes.map((a) => a.email).filter(Boolean)
  if (emails.length === 0) return

  const isCancelled = changeType === 'CANCELLED'
  const accentColor = isCancelled ? '#f87171' : '#fbbf24'
  const icon = isCancelled ? '❌' : '✏️'
  const verb = isCancelled ? 'has been cancelled' : 'has been updated'

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">${icon} Event ${changeType === 'CANCELLED' ? 'Cancelled' : 'Updated'}</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;">
      The following event <strong style="color:${accentColor};">${verb}</strong>:
    </p>
    ${eventInfoBlock(event)}
    ${!isCancelled ? ctaButton(`${CLIENT_URL}/my-schedule`, 'View Updated Schedule') : ''}
  `

  await send({
    to: emails,
    from: { email: FROM_EMAIL, name: 'Cadence Athletics' },
    subject: `${icon} ${event.title} — ${changeType === 'CANCELLED' ? 'Cancelled' : 'Schedule Change'}`,
    html: baseTemplate({
      title: `Event ${changeType}`,
      preheader: `${event.title} ${verb}. Check your schedule.`,
      body,
    }),
  })
}

/**
 * sendCARAWarning — Alert coach when an athlete is near their CARA hour limit
 * @param {Object} coach   - User object for the coach
 * @param {Object} athlete - User object for the athlete
 * @param {number} hours   - Current hours logged this week
 * @param {number} limit   - CARA weekly hour limit
 */
async function sendCARAWarning(coach, athlete, hours, limit) {
  if (!coach?.email) return

  const percentUsed = Math.round((hours / limit) * 100)
  const remaining = +(limit - hours).toFixed(1)

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">🚨 CARA Limit Warning</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;">
      Athlete <strong style="color:#ffffff;">${athlete.name}</strong> is approaching their weekly CARA hour limit.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="background-color:#1e2d4a;border-radius:10px;margin:16px 0;">
      <tr>
        <td style="padding:20px;">
          <!-- Progress bar -->
          <div style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:13px;color:#94a3b8;">Hours Used</span>
              <span style="font-size:13px;font-weight:700;color:#fbbf24;">${hours}h / ${limit}h (${percentUsed}%)</span>
            </div>
            <div style="background:#162032;border-radius:999px;height:10px;overflow:hidden;">
              <div style="background:linear-gradient(90deg,#f59e0b,#ef4444);width:${Math.min(percentUsed, 100)}%;height:100%;border-radius:999px;"></div>
            </div>
          </div>
          <p style="margin:0;font-size:14px;color:#94a3b8;">
            <strong style="color:#fbbf24;">${remaining}h remaining</strong> before CARA weekly limit is reached.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 4px;font-size:14px;color:#94a3b8;">
      Adding more athletic activities this week may violate NCAA compliance rules.
    </p>
    ${ctaButton(`${CLIENT_URL}/compliance`, 'View Compliance Dashboard')}
  `

  await send({
    to: coach.email,
    from: { email: FROM_EMAIL, name: 'Cadence Athletics' },
    subject: `🚨 CARA Warning: ${athlete.name} at ${percentUsed}% of weekly limit`,
    html: baseTemplate({
      title: 'CARA Limit Warning',
      preheader: `${athlete.name} has used ${percentUsed}% of their weekly CARA hours (${hours}/${limit}h).`,
      body,
    }),
  })
}

module.exports = {
  sendPracticeScheduled,
  sendConflictAlert,
  sendScheduleChange,
  sendCARAWarning,
}
