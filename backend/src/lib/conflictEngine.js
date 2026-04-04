/**
 * AthletiSync Conflict Detection Engine
 * Implements 3-pass algorithm for scheduling conflict detection
 */

const prisma = require('./prisma')

/**
 * Get the Monday (week start) for a given date
 */
function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * PASS 1 — Hard Block Overlap
 * Finds athletes on the team who have hard blocks overlapping the proposed window.
 * Interval overlap: block.start < proposed_end AND block.end > proposed_start
 */
async function pass1HardBlocks(teamId, start, end) {
  const proposedStart = new Date(start)
  const proposedEnd = new Date(end)

  const athletes = await prisma.user.findMany({
    where: { teamId, role: 'ATHLETE' },
    select: { id: true, name: true, email: true },
  })

  const athleteIds = athletes.map((a) => a.id)
  if (athleteIds.length === 0) return []

  const conflicts = await prisma.scheduleBlock.findMany({
    where: {
      userId: { in: athleteIds },
      isHardBlock: true,
      start: { lt: proposedEnd },
      end: { gt: proposedStart },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  return conflicts.map((block) => ({
    athleteId: block.userId,
    athleteName: block.user.name,
    blockId: block.id,
    blockType: block.type,
    start: block.start,
    end: block.end,
    reason: 'HARD_BLOCK_OVERLAP',
  }))
}

/**
 * PASS 2 — CARA Compliance Check
 * Rolling 7-day sum of athletic hours vs ruleset max.
 * The proposed event duration is added to each athlete's current rolling total.
 */
async function pass2CaraCompliance(teamId, start, end) {
  const proposedStart = new Date(start)
  const proposedEnd = new Date(end)
  const proposedHours = (proposedEnd - proposedStart) / (1000 * 60 * 60)

  // Get team with compliance ruleset
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { complianceRuleset: true },
  })

  if (!team?.complianceRuleset) return []

  const ruleset = team.complianceRuleset
  const windowStart = new Date(proposedStart)
  windowStart.setDate(windowStart.getDate() - 6) // 7-day rolling window

  const athletes = await prisma.user.findMany({
    where: { teamId, role: 'ATHLETE' },
    select: { id: true, name: true },
  })

  const violations = []

  for (const athlete of athletes) {
    // Sum existing CARA hours in the rolling 7-day window
    const logs = await prisma.cARALog.findMany({
      where: {
        athleteId: athlete.id,
        weekStart: { gte: windowStart },
      },
    })

    const currentWeeklyHours = logs.reduce((sum, log) => sum + log.hours, 0)
    const projectedHours = currentWeeklyHours + proposedHours

    // Check daily limit
    const dailyLogs = await prisma.cARALog.findMany({
      where: {
        athleteId: athlete.id,
        weekStart: { gte: proposedStart },
      },
    })
    const currentDayHours = dailyLogs.reduce((sum, log) => sum + log.hours, 0)
    const projectedDayHours = currentDayHours + proposedHours

    if (projectedHours > ruleset.maxCaraHoursWeek) {
      violations.push({
        athleteId: athlete.id,
        athleteName: athlete.name,
        currentWeeklyHours,
        projectedHours,
        limit: ruleset.maxCaraHoursWeek,
        violationType: 'WEEKLY_LIMIT',
        division: ruleset.division,
      })
    } else if (projectedDayHours > ruleset.maxCaraHoursDay) {
      violations.push({
        athleteId: athlete.id,
        athleteName: athlete.name,
        currentDayHours,
        projectedDayHours,
        limit: ruleset.maxCaraHoursDay,
        violationType: 'DAILY_LIMIT',
        division: ruleset.division,
      })
    }
  }

  return violations
}

/**
 * PASS 3 — Availability Scoring
 * 30-min sliding window over 7-day lookahead.
 * Score = (available/total)*0.5 + (1 - cara_util)*0.3 + venue_avail*0.2
 */
async function pass3SuggestedWindows(teamId, start, end, venueId = null) {
  const proposedStart = new Date(start)
  const proposedEnd = new Date(end)
  const durationMs = proposedEnd - proposedStart

  const athletes = await prisma.user.findMany({
    where: { teamId, role: 'ATHLETE' },
    select: { id: true, name: true },
  })

  const totalAthletes = athletes.length
  if (totalAthletes === 0) return []

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { complianceRuleset: true },
  })

  // 7-day lookahead, 30-min step
  const lookaheadEnd = new Date(proposedStart)
  lookaheadEnd.setDate(lookaheadEnd.getDate() + 7)

  const windows = []
  let cursor = new Date(proposedStart)
  cursor.setMinutes(cursor.getMinutes() + 30) // start with first alternative

  while (cursor.getTime() + durationMs <= lookaheadEnd.getTime() && windows.length < 20) {
    const windowStart = new Date(cursor)
    const windowEnd = new Date(cursor.getTime() + durationMs)

    // Count athletes available (no hard blocks)
    const blockedAthletes = await prisma.scheduleBlock.findMany({
      where: {
        userId: { in: athletes.map((a) => a.id) },
        isHardBlock: true,
        start: { lt: windowEnd },
        end: { gt: windowStart },
      },
      select: { userId: true },
    })

    const blockedIds = new Set(blockedAthletes.map((b) => b.userId))
    const availableCount = totalAthletes - blockedIds.size
    const availabilityRatio = availableCount / totalAthletes

    // CARA utilization estimate
    let caraUtil = 0
    if (team?.complianceRuleset) {
      const weekStart = getWeekStart(windowStart)
      const caraLogs = await prisma.cARALog.findMany({
        where: {
          athleteId: { in: athletes.map((a) => a.id) },
          weekStart: { gte: weekStart },
        },
      })
      const totalHours = caraLogs.reduce((sum, l) => sum + l.hours, 0)
      const avgHours = totalAthletes > 0 ? totalHours / totalAthletes : 0
      caraUtil = Math.min(avgHours / team.complianceRuleset.maxCaraHoursWeek, 1)
    }

    // Venue availability
    let venueAvail = 1
    if (venueId) {
      const venueConflict = await prisma.venueBooking.findFirst({
        where: {
          venueId,
          start: { lt: windowEnd },
          end: { gt: windowStart },
        },
      })
      venueAvail = venueConflict ? 0 : 1
    }

    const score =
      availabilityRatio * 0.5 + (1 - caraUtil) * 0.3 + venueAvail * 0.2

    windows.push({ start: windowStart, end: windowEnd, score, availableCount })

    cursor = new Date(cursor.getTime() + 30 * 60 * 1000) // advance 30 min
  }

  // Return top 3 by score
  windows.sort((a, b) => b.score - a.score)
  return windows.slice(0, 3)
}

/**
 * CARA Smart Suggestions
 * Given CARA violations from pass2, generates actionable suggestions:
 *   - "shorten": reduce duration so all athletes stay compliant
 *   - "exclude": run at full length, exempt the at-risk athletes
 */
async function generateCARASmartSuggestions(teamId, start, end, caraViolations) {
  if (!caraViolations || caraViolations.length === 0) return []

  const proposedStart = new Date(start)
  const proposedEnd = new Date(end)
  const proposedMinutes = (proposedEnd - proposedStart) / (1000 * 60)

  const suggestions = []

  // Get team ruleset
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { complianceRuleset: true },
  })
  const maxWeek = team?.complianceRuleset?.maxCaraHoursWeek || 20

  // For "shorten" — find the maximum duration all athletes can absorb
  const windowStart = new Date(proposedStart)
  windowStart.setDate(windowStart.getDate() - 6)

  const allAthletes = await prisma.user.findMany({
    where: { teamId, role: 'ATHLETE' },
    select: { id: true, name: true },
  })

  let minRemainingHours = Infinity
  for (const athlete of allAthletes) {
    const logs = await prisma.cARALog.findMany({
      where: { athleteId: athlete.id, weekStart: { gte: windowStart } },
    })
    const currentHours = logs.reduce((sum, l) => sum + l.hours, 0)
    const remaining = maxWeek - currentHours
    if (remaining < minRemainingHours) minRemainingHours = remaining
  }

  const maxSafeMinutes = Math.floor(minRemainingHours * 60)
  if (maxSafeMinutes > 0 && maxSafeMinutes < proposedMinutes) {
    // Round down to nearest 15 min
    const altMinutes = Math.floor(maxSafeMinutes / 15) * 15
    if (altMinutes > 0) {
      const savedHours = parseFloat(((proposedMinutes - altMinutes) / 60).toFixed(2))
      suggestions.push({
        type: 'shorten',
        label: `✂️ Shorten to ${altMinutes < 60 ? altMinutes + ' min' : (altMinutes / 60) + ' hr'}`,
        description: `All ${allAthletes.length} athletes compliant — saves ${savedHours} CARA hour${savedHours !== 1 ? 's' : ''} per athlete`,
        altDurationMinutes: altMinutes,
      })
    }
  }

  // For "exclude" — list the at-risk athletes and suggest running without them
  const violatingAthletes = caraViolations
    .filter((v) => v.violationType === 'WEEKLY_LIMIT')
    .map((v) => ({
      id: v.athleteId,
      name: v.athleteName,
      currentHours: parseFloat(v.currentWeeklyHours.toFixed(1)),
    }))

  if (violatingAthletes.length > 0 && violatingAthletes.length < allAthletes.length) {
    const names = violatingAthletes.map((a) => a.name).join(', ')
    suggestions.push({
      type: 'exclude',
      label: `👤 Exclude ${violatingAthletes.length} athlete${violatingAthletes.length > 1 ? 's' : ''}`,
      description: `Run full ${Math.round(proposedMinutes / 60 * 10) / 10}-hr event, excuse ${names} (at/near limit)`,
      excludeAthletes: violatingAthletes,
    })
  }

  return suggestions
}

/**
 * Main conflict check entrypoint
 */
async function runConflictCheck({ teamId, start, end, venueId = null }) {
  const [hardConflicts, caraViolations, suggestedWindows] = await Promise.all([
    pass1HardBlocks(teamId, start, end),
    pass2CaraCompliance(teamId, start, end),
    pass3SuggestedWindows(teamId, start, end, venueId),
  ])

  const proposedMinutes = (new Date(end) - new Date(start)) / (1000 * 60)
  const smartSuggestions = await generateCARASmartSuggestions(teamId, start, end, caraViolations)

  return { hardConflicts, caraViolations, suggestedWindows, smartSuggestions }
}

module.exports = { runConflictCheck, pass1HardBlocks, pass2CaraCompliance, pass3SuggestedWindows, generateCARASmartSuggestions }
