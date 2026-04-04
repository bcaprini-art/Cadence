/**
 * @fileoverview NCAA Division I Compliance Rules
 *
 * Implements CARA (Countable Athletically Related Activities) hour limits
 * and related restrictions per NCAA D1 bylaws (Bylaw 17).
 *
 * Key limits:
 *  - In-season: 4 hrs/day, 20 hrs/week max CARA
 *  - Out-of-season: 8 hrs/week max CARA
 *  - 1 mandatory day completely off per week (in-season)
 *  - Dead periods: zero athlete-coach contact
 *  - Final exam periods: no mandatory practice
 *
 * Reference: NCAA Division I Manual, Bylaw 17
 */

'use strict';

/**
 * Event types that ARE countable as CARA under D1 rules.
 * @type {Set<string>}
 */
const COUNTABLE_ACTIVITY_TYPES = new Set([
  'PRACTICE',
  'GAME',
  'FILM',          // mandatory film sessions only
  'TRAVEL',        // travel to away games
  'MEETING',       // mandatory team meetings (athletically-related)
  'COMPETITION',
  'SCRIMMAGE',
  'CONDITIONING',  // required conditioning during season
]);

/**
 * Event types that are NOT countable as CARA under D1 rules.
 * @type {Set<string>}
 */
const NON_COUNTABLE_ACTIVITY_TYPES = new Set([
  'VOLUNTARY_WORKOUT',
  'TEAM_MEAL',
  'COMMUNITY_SERVICE',
  'ACADEMIC',
  'PERSONAL',
  'STUDY_HALL',    // unless required by coach = countable
  'MEDIA',         // media obligations (separate rules)
  'BANQUET',
]);

/**
 * NCAA Division I ruleset configuration object.
 *
 * @typedef {Object} D1Ruleset
 * @property {string} division
 * @property {Object} inSeason - In-season CARA limits
 * @property {number} inSeason.maxHoursPerDay
 * @property {number} inSeason.maxHoursPerWeek
 * @property {number} inSeason.mandatoryDaysOffPerWeek
 * @property {Object} outOfSeason - Out-of-season CARA limits
 * @property {number} outOfSeason.maxHoursPerWeek
 * @property {number} outOfSeason.mandatoryDaysOffPerWeek
 * @property {Set<string>} countableActivities
 * @property {Set<string>} nonCountableActivities
 * @property {number} warningThresholdPercent - Warn when this % of limit is reached
 */

/** @type {D1Ruleset} */
const D1_RULESET = {
  division: 'D1',

  inSeason: {
    /** Maximum CARA hours in a single day (Bylaw 17.1.7.1) */
    maxHoursPerDay: 4,
    /** Maximum CARA hours in a week (Bylaw 17.1.7.2) */
    maxHoursPerWeek: 20,
    /** Minimum required days completely off per week (Bylaw 17.1.7.5) */
    mandatoryDaysOffPerWeek: 1,
  },

  outOfSeason: {
    /** Maximum CARA hours in a week out of season (Bylaw 17.1.7.6) */
    maxHoursPerWeek: 8,
    /** Minimum required days completely off per week out of season */
    mandatoryDaysOffPerWeek: 2,
  },

  /**
   * Activities that count toward CARA totals.
   * NOTE: Film sessions only count if attendance is mandatory.
   * NOTE: Travel counts only for away competitions.
   */
  countableActivities: COUNTABLE_ACTIVITY_TYPES,

  /**
   * Activities explicitly excluded from CARA counting.
   */
  nonCountableActivities: NON_COUNTABLE_ACTIVITY_TYPES,

  /**
   * Threshold (as % of weekly limit) at which a warning is issued.
   * E.g. 0.9 = warn when athlete has used 90%+ of their weekly hours.
   */
  warningThresholdPercent: 0.9,

  /**
   * Rules for dead periods (coach-athlete contact prohibited).
   * Dead periods are defined by the sport's specific schedule and
   * must be configured per-team with actual calendar dates.
   * This flag indicates dead periods are enforced for this ruleset.
   */
  deadPeriodRulesApply: true,

  /**
   * Final exam period restriction: no mandatory practice may be scheduled.
   * Actual exam dates must be provided by the school/institution.
   */
  finalExamRestriction: true,

  /**
   * During dead periods, zero coach-athlete contact is allowed.
   * This includes in-person, phone, and electronic contact.
   */
  deadPeriodContactProhibited: true,
};

/**
 * Determines if a given event type is countable as CARA under D1 rules.
 *
 * Note: For FILM and MEETING types, countability depends on whether
 * attendance is mandatory — that should be indicated via the event's
 * `isMandatory` or `voluntary` field before calling this function.
 *
 * @param {string} eventType - The event type string (e.g. 'PRACTICE', 'GAME')
 * @returns {boolean} True if the activity counts toward CARA totals
 */
function isCountableActivity(eventType) {
  if (!eventType) return false;
  return COUNTABLE_ACTIVITY_TYPES.has(eventType.toUpperCase());
}

/**
 * Returns the applicable hour limits for an athlete based on
 * whether they are currently in-season or out-of-season.
 *
 * @param {boolean} inSeason - Whether the athlete is in-season
 * @returns {{ maxHoursPerDay: number, maxHoursPerWeek: number, mandatoryDaysOffPerWeek: number }}
 */
function getApplicableLimits(inSeason) {
  return inSeason ? D1_RULESET.inSeason : D1_RULESET.outOfSeason;
}

module.exports = {
  D1_RULESET,
  isCountableActivity,
  getApplicableLimits,
  COUNTABLE_ACTIVITY_TYPES,
  NON_COUNTABLE_ACTIVITY_TYPES,
};
