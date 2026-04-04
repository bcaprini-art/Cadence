/**
 * @fileoverview NCAA Division II Compliance Rules
 *
 * Implements CARA hour limits per NCAA D2 bylaws (Bylaw 17).
 *
 * Key limits (very similar to D1 but with some differences):
 *  - In-season: 4 hrs/day, 20 hrs/week max CARA
 *  - Out-of-season: 8 hrs/week max CARA
 *  - 1 mandatory day off per week in-season
 *  - 2 mandatory days off per week out-of-season
 *  - Dead periods: no athlete-coach contact
 *
 * Key differences from D1:
 *  - D2 has fewer sport-specific chapter exceptions
 *  - D2 allows slightly more flexibility in defining "week"
 *  - D2 dead period rules are generally less rigid than D1
 *
 * Reference: NCAA Division II Manual, Bylaw 17
 */

'use strict';

/**
 * Event types that ARE countable as CARA under D2 rules.
 * Largely the same as D1.
 * @type {Set<string>}
 */
const COUNTABLE_ACTIVITY_TYPES = new Set([
  'PRACTICE',
  'GAME',
  'FILM',          // mandatory film only
  'TRAVEL',        // travel to away games
  'MEETING',       // mandatory athletic meetings
  'COMPETITION',
  'SCRIMMAGE',
  'CONDITIONING',
]);

/**
 * Event types NOT countable as CARA under D2 rules.
 * @type {Set<string>}
 */
const NON_COUNTABLE_ACTIVITY_TYPES = new Set([
  'VOLUNTARY_WORKOUT',
  'TEAM_MEAL',
  'COMMUNITY_SERVICE',
  'ACADEMIC',
  'PERSONAL',
  'STUDY_HALL',
  'MEDIA',
  'BANQUET',
]);

/**
 * NCAA Division II ruleset configuration.
 *
 * @typedef {Object} D2Ruleset
 * @property {string} division
 * @property {Object} inSeason
 * @property {Object} outOfSeason
 * @property {Set<string>} countableActivities
 * @property {Set<string>} nonCountableActivities
 * @property {number} warningThresholdPercent
 * @property {boolean} deadPeriodRulesApply
 */

/** @type {D2Ruleset} */
const D2_RULESET = {
  division: 'D2',

  inSeason: {
    /** Maximum CARA hours in a single day */
    maxHoursPerDay: 4,
    /** Maximum CARA hours in a week */
    maxHoursPerWeek: 20,
    /** Minimum required days completely off per week */
    mandatoryDaysOffPerWeek: 1,
  },

  outOfSeason: {
    /** Maximum CARA hours in a week out of season */
    maxHoursPerWeek: 8,
    /**
     * D2 requires 2 days off per week out of season
     * (vs D1 which is 2 as well, but D2 is more explicitly codified)
     */
    mandatoryDaysOffPerWeek: 2,
  },

  countableActivities: COUNTABLE_ACTIVITY_TYPES,
  nonCountableActivities: NON_COUNTABLE_ACTIVITY_TYPES,

  /** Warn at 90% of applicable weekly limit */
  warningThresholdPercent: 0.9,

  /**
   * Dead periods apply in D2, though typically fewer and shorter than D1.
   */
  deadPeriodRulesApply: true,

  /**
   * D2 has final exam period restrictions but less strictly codified
   * at the national level — often left to conference discretion.
   */
  finalExamRestriction: true,
  deadPeriodContactProhibited: true,
};

/**
 * Determines if a given event type is countable as CARA under D2 rules.
 *
 * @param {string} eventType - The event type string
 * @returns {boolean} True if the activity counts toward CARA totals
 */
function isCountableActivity(eventType) {
  if (!eventType) return false;
  return COUNTABLE_ACTIVITY_TYPES.has(eventType.toUpperCase());
}

/**
 * Returns applicable hour limits based on season status.
 *
 * @param {boolean} inSeason
 * @returns {{ maxHoursPerDay: number, maxHoursPerWeek: number, mandatoryDaysOffPerWeek: number }}
 */
function getApplicableLimits(inSeason) {
  return inSeason ? D2_RULESET.inSeason : D2_RULESET.outOfSeason;
}

module.exports = {
  D2_RULESET,
  isCountableActivity,
  getApplicableLimits,
  COUNTABLE_ACTIVITY_TYPES,
  NON_COUNTABLE_ACTIVITY_TYPES,
};
