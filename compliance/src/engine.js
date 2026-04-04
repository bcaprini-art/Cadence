/**
 * @fileoverview AthletiSync Compliance Engine
 *
 * Core business logic for NCAA/NAIA CARA (Countable Athletically Related
 * Activities) compliance checking. Pure functions — no database calls,
 * no HTTP, fully deterministic.
 *
 * Usage:
 *   const { ComplianceEngine, rulesets } = require('@athletisync/compliance');
 *   const engine = new ComplianceEngine();
 *   const result = engine.checkEvent(event, caraLogs, rulesets.D1);
 *
 * Data contracts:
 *
 * Event object:
 *   {
 *     id: string,
 *     teamId: string,
 *     title: string,
 *     type: 'PRACTICE' | 'GAME' | 'FILM' | 'TRAVEL' | 'MEETING' | ...,
 *     start: Date | string,  // ISO string or Date
 *     end: Date | string,
 *     isMandatory: boolean,  // if false, FILM/MEETING may not be countable
 *     isDeadPeriod: boolean, // optional override flag
 *     isAwayGame: boolean,   // for TRAVEL countability
 *   }
 *
 * CARALog object:
 *   {
 *     id: string,
 *     athleteId: string,
 *     eventId: string,
 *     hours: number,
 *     date: Date | string,   // ISO string or Date — the date of the activity
 *     weekStart: Date | string, // Monday of the week (ISO string or Date)
 *     type: string,          // event type, same as Event.type
 *     isMandatory: boolean,
 *   }
 *
 * Ruleset object: see src/rules/d1.js, d2.js, d3.js, naia.js
 */

'use strict';

const { D1_RULESET } = require('./rules/d1');
const { D2_RULESET } = require('./rules/d2');
const { D3_RULESET } = require('./rules/d3');
const { NAIA_RULESET } = require('./rules/naia');

// ─── Date Helpers ────────────────────────────────────────────────────────────

/**
 * Normalizes a value to a Date object.
 * @param {Date|string} val
 * @returns {Date}
 */
function toDate(val) {
  if (val instanceof Date) return val;
  return new Date(val);
}

/**
 * Returns a YYYY-MM-DD string for a date (UTC-free, local date).
 * We strip time component to compare calendar days.
 * @param {Date|string} val
 * @returns {string} e.g. "2025-10-14"
 */
function toDateString(val) {
  const d = toDate(val);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the start-of-day (midnight) for a given date.
 * @param {Date|string} val
 * @returns {Date}
 */
function startOfDay(val) {
  const d = toDate(val);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Computes duration in hours between two dates.
 * @param {Date|string} start
 * @param {Date|string} end
 * @returns {number} Hours (decimal)
 */
function durationHours(start, end) {
  const ms = toDate(end) - toDate(start);
  return Math.max(0, ms / (1000 * 60 * 60));
}

/**
 * Returns the ISO week start (Monday 00:00:00) for a given date.
 * @param {Date|string} val
 * @returns {Date}
 */
function getWeekStart(val) {
  const d = startOfDay(val);
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = (day === 0) ? -6 : 1 - day; // back to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Returns the end of a week (Sunday 23:59:59.999) given its Monday start.
 * @param {Date|string} weekStart
 * @returns {Date}
 */
function getWeekEnd(weekStart) {
  const d = toDate(weekStart);
  const end = new Date(d.getTime());
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Checks if two date strings represent the same calendar day.
 * @param {Date|string} a
 * @param {Date|string} b
 * @returns {boolean}
 */
function isSameDay(a, b) {
  return toDateString(a) === toDateString(b);
}

/**
 * Checks if a date falls within [weekStart, weekStart + 6 days].
 * @param {Date|string} date
 * @param {Date|string} weekStart
 * @returns {boolean}
 */
function isInWeek(date, weekStart) {
  const d = startOfDay(date).getTime();
  const ws = startOfDay(weekStart).getTime();
  const we = ws + (6 * 24 * 60 * 60 * 1000);
  return d >= ws && d <= we;
}

// ─── ComplianceEngine ─────────────────────────────────────────────────────────

/**
 * Main compliance engine class.
 *
 * All methods are pure/deterministic given the same inputs.
 * No state is stored on the instance — it exists for namespacing.
 */
class ComplianceEngine {
  constructor() {
    // Engine is stateless; constructor reserved for future config injection
  }

  // ─── Core Calculation Methods ──────────────────────────────────────────────

  /**
   * Calculates total countable CARA hours for an athlete in a given week.
   *
   * @param {string} athleteId - The athlete's unique ID
   * @param {Date|string} weekStart - Monday of the target week
   * @param {Array<Object>} caraLogs - Array of CARALog objects
   * @returns {number} Total countable hours for the week
   *
   * @example
   * const hours = engine.getWeeklyHours('athlete-1', '2025-10-13', caraLogs);
   * // → 18.5
   */
  getWeeklyHours(athleteId, weekStart, caraLogs) {
    if (!Array.isArray(caraLogs)) return 0;

    return caraLogs
      .filter(log =>
        log.athleteId === athleteId &&
        isInWeek(log.date || log.weekStart, weekStart)
      )
      .reduce((sum, log) => sum + (log.hours || 0), 0);
  }

  /**
   * Calculates total countable CARA hours for an athlete on a specific date.
   *
   * @param {string} athleteId - The athlete's unique ID
   * @param {Date|string} date - The calendar date to check
   * @param {Array<Object>} caraLogs - Array of CARALog objects
   * @returns {number} Total countable hours for that day
   *
   * @example
   * const hours = engine.getDailyHours('athlete-1', '2025-10-14', caraLogs);
   * // → 3.5
   */
  getDailyHours(athleteId, date, caraLogs) {
    if (!Array.isArray(caraLogs)) return 0;

    return caraLogs
      .filter(log =>
        log.athleteId === athleteId &&
        isSameDay(log.date, date)
      )
      .reduce((sum, log) => sum + (log.hours || 0), 0);
  }

  /**
   * Returns remaining allowable CARA hours for an athlete in a week.
   *
   * @param {string} athleteId - The athlete's unique ID
   * @param {Date|string} weekStart - Monday of the target week
   * @param {Array<Object>} caraLogs - Array of CARALog objects
   * @param {Object} ruleset - A ruleset object (D1_RULESET, D2_RULESET, etc.)
   * @param {boolean} [inSeason=true] - Whether the athlete is in-season
   * @returns {{ dailyRemaining: number, weeklyRemaining: number, weeklyUsed: number }}
   *
   * @example
   * const remaining = engine.getRemainingHours('athlete-1', '2025-10-13', logs, D1_RULESET);
   * // → { dailyRemaining: 2, weeklyRemaining: 5, weeklyUsed: 15 }
   */
  getRemainingHours(athleteId, weekStart, caraLogs, ruleset, inSeason = true) {
    const limits = this._getLimits(ruleset, inSeason);
    const today = new Date();

    const weeklyUsed = this.getWeeklyHours(athleteId, weekStart, caraLogs);
    const dailyUsed = this.getDailyHours(athleteId, today, caraLogs);

    const weeklyRemaining = Math.max(0, limits.maxHoursPerWeek - weeklyUsed);
    const dailyRemaining = limits.maxHoursPerDay !== undefined
      ? Math.max(0, limits.maxHoursPerDay - dailyUsed)
      : Infinity;

    return { dailyRemaining, weeklyRemaining, weeklyUsed };
  }

  // ─── Event Checking ────────────────────────────────────────────────────────

  /**
   * Checks whether adding a new event would keep an athlete compliant.
   *
   * This is the primary entry point for pre-scheduling compliance checks.
   * Call this before saving a new event to verify no violations occur.
   *
   * @param {Object} event - The proposed event object
   * @param {string} event.type - Event type (e.g. 'PRACTICE', 'GAME')
   * @param {Date|string} event.start - Event start time
   * @param {Date|string} event.end - Event end time
   * @param {boolean} [event.isMandatory=true] - Whether attendance is mandatory
   * @param {boolean} [event.isAwayGame=false] - Whether this is away travel
   * @param {string} event.athleteId - Athlete this check is for
   * @param {Array<Object>} athleteCARALogs - Existing CARA logs for this athlete
   * @param {Object} ruleset - The applicable ruleset
   * @param {boolean} [inSeason=true] - Whether athlete is in-season
   * @returns {{
   *   compliant: boolean,
   *   violations: string[],
   *   warnings: string[],
   *   hoursAfterEvent: number,
   *   dailyHoursAfterEvent: number
   * }}
   *
   * @example
   * const result = engine.checkEvent(
   *   { type: 'PRACTICE', start: '2025-10-14T15:00', end: '2025-10-14T18:00', athleteId: 'a1' },
   *   existingLogs,
   *   D1_RULESET
   * );
   * // → { compliant: false, violations: ['Weekly CARA limit exceeded: 21 > 20 hrs'], ... }
   */
  checkEvent(event, athleteCARALogs, ruleset, inSeason = true) {
    const violations = [];
    const warnings = [];

    const { type, start, end, athleteId } = event;
    const isMandatory = event.isMandatory !== false; // default true

    // Determine if this event is countable
    const countable = this.isCountableActivity(type, ruleset, {
      isMandatory,
      isAwayGame: event.isAwayGame,
    });

    const eventHours = durationHours(start, end);

    // Non-countable events skip hour checks but may still have dead period violations
    if (!countable) {
      const isDP = this.isDeadPeriod(toDate(start), ruleset);
      if (isDP && ruleset.deadPeriodContactProhibited) {
        violations.push(
          `Dead period violation: No coach-athlete contact permitted on ${toDateString(start)}.`
        );
      }
      return {
        compliant: violations.length === 0,
        violations,
        warnings,
        hoursAfterEvent: athleteId
          ? this.getWeeklyHours(athleteId, getWeekStart(start), athleteCARALogs)
          : 0,
        dailyHoursAfterEvent: athleteId
          ? this.getDailyHours(athleteId, start, athleteCARALogs)
          : 0,
      };
    }

    // Dead period check
    if (this.isDeadPeriod(toDate(start), ruleset)) {
      if (ruleset.deadPeriodContactProhibited) {
        violations.push(
          `Dead period violation: Countable activity '${type}' is not permitted on ${toDateString(start)}.`
        );
      } else {
        warnings.push(
          `Activity scheduled during dead period on ${toDateString(start)}.`
        );
      }
    }

    const limits = this._getLimits(ruleset, inSeason);
    const weekStart = getWeekStart(start);

    const existingWeeklyHours = athleteId
      ? this.getWeeklyHours(athleteId, weekStart, athleteCARALogs)
      : 0;
    const existingDailyHours = athleteId
      ? this.getDailyHours(athleteId, start, athleteCARALogs)
      : 0;

    const weeklyAfter = existingWeeklyHours + eventHours;
    const dailyAfter = existingDailyHours + eventHours;

    // Daily limit check
    if (limits.maxHoursPerDay !== undefined && dailyAfter > limits.maxHoursPerDay) {
      violations.push(
        `Daily CARA limit exceeded: ${dailyAfter.toFixed(2)} hrs > ${limits.maxHoursPerDay} hr max on ${toDateString(start)}.`
      );
    }

    // Weekly limit check
    if (weeklyAfter > limits.maxHoursPerWeek) {
      violations.push(
        `Weekly CARA limit exceeded: ${weeklyAfter.toFixed(2)} hrs > ${limits.maxHoursPerWeek} hr max for week of ${toDateString(weekStart)}.`
      );
    }

    // Warning threshold check (warn before hitting limit)
    const warnThreshold = ruleset.warningThresholdPercent || 0.9;
    if (
      violations.length === 0 &&
      weeklyAfter >= limits.maxHoursPerWeek * warnThreshold
    ) {
      warnings.push(
        `Approaching weekly CARA limit: ${weeklyAfter.toFixed(2)} of ${limits.maxHoursPerWeek} hrs used (${Math.round(weeklyAfter / limits.maxHoursPerWeek * 100)}%).`
      );
    }

    // Mandatory rest day check — warn if adding this event would eliminate rest days
    if (limits.mandatoryDaysOffPerWeek > 0) {
      const weekLogs = (athleteCARALogs || []).filter(
        log => log.athleteId === athleteId && isInWeek(log.date, weekStart)
      );
      // Simulate adding the event as a log entry
      const simulatedLogs = [
        ...weekLogs,
        { athleteId, date: start, hours: eventHours },
      ];
      if (!this.isMandatoryRestDay(simulatedLogs, ruleset)) {
        violations.push(
          `Mandatory rest day violation: Adding this event leaves fewer than ${limits.mandatoryDaysOffPerWeek} rest day(s) for the week of ${toDateString(weekStart)}.`
        );
      }
    }

    return {
      compliant: violations.length === 0,
      violations,
      warnings,
      hoursAfterEvent: weeklyAfter,
      dailyHoursAfterEvent: dailyAfter,
    };
  }

  // ─── Status / Classification ───────────────────────────────────────────────

  /**
   * Determines if a given event type is countable as CARA for the given ruleset.
   *
   * Handles edge cases:
   *  - FILM: only countable if isMandatory is true
   *  - MEETING: only countable if isMandatory is true
   *  - TRAVEL: only countable if isAwayGame is true
   *
   * @param {string} eventType - e.g. 'PRACTICE', 'GAME', 'FILM'
   * @param {Object} [ruleset] - Optional ruleset; defaults to D1
   * @param {Object} [options] - Additional context
   * @param {boolean} [options.isMandatory=true] - For FILM/MEETING
   * @param {boolean} [options.isAwayGame=false] - For TRAVEL
   * @returns {boolean}
   *
   * @example
   * engine.isCountableActivity('FILM', D1_RULESET, { isMandatory: false }); // → false
   * engine.isCountableActivity('FILM', D1_RULESET, { isMandatory: true });  // → true
   */
  isCountableActivity(eventType, ruleset, options = {}) {
    if (!eventType) return false;

    const type = eventType.toUpperCase();
    const isMandatory = options.isMandatory !== false; // default true
    const isAwayGame = options.isAwayGame === true;

    // FILM and MEETING only count if mandatory
    if (type === 'FILM' || type === 'MEETING') {
      return isMandatory;
    }

    // TRAVEL only counts for away games
    if (type === 'TRAVEL') {
      return isAwayGame;
    }

    // Use ruleset's countable activities set if available
    const countableSet = ruleset
      ? (ruleset.countableActivities || ruleset.athleticActivities)
      : null;

    if (countableSet) {
      return countableSet.has(type);
    }

    // Fallback: check D1 defaults
    const { COUNTABLE_ACTIVITY_TYPES } = require('./rules/d1');
    return COUNTABLE_ACTIVITY_TYPES.has(type);
  }

  /**
   * Checks if a given date falls within a configured dead period.
   *
   * Dead periods must be provided in the ruleset as `deadPeriods` —
   * an array of { start: Date|string, end: Date|string } objects.
   * If no dead periods are configured and deadPeriodRulesApply is true,
   * this returns false (benefit of the doubt).
   *
   * @param {Date|string} date - The date to check
   * @param {Object} ruleset - The applicable ruleset
   * @param {Array<{start: Date|string, end: Date|string}>} [ruleset.deadPeriods]
   * @returns {boolean} True if the date is within a dead period
   *
   * @example
   * const dp = [{ start: '2025-12-01', end: '2025-12-15' }];
   * engine.isDeadPeriod('2025-12-10', { ...D1_RULESET, deadPeriods: dp }); // → true
   */
  isDeadPeriod(date, ruleset) {
    if (!ruleset || !ruleset.deadPeriodRulesApply) return false;
    if (!ruleset.deadPeriods || ruleset.deadPeriods.length === 0) return false;

    const target = startOfDay(date).getTime();

    return ruleset.deadPeriods.some(period => {
      const from = startOfDay(period.start).getTime();
      const to = startOfDay(period.end).getTime();
      return target >= from && target <= to;
    });
  }

  /**
   * Determines whether mandatory rest day requirements are satisfied
   * for the week represented by the provided CARA logs.
   *
   * Counts the number of unique calendar days WITH athletic activity.
   * The remaining days in the 7-day week are "off days."
   *
   * @param {Array<Object>} weekCARALogs - CARA logs for a single athlete for one week
   * @param {Object} ruleset - The applicable ruleset
   * @param {boolean} [inSeason=true]
   * @returns {boolean} True if mandatory rest requirements ARE met
   *
   * @example
   * // Athlete practiced Mon-Sat (6 days), D1 requires 1 day off
   * engine.isMandatoryRestDay(logs, D1_RULESET); // → true (6 active + 1 off = OK)
   *
   * // Athlete practiced all 7 days
   * engine.isMandatoryRestDay(logsAllWeek, D1_RULESET); // → false (0 off days)
   */
  isMandatoryRestDay(weekCARALogs, ruleset, inSeason = true) {
    if (!ruleset) return true;

    const limits = this._getLimits(ruleset, inSeason);
    const requiredDaysOff = limits.mandatoryDaysOffPerWeek || 0;

    if (requiredDaysOff === 0) return true; // no requirement
    if (!Array.isArray(weekCARALogs) || weekCARALogs.length === 0) {
      // No activities at all = all 7 days off = always compliant
      return true;
    }

    // Count unique days with activity
    const activeDays = new Set(
      weekCARALogs
        .filter(log => (log.hours || 0) > 0)
        .map(log => toDateString(log.date))
    );

    const daysOff = 7 - activeDays.size;
    return daysOff >= requiredDaysOff;
  }

  /**
   * Flags athletes on a team for the given week based on compliance status.
   *
   * Returns a status for each athlete found in caraLogs for that team/week.
   *
   * Status levels:
   *  - 'ok'        — compliant, < warning threshold
   *  - 'warning'   — approaching limit or other soft issue
   *  - 'violation' — hard limit exceeded
   *
   * @param {string} teamId - Team identifier (used to filter caraLogs)
   * @param {Date|string} weekStart - Monday of the week to check
   * @param {Array<Object>} caraLogs - All CARA logs (will be filtered by teamId/weekStart)
   * @param {Object} ruleset - The applicable ruleset
   * @param {boolean} [inSeason=true]
   * @returns {Array<{ athleteId: string, status: 'ok'|'warning'|'violation', detail: string, hoursUsed: number, hoursLimit: number }>}
   *
   * @example
   * const flags = engine.flagAthletes('team-1', '2025-10-13', logs, D1_RULESET);
   * // → [{ athleteId: 'a1', status: 'violation', detail: 'Weekly limit exceeded...', hoursUsed: 22, hoursLimit: 20 }]
   */
  flagAthletes(teamId, weekStart, caraLogs, ruleset, inSeason = true) {
    if (!Array.isArray(caraLogs)) return [];

    const limits = this._getLimits(ruleset, inSeason);
    const warnThreshold = ruleset.warningThresholdPercent || 0.9;

    // Filter logs for this team and week
    const weekLogs = caraLogs.filter(log =>
      log.teamId === teamId && isInWeek(log.date || log.weekStart, weekStart)
    );

    // Get unique athlete IDs
    const athleteIds = [...new Set(weekLogs.map(log => log.athleteId))];

    return athleteIds.map(athleteId => {
      const athleteLogs = weekLogs.filter(l => l.athleteId === athleteId);
      const hoursUsed = athleteLogs.reduce((sum, l) => sum + (l.hours || 0), 0);

      // Check rest days
      const hasRestDayViolation = !this.isMandatoryRestDay(athleteLogs, ruleset, inSeason);

      // Check daily violations
      const dailyViolation = this._checkDailyViolations(athleteLogs, limits);

      if (hoursUsed > limits.maxHoursPerWeek || hasRestDayViolation || dailyViolation) {
        let detail = '';
        if (hoursUsed > limits.maxHoursPerWeek) {
          detail = `Weekly CARA limit exceeded: ${hoursUsed.toFixed(2)} / ${limits.maxHoursPerWeek} hrs.`;
        } else if (hasRestDayViolation) {
          detail = `Mandatory rest day requirement not met (needs ${limits.mandatoryDaysOffPerWeek} day(s) off/week).`;
        } else if (dailyViolation) {
          detail = `Daily CARA limit exceeded on ${dailyViolation.date}: ${dailyViolation.hours.toFixed(2)} / ${limits.maxHoursPerDay} hrs.`;
        }
        return { athleteId, status: 'violation', detail, hoursUsed, hoursLimit: limits.maxHoursPerWeek };
      }

      if (hoursUsed >= limits.maxHoursPerWeek * warnThreshold) {
        return {
          athleteId,
          status: 'warning',
          detail: `Approaching weekly limit: ${hoursUsed.toFixed(2)} / ${limits.maxHoursPerWeek} hrs (${Math.round(hoursUsed / limits.maxHoursPerWeek * 100)}%).`,
          hoursUsed,
          hoursLimit: limits.maxHoursPerWeek,
        };
      }

      return {
        athleteId,
        status: 'ok',
        detail: `${hoursUsed.toFixed(2)} / ${limits.maxHoursPerWeek} hrs used.`,
        hoursUsed,
        hoursLimit: limits.maxHoursPerWeek,
      };
    });
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  /**
   * Resolves the applicable limits object from a ruleset and season status.
   * @private
   * @param {Object} ruleset
   * @param {boolean} inSeason
   * @returns {{ maxHoursPerDay?: number, maxHoursPerWeek: number, mandatoryDaysOffPerWeek: number }}
   */
  _getLimits(ruleset, inSeason) {
    if (!ruleset) {
      return D1_RULESET.inSeason; // safe default
    }
    return inSeason ? ruleset.inSeason : ruleset.outOfSeason;
  }

  /**
   * Checks if any individual day in the athlete's logs exceeds the daily limit.
   * @private
   * @param {Array<Object>} athleteLogs
   * @param {{ maxHoursPerDay?: number }} limits
   * @returns {{ date: string, hours: number }|null} First violation found, or null
   */
  _checkDailyViolations(athleteLogs, limits) {
    if (!limits.maxHoursPerDay) return null;

    // Group hours by day
    const byDay = {};
    for (const log of athleteLogs) {
      const day = toDateString(log.date);
      byDay[day] = (byDay[day] || 0) + (log.hours || 0);
    }

    for (const [date, hours] of Object.entries(byDay)) {
      if (hours > limits.maxHoursPerDay) {
        return { date, hours };
      }
    }
    return null;
  }
}

// Export available rulesets as a convenient map
const rulesets = {
  D1: D1_RULESET,
  D2: D2_RULESET,
  D3: D3_RULESET,
  NAIA: NAIA_RULESET,
};

module.exports = {
  ComplianceEngine,
  rulesets,
  // Expose helpers for tests and reports
  _helpers: {
    toDate,
    toDateString,
    startOfDay,
    durationHours,
    getWeekStart,
    getWeekEnd,
    isSameDay,
    isInWeek,
  },
};
