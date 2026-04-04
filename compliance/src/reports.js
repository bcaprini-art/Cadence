/**
 * @fileoverview AthletiSync Compliance Report Generator
 *
 * Generates structured compliance reports and NCAA-style data exports
 * from CARA log data. Pure functions — no database or HTTP access.
 *
 * All generators return plain JS objects or arrays of plain objects.
 * For CSV export, use generateComplianceExport() which produces row arrays
 * suitable for serialization with any CSV library.
 *
 * Usage:
 *   const { generateWeeklyReport, generateComplianceExport, getSummaryStats } = require('@athletisync/compliance');
 */

'use strict';

const { ComplianceEngine, _helpers } = require('./engine');
const { toDateString, isInWeek, getWeekStart, getWeekEnd } = _helpers;

const engine = new ComplianceEngine();

// ─── Weekly Report ────────────────────────────────────────────────────────────

/**
 * Generates a structured weekly compliance report for a team.
 *
 * The report includes per-athlete summaries, team aggregates,
 * flagged athletes, and a top-level compliance status.
 *
 * @param {string} teamId - Team identifier
 * @param {Date|string} weekStart - Monday of the report week
 * @param {Array<Object>} caraLogs - All CARA logs (filtered internally)
 * @param {Object} ruleset - The applicable ruleset
 * @param {boolean} [inSeason=true] - Whether the team is in-season
 * @returns {{
 *   teamId: string,
 *   weekStart: string,
 *   weekEnd: string,
 *   division: string,
 *   generatedAt: string,
 *   inSeason: boolean,
 *   limits: Object,
 *   athleteSummaries: Array<Object>,
 *   flags: Array<Object>,
 *   teamStats: Object,
 *   compliant: boolean,
 *   violationCount: number,
 *   warningCount: number
 * }}
 *
 * @example
 * const report = generateWeeklyReport('team-1', '2025-10-13', logs, D1_RULESET);
 * console.log(report.violationCount); // 0
 */
function generateWeeklyReport(teamId, weekStart, caraLogs, ruleset, inSeason = true) {
  if (!Array.isArray(caraLogs)) caraLogs = [];

  const ws = toDateString(weekStart);
  const we = toDateString(getWeekEnd(weekStart));
  const limits = inSeason ? ruleset.inSeason : ruleset.outOfSeason;

  // Filter logs for this team + week
  const weekLogs = caraLogs.filter(log =>
    log.teamId === teamId && isInWeek(log.date || log.weekStart, weekStart)
  );

  // Per-athlete summaries
  const athleteIds = [...new Set(weekLogs.map(l => l.athleteId))];

  const athleteSummaries = athleteIds.map(athleteId => {
    const athleteLogs = weekLogs.filter(l => l.athleteId === athleteId);
    const hoursUsed = athleteLogs.reduce((sum, l) => sum + (l.hours || 0), 0);

    // Count active days
    const activeDays = new Set(athleteLogs.map(l => toDateString(l.date)));
    const daysOff = 7 - activeDays.size;
    const restDayCompliant = engine.isMandatoryRestDay(athleteLogs, ruleset, inSeason);

    // Daily breakdown
    const byDay = {};
    for (const log of athleteLogs) {
      const day = toDateString(log.date);
      if (!byDay[day]) byDay[day] = { date: day, hours: 0, events: [] };
      byDay[day].hours += log.hours || 0;
      if (log.eventId) byDay[day].events.push(log.eventId);
    }

    return {
      athleteId,
      hoursUsed: Math.round(hoursUsed * 100) / 100,
      hoursLimit: limits.maxHoursPerWeek,
      percentUsed: Math.round((hoursUsed / limits.maxHoursPerWeek) * 100),
      activeDays: activeDays.size,
      daysOff,
      restDayCompliant,
      dailyBreakdown: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
    };
  });

  // Flags
  const flags = engine.flagAthletes(teamId, weekStart, caraLogs, ruleset, inSeason);

  const violationCount = flags.filter(f => f.status === 'violation').length;
  const warningCount = flags.filter(f => f.status === 'warning').length;

  // Team aggregates
  const allHours = athleteSummaries.map(a => a.hoursUsed);
  const avgHours = allHours.length
    ? Math.round((allHours.reduce((s, h) => s + h, 0) / allHours.length) * 100) / 100
    : 0;
  const maxHours = allHours.length ? Math.max(...allHours) : 0;

  return {
    teamId,
    weekStart: ws,
    weekEnd: we,
    division: ruleset.division || 'UNKNOWN',
    generatedAt: new Date().toISOString(),
    inSeason,
    limits,
    athleteSummaries,
    flags,
    teamStats: {
      athleteCount: athleteIds.length,
      avgHoursPerAthlete: avgHours,
      maxHoursAnyAthlete: maxHours,
      totalTeamHours: Math.round(allHours.reduce((s, h) => s + h, 0) * 100) / 100,
    },
    compliant: violationCount === 0,
    violationCount,
    warningCount,
  };
}

// ─── Compliance Export (CSV-ready) ────────────────────────────────────────────

/**
 * Generates an NCAA-style compliance export for a full season.
 *
 * Returns headers and rows suitable for CSV serialization.
 * Each row represents one athlete's summary for one week.
 *
 * @param {string} teamId - Team identifier
 * @param {{ start: Date|string, end: Date|string }} season - Season date range
 * @param {Array<Object>} caraLogs - All CARA logs for the season
 * @param {Object} ruleset - The applicable ruleset
 * @param {boolean} [inSeason=true]
 * @returns {{
 *   headers: string[],
 *   rows: Array<Array<string|number>>,
 *   metadata: Object
 * }}
 *
 * @example
 * const export = generateComplianceExport('team-1', { start: '2025-08-01', end: '2025-12-31' }, logs, D1_RULESET);
 * // Use papaparse or similar: Papa.unparse({ fields: export.headers, data: export.rows })
 */
function generateComplianceExport(teamId, season, caraLogs, ruleset, inSeason = true) {
  if (!Array.isArray(caraLogs)) caraLogs = [];

  const headers = [
    'Team ID',
    'Athlete ID',
    'Week Start',
    'Week End',
    'Division',
    'Season Status',
    'Hours Used',
    'Hours Limit',
    'Percent Used',
    'Active Days',
    'Days Off',
    'Rest Day Compliant',
    'Status',
    'Violation Detail',
  ];

  const rows = [];

  // Enumerate all weeks in the season
  const seasonStart = new Date(season.start);
  const seasonEnd = new Date(season.end);
  const weeks = _enumerateWeeks(seasonStart, seasonEnd);

  for (const weekStart of weeks) {
    const flags = engine.flagAthletes(teamId, weekStart, caraLogs, ruleset, inSeason);
    const weekLogs = caraLogs.filter(log =>
      log.teamId === teamId && isInWeek(log.date || log.weekStart, weekStart)
    );

    const athleteIds = [...new Set(weekLogs.map(l => l.athleteId))];

    for (const athleteId of athleteIds) {
      const athleteLogs = weekLogs.filter(l => l.athleteId === athleteId);
      const hoursUsed = athleteLogs.reduce((s, l) => s + (l.hours || 0), 0);
      const limits = inSeason ? ruleset.inSeason : ruleset.outOfSeason;
      const activeDays = new Set(athleteLogs.map(l => toDateString(l.date))).size;
      const daysOff = 7 - activeDays;
      const restDayCompliant = engine.isMandatoryRestDay(athleteLogs, ruleset, inSeason);
      const flag = flags.find(f => f.athleteId === athleteId) || { status: 'ok', detail: '' };

      rows.push([
        teamId,
        athleteId,
        toDateString(weekStart),
        toDateString(getWeekEnd(weekStart)),
        ruleset.division || 'UNKNOWN',
        inSeason ? 'IN_SEASON' : 'OUT_OF_SEASON',
        Math.round(hoursUsed * 100) / 100,
        limits.maxHoursPerWeek,
        Math.round((hoursUsed / limits.maxHoursPerWeek) * 100),
        activeDays,
        daysOff,
        restDayCompliant ? 'YES' : 'NO',
        flag.status.toUpperCase(),
        flag.detail || '',
      ]);
    }
  }

  return {
    headers,
    rows,
    metadata: {
      teamId,
      division: ruleset.division || 'UNKNOWN',
      seasonStart: toDateString(season.start),
      seasonEnd: toDateString(season.end),
      generatedAt: new Date().toISOString(),
      totalRows: rows.length,
      weeksCovered: weeks.length,
    },
  };
}

// ─── Summary Stats ────────────────────────────────────────────────────────────

/**
 * Computes aggregate compliance statistics across all CARA logs provided.
 *
 * Useful for dashboard-level metrics: how many athletes are at risk,
 * what's the team's average CARA utilization, etc.
 *
 * @param {Array<Object>} caraLogs - CARA logs to analyze
 * @param {Object} ruleset - The applicable ruleset
 * @param {boolean} [inSeason=true]
 * @returns {{
 *   totalAthletes: number,
 *   totalHours: number,
 *   avgHours: number,
 *   maxHours: number,
 *   minHours: number,
 *   athletesAtRisk: number,
 *   athletesInViolation: number,
 *   percentCompliant: number,
 *   hoursLimit: number,
 *   utilizationPercent: number
 * }}
 *
 * @example
 * const stats = getSummaryStats(caraLogs, D1_RULESET);
 * // → { totalAthletes: 25, avgHours: 16.4, athletesAtRisk: 3, athletesInViolation: 1, ... }
 */
function getSummaryStats(caraLogs, ruleset, inSeason = true) {
  if (!Array.isArray(caraLogs) || caraLogs.length === 0) {
    const limits = inSeason ? ruleset.inSeason : ruleset.outOfSeason;
    return {
      totalAthletes: 0,
      totalHours: 0,
      avgHours: 0,
      maxHours: 0,
      minHours: 0,
      athletesAtRisk: 0,
      athletesInViolation: 0,
      percentCompliant: 100,
      hoursLimit: limits.maxHoursPerWeek,
      utilizationPercent: 0,
    };
  }

  const limits = inSeason ? ruleset.inSeason : ruleset.outOfSeason;
  const warnThreshold = ruleset.warningThresholdPercent || 0.9;

  // Group logs by athlete
  const byAthlete = {};
  for (const log of caraLogs) {
    if (!byAthlete[log.athleteId]) byAthlete[log.athleteId] = [];
    byAthlete[log.athleteId].push(log);
  }

  const athleteIds = Object.keys(byAthlete);
  const hoursPerAthlete = athleteIds.map(id =>
    byAthlete[id].reduce((s, l) => s + (l.hours || 0), 0)
  );

  const totalHours = hoursPerAthlete.reduce((s, h) => s + h, 0);
  const avgHours = totalHours / athleteIds.length;
  const maxHours = Math.max(...hoursPerAthlete);
  const minHours = Math.min(...hoursPerAthlete);

  const athletesInViolation = hoursPerAthlete.filter(h => h > limits.maxHoursPerWeek).length;
  const athletesAtRisk = hoursPerAthlete.filter(
    h => h >= limits.maxHoursPerWeek * warnThreshold && h <= limits.maxHoursPerWeek
  ).length;

  const percentCompliant = athleteIds.length > 0
    ? Math.round(((athleteIds.length - athletesInViolation) / athleteIds.length) * 100)
    : 100;

  return {
    totalAthletes: athleteIds.length,
    totalHours: Math.round(totalHours * 100) / 100,
    avgHours: Math.round(avgHours * 100) / 100,
    maxHours: Math.round(maxHours * 100) / 100,
    minHours: Math.round(minHours * 100) / 100,
    athletesAtRisk,
    athletesInViolation,
    percentCompliant,
    hoursLimit: limits.maxHoursPerWeek,
    utilizationPercent: Math.round((avgHours / limits.maxHoursPerWeek) * 100),
  };
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

/**
 * Enumerates all Monday-starts of weeks that overlap with a date range.
 * @private
 * @param {Date} start
 * @param {Date} end
 * @returns {Date[]}
 */
function _enumerateWeeks(start, end) {
  const weeks = [];
  let current = getWeekStart(start);

  while (current <= end) {
    weeks.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

module.exports = {
  generateWeeklyReport,
  generateComplianceExport,
  getSummaryStats,
};
