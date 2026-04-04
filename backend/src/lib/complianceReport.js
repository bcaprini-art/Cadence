'use strict'

/**
 * NCAA Compliance Report Generator
 * Generates PDF and CSV compliance reports for a team's CARA hours
 */

const PDFDocument = require('pdfkit')

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DEFAULT_MAX_HOURS = 20

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get the date string for a day offset from week start (Monday)
 * @param {Date} weekStart - Monday of the week
 * @param {number} dayIndex - 0=Mon, 1=Tue, ..., 6=Sun
 * @returns {string} YYYY-MM-DD
 */
function getDayDate(weekStart, dayIndex) {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + dayIndex)
  return d.toISOString().split('T')[0]
}

/**
 * Calculate per-day hours for an athlete from CARA logs
 * @param {string} athleteId
 * @param {Date} weekStart
 * @param {Date} weekEnd
 * @param {Array} caraLogs
 * @returns {number[]} Array of 7 values (Mon-Sun)
 */
function getDailyHours(athleteId, weekStart, weekEnd, caraLogs) {
  const daily = [0, 0, 0, 0, 0, 0, 0]

  const wsTime = new Date(weekStart).getTime()

  for (const log of caraLogs) {
    if (log.athleteId !== athleteId) continue

    const logDate = new Date(log.weekStart || log.createdAt)
    const dayOffset = Math.floor((logDate.getTime() - wsTime) / (24 * 60 * 60 * 1000))

    if (dayOffset >= 0 && dayOffset <= 6) {
      daily[dayOffset] += log.hours || 0
    }
  }

  return daily
}

/**
 * Get status label for hours vs limit
 */
function getStatus(weeklyTotal, maxHours) {
  if (weeklyTotal >= maxHours) return 'VIOLATION'
  if (weeklyTotal >= maxHours * 0.85) return 'Warning'
  return 'OK'
}

/**
 * Format date range for display
 */
function formatDateRange(weekStart, weekEnd) {
  const opts = { month: 'short', day: 'numeric', year: 'numeric' }
  const s = new Date(weekStart).toLocaleDateString('en-US', opts)
  const e = new Date(weekEnd).toLocaleDateString('en-US', opts)
  return `${s} – ${e}`
}

// ─── PDF Report ───────────────────────────────────────────────────────────────

/**
 * Generate a PDF compliance report
 * @param {Object} params
 * @param {string} params.teamId
 * @param {Date|string} params.weekStart
 * @param {Date|string} params.weekEnd
 * @param {Array} params.caraLogs - Raw CARA log records (with athleteId, hours, weekStart)
 * @param {Object} params.ruleset - { maxCaraHoursWeek, maxCaraHoursDay, division }
 * @param {Object} params.team - { sport, division, school: { name }, members: [{ id, name, role }] }
 * @returns {Promise<Buffer>} PDF buffer
 */
function generatePDFReport({ teamId, weekStart, weekEnd, caraLogs, ruleset, team }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' })
    const chunks = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const maxHours = ruleset?.maxCaraHoursWeek || DEFAULT_MAX_HOURS
    const schoolName = team?.school?.name || 'Unknown School'
    const sport = team?.sport || 'Unknown Sport'
    const division = team?.division || ruleset?.division || 'D1'
    const dateRange = formatDateRange(weekStart, weekEnd)

    const athletes = (team?.members || []).filter((m) => m.role === 'ATHLETE')
    const coaches = (team?.members || []).filter((m) => m.role === 'COACH')
    const coachName = coaches[0]?.name || 'N/A'

    // Colors
    const PRIMARY = '#1a472a'
    const ACCENT = '#2d6a4f'
    const DANGER = '#c0392b'
    const WARN = '#e67e22'
    const OK = '#27ae60'
    const LIGHT_GRAY = '#f8f9fa'
    const MID_GRAY = '#6c757d'

    // ─── Cover Page ─────────────────────────────────────────────────────────

    // Header bar
    doc.rect(0, 0, doc.page.width, 120).fill(PRIMARY)

    doc.fillColor('white').fontSize(28).font('Helvetica-Bold')
      .text('NCAA Compliance Report', 50, 30)

    doc.fontSize(14).font('Helvetica')
      .text('CARA Hours — Weekly Summary', 50, 65)

    doc.fontSize(11)
      .text(`Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 90)

    // School/team info block
    doc.fillColor(PRIMARY).fontSize(13).font('Helvetica-Bold')
      .text('Report Details', 50, 145)

    doc.moveTo(50, 162).lineTo(doc.page.width - 50, 162).strokeColor(ACCENT).lineWidth(1).stroke()

    const details = [
      ['School', schoolName],
      ['Sport', sport],
      ['Division', division],
      ['Head Coach', coachName],
      ['Week', dateRange],
    ]

    let y = 172
    for (const [label, value] of details) {
      doc.fillColor(MID_GRAY).fontSize(10).font('Helvetica')
        .text(label + ':', 50, y)
      doc.fillColor('#212529').fontSize(10).font('Helvetica-Bold')
        .text(value, 180, y)
      y += 20
    }

    // ─── Summary Stats ───────────────────────────────────────────────────────

    y += 20
    doc.fillColor(PRIMARY).fontSize(13).font('Helvetica-Bold')
      .text('Weekly Summary', 50, y)
    y += 18
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor(ACCENT).lineWidth(1).stroke()
    y += 12

    // Calculate summary stats
    let totalViolations = 0
    let totalWarnings = 0
    let totalHoursSum = 0
    const athleteHours = {}

    for (const log of caraLogs) {
      athleteHours[log.athleteId] = (athleteHours[log.athleteId] || 0) + (log.hours || 0)
    }

    for (const hrs of Object.values(athleteHours)) {
      totalHoursSum += hrs
      if (hrs >= maxHours) totalViolations++
      else if (hrs >= maxHours * 0.85) totalWarnings++
    }

    const avgHours = athletes.length > 0
      ? (totalHoursSum / athletes.length).toFixed(1)
      : '0.0'

    // Draw stat boxes
    const statBoxes = [
      { label: 'Total Athletes', value: String(athletes.length), color: '#343a40' },
      { label: 'Avg CARA Hours', value: `${avgHours}h`, color: ACCENT },
      { label: 'Violations', value: String(totalViolations), color: totalViolations > 0 ? DANGER : OK },
      { label: 'Warnings', value: String(totalWarnings), color: totalWarnings > 0 ? WARN : OK },
    ]

    const boxW = (doc.page.width - 100 - 30) / 4
    const boxH = 65

    for (let i = 0; i < statBoxes.length; i++) {
      const bx = 50 + i * (boxW + 10)
      doc.rect(bx, y, boxW, boxH).fillAndStroke(LIGHT_GRAY, '#dee2e6')
      doc.fillColor(statBoxes[i].color).fontSize(22).font('Helvetica-Bold')
        .text(statBoxes[i].value, bx, y + 8, { width: boxW, align: 'center' })
      doc.fillColor(MID_GRAY).fontSize(9).font('Helvetica')
        .text(statBoxes[i].label, bx, y + 38, { width: boxW, align: 'center' })
    }

    y += boxH + 30

    // ─── Per-Athlete Table ────────────────────────────────────────────────────

    doc.fillColor(PRIMARY).fontSize(13).font('Helvetica-Bold')
      .text('Athlete CARA Hours', 50, y)
    y += 18
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor(ACCENT).lineWidth(1).stroke()
    y += 10

    // Table header
    const COL_NAME = 50
    const COL_DAYS_START = 200
    const DAY_COL_W = 40
    const COL_TOTAL = COL_DAYS_START + DAYS.length * DAY_COL_W + 10
    const COL_STATUS = COL_TOTAL + 55

    doc.rect(50, y, doc.page.width - 100, 20).fill(ACCENT)
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
      .text('Athlete', COL_NAME + 4, y + 5)

    for (let d = 0; d < DAYS.length; d++) {
      doc.text(DAYS[d], COL_DAYS_START + d * DAY_COL_W, y + 5, { width: DAY_COL_W, align: 'center' })
    }

    doc.text('Total', COL_TOTAL, y + 5, { width: 50, align: 'center' })
    doc.text('Status', COL_STATUS, y + 5)
    y += 20

    // Table rows
    const sortedAthletes = [...athletes].sort((a, b) => {
      const aHrs = athleteHours[a.id] || 0
      const bHrs = athleteHours[b.id] || 0
      return bHrs - aHrs // sort descending by hours
    })

    let rowIndex = 0
    for (const athlete of sortedAthletes) {
      if (y > doc.page.height - 120) {
        doc.addPage()
        y = 50
      }

      const daily = getDailyHours(athlete.id, weekStart, weekEnd, caraLogs)
      const weeklyTotal = daily.reduce((a, b) => a + b, 0)
      const status = getStatus(weeklyTotal, maxHours)

      const rowBg = rowIndex % 2 === 0 ? 'white' : LIGHT_GRAY
      doc.rect(50, y, doc.page.width - 100, 18).fill(rowBg)

      const textColor = status === 'VIOLATION' ? DANGER : status === 'Warning' ? WARN : '#212529'

      doc.fillColor(textColor).fontSize(9).font('Helvetica')
        .text(athlete.name, COL_NAME + 4, y + 4, { width: 145 })

      for (let d = 0; d < DAYS.length; d++) {
        const hrs = daily[d]
        doc.fillColor(hrs > 0 ? textColor : MID_GRAY)
          .text(hrs > 0 ? hrs.toFixed(1) : '-', COL_DAYS_START + d * DAY_COL_W, y + 4, {
            width: DAY_COL_W,
            align: 'center',
          })
      }

      doc.fillColor(textColor).font('Helvetica-Bold')
        .text(`${weeklyTotal.toFixed(1)}h`, COL_TOTAL, y + 4, { width: 50, align: 'center' })

      const statusColor = status === 'VIOLATION' ? DANGER : status === 'Warning' ? WARN : OK
      doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(8)
        .text(status, COL_STATUS, y + 4)

      y += 18
      rowIndex++
    }

    // ─── Certification Statement ──────────────────────────────────────────────

    if (y > doc.page.height - 140) {
      doc.addPage()
      y = 50
    }

    y += 30
    doc.rect(50, y, doc.page.width - 100, 90).strokeColor(ACCENT).lineWidth(1).stroke()

    doc.fillColor(PRIMARY).fontSize(11).font('Helvetica-Bold')
      .text('Compliance Certification', 62, y + 10)

    doc.fillColor('#212529').fontSize(9).font('Helvetica')
      .text(
        `I, the undersigned head coach, hereby certify that the CARA hours reported above ` +
        `for ${schoolName} ${sport} (${division}) for the week of ${dateRange} are accurate ` +
        `and complete to the best of my knowledge, and that all activities comply with applicable ` +
        `NCAA bylaws regarding countable athletically related activities (CARA).`,
        62, y + 28, { width: doc.page.width - 124 }
      )

    y += 100
    doc.fillColor(MID_GRAY).fontSize(9).font('Helvetica')
      .text('Head Coach Signature: _________________________________', 62, y)
    doc.text(`Date: _________________`, 380, y)

    doc.end()
  })
}

// ─── CSV Report ───────────────────────────────────────────────────────────────

/**
 * Generate a CSV compliance report
 * @param {Object} params
 * @param {string} params.teamId
 * @param {Date|string} params.weekStart
 * @param {Date|string} params.weekEnd
 * @param {Array} params.caraLogs
 * @param {Object} params.ruleset
 * @param {Object} params.team
 * @returns {string} CSV string
 */
function generateCSVReport({ teamId, weekStart, weekEnd, caraLogs, ruleset, team }) {
  const maxHours = ruleset?.maxCaraHoursWeek || DEFAULT_MAX_HOURS
  const athletes = (team?.members || []).filter((m) => m.role === 'ATHLETE')

  const rows = [
    ['Athlete Name', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Weekly Total', 'Status'],
  ]

  const sortedAthletes = [...athletes].sort((a, b) => a.name.localeCompare(b.name))

  for (const athlete of sortedAthletes) {
    const daily = getDailyHours(athlete.id, weekStart, weekEnd, caraLogs)
    const weeklyTotal = daily.reduce((a, b) => a + b, 0)
    const status = getStatus(weeklyTotal, maxHours)

    rows.push([
      `"${athlete.name}"`,
      ...daily.map((h) => h.toFixed(2)),
      weeklyTotal.toFixed(2),
      status,
    ])
  }

  return rows.map((r) => r.join(',')).join('\n')
}

module.exports = { generatePDFReport, generateCSVReport }
