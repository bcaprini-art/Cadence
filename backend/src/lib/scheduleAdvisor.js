/**
 * Cadence Schedule Advisor
 * Converts raw conflict engine output into ranked, plain-English coach prompts.
 *
 * generateCoachPrompts(conflictResult, eventDetails, roster)
 * Returns array of prompt objects:
 *   - headline    : short punchy line
 *   - summary     : 1-2 sentence explanation
 *   - details     : string[] bullet points
 *   - severity    : 'clear' | 'warning' | 'blocked'
 *   - window      : { start, end } | null
 *   - score       : 0-100
 *   - actionLabel : confirm button text
 */

/** Format a Date to "Mon Apr 7, 2:00 PM" style */
function fmt(date) {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

function fmtTime(date) {
  return new Date(date).toLocaleString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

function fmtDateShort(date) {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

/**
 * FERPA-safe display: show first name only, never the reason.
 * Trims last name so we're not leaking full identity in conflict lists.
 */
function ferpaName(fullName) {
  if (!fullName) return 'An athlete'
  const parts = fullName.trim().split(/\s+/)
  return parts[0] // first name only
}

/**
 * De-duplicate hard conflicts by athleteId so one athlete with two blocks
 * only shows once in the list.
 */
function dedupeConflicts(hardConflicts) {
  const seen = new Set()
  return hardConflicts.filter((c) => {
    if (seen.has(c.athleteId)) return false
    seen.add(c.athleteId)
    return true
  })
}

/**
 * Window rank label by position
 */
function windowLabel(index) {
  if (index === 0) return '✅ Best alternative'
  if (index === 1) return '👍 Good option'
  return '🕐 Backup option'
}

/**
 * Build a button label for a window
 */
function buildActionLabel(window) {
  if (!window) return 'Confirm & Schedule'
  const start = new Date(window.start)
  const timeStr = start.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
  return `Schedule ${timeStr} →`
}

/**
 * CARA near-limit warnings (>85% of weekly limit)
 */
function buildCaraWarnings(caraViolations, proposedHours) {
  const warnings = []
  for (const v of caraViolations) {
    const name = ferpaName(v.athleteName)
    const limit = v.limit ?? 20
    const current = v.currentWeeklyHours ?? 0
    const projected = v.projectedHours ?? current + proposedHours

    if (current / limit >= 0.85) {
      warnings.push(
        `⚠️ CARA note: ${name} is at ${current.toFixed(1)}/${limit}h — this would put them at ${projected.toFixed(1)}h`
      )
    }
  }
  return warnings
}

/**
 * Build rest-window note for GAME / TRAVEL events
 */
function buildRestNote(eventType) {
  if (!eventType) return null
  const upper = String(eventType).toUpperCase()
  if (upper === 'GAME') {
    return '📋 NCAA requires a mandatory rest period after game events — block recovery time.'
  }
  if (upper === 'TRAVEL') {
    return '✈️ Travel events count toward CARA hours — remember to log travel time separately.'
  }
  return null
}

/**
 * Main export
 */
function generateCoachPrompts(conflictResult, eventDetails = {}, roster = []) {
  const { hardConflicts = [], caraViolations = [], suggestedWindows = [] } = conflictResult
  const { start, end, type: eventType, venue } = eventDetails

  const proposedStart = start ? new Date(start) : null
  const proposedEnd = end ? new Date(end) : null
  const proposedHours =
    proposedStart && proposedEnd
      ? (proposedEnd - proposedStart) / (1000 * 60 * 60)
      : 1

  const totalAthletes = roster.length || null
  const uniqueConflicts = dedupeConflicts(hardConflicts)
  const softOnly = hardConflicts.length === 0 && caraViolations.length > 0
  const allClear = hardConflicts.length === 0 && caraViolations.length === 0
  const hasHard = hardConflicts.length > 0

  const caraWarnings = buildCaraWarnings(caraViolations, proposedHours)
  const restNote = buildRestNote(eventType)

  const prompts = []

  // ─────────────────────────────────────────────
  // Case 1: All clear
  // ─────────────────────────────────────────────
  if (allClear) {
    const details = []
    if (totalAthletes !== null) details.push(`All ${totalAthletes} athletes available`)
    else details.push('Full team available')
    details.push('No CARA concerns')
    if (venue) details.push(`${venue} is free`)
    if (restNote) details.push(restNote)

    prompts.push({
      headline: '✅ All clear — great time to schedule',
      summary:
        proposedStart
          ? `${fmtDateShort(proposedStart)} from ${fmtTime(proposedStart)}–${fmtTime(proposedEnd)} works perfectly. No conflicts, no compliance issues.`
          : 'This window works perfectly. No conflicts, no compliance issues.',
      details,
      severity: 'clear',
      window: proposedStart ? { start: proposedStart, end: proposedEnd } : null,
      score: 100,
      actionLabel: buildActionLabel(
        proposedStart ? { start: proposedStart, end: proposedEnd } : null
      ),
    })

    return prompts
  }

  // ─────────────────────────────────────────────
  // Case 2: Soft conflicts only (CARA warnings, no hard blocks)
  // ─────────────────────────────────────────────
  if (softOnly) {
    const details = []
    if (totalAthletes !== null) details.push(`All ${totalAthletes} athletes available`)
    else details.push('No hard schedule conflicts')
    details.push('Minor CARA concerns — not blocking')
    for (const w of caraWarnings) details.push(w)
    if (restNote) details.push(restNote)

    prompts.push({
      headline: '⚠️ Minor conflicts — workable',
      summary:
        'No athletes are blocked, but some are close to their CARA weekly limit. You can proceed — just watch the hours.',
      details,
      severity: 'warning',
      window: proposedStart ? { start: proposedStart, end: proposedEnd } : null,
      score: 72,
      actionLabel: buildActionLabel(
        proposedStart ? { start: proposedStart, end: proposedEnd } : null
      ),
    })

    return prompts
  }

  // ─────────────────────────────────────────────
  // Case 3: Hard conflicts on proposed time
  // ─────────────────────────────────────────────
  if (hasHard) {
    // 3a. Blocked prompt for proposed time
    const conflictDetails = uniqueConflicts.map(
      (c) => `${ferpaName(c.athleteName)} — BUSY ${fmtTime(c.start)}–${fmtTime(c.end)}`
    )
    for (const w of caraWarnings) conflictDetails.push(w)
    if (restNote) conflictDetails.push(restNote)

    prompts.push({
      headline: `🚫 Can't schedule here — ${uniqueConflicts.length} athlete${uniqueConflicts.length !== 1 ? 's' : ''} ${uniqueConflicts.length === 1 ? 'has a conflict' : 'have conflicts'}`,
      summary:
        `${uniqueConflicts.length} of your athletes ${uniqueConflicts.length === 1 ? 'is' : 'are'} unavailable at this time. Pick one of the options below.`,
      details: conflictDetails,
      severity: 'blocked',
      window: proposedStart ? { start: proposedStart, end: proposedEnd } : null,
      score: 0,
      actionLabel: null, // blocked — no confirm button
    })

    // 3b. Ranked alternative windows
    suggestedWindows.forEach((w, i) => {
      const available = w.availableCount ?? 0
      const total = totalAthletes ?? available
      const scoreInt = Math.round((w.score ?? 0) * 100)
      const label = windowLabel(i)

      const details = []
      if (available === total) {
        details.push(`Full team available — all ${total} athletes free`)
      } else {
        details.push(`${available}/${total} athletes free`)
      }

      // CARA warnings for this window — reuse same logic (caraViolations are for the proposed window,
      // but they still apply as a general heads-up for the team)
      if (caraWarnings.length > 0) {
        for (const cw of caraWarnings) details.push(cw)
      } else {
        details.push('No CARA concerns')
      }

      if (venue) details.push(`${venue} is free`)
      if (i === 1 && caraWarnings.length > 0) {
        // nudge for 2nd option
        details.push('Minor trade-off: review CARA hours before confirming')
      }
      if (restNote) details.push(restNote)

      let summary
      if (available === total) {
        summary = `${fmtDateShort(w.start)} ${fmtTime(w.start)}–${fmtTime(w.end)} — whole team is free.`
      } else {
        const missing = total - available
        summary = `${fmtDateShort(w.start)} ${fmtTime(w.start)}–${fmtTime(w.end)} — ${missing} athlete${missing !== 1 ? 's' : ''} ${missing === 1 ? 'has a minor conflict' : 'have minor conflicts'}.`
      }

      let severity = 'clear'
      if (available < total) severity = 'warning'

      prompts.push({
        headline: `${label} — ${available}/${total} athletes free`,
        summary,
        details,
        severity,
        window: { start: w.start, end: w.end },
        score: scoreInt,
        actionLabel: buildActionLabel(w),
      })
    })
  }

  return prompts
}

module.exports = { generateCoachPrompts }
