/**
 * @fileoverview NCAA Division III Compliance Rules
 *
 * D3 philosophy is fundamentally different from D1/D2:
 *  - No athletic scholarships — student-athletes are students first
 *  - No national CARA hour limits at the bylaw level
 *  - Institutions and conferences set their own limits
 *  - No formal dead period requirements at national level
 *  - No mandatory rest day requirements at national level
 *
 * Key differences from D1/D2:
 *  - NCAA D3 does NOT have a mandated weekly CARA hour cap at the national level
 *  - D3 strongly emphasizes academic integration and student wellbeing
 *  - Many D3 conferences adopt voluntary hour limits (often 20 hrs/week in-season)
 *  - This ruleset provides sensible defaults; institutions should customize
 *
 * This implementation provides:
 *  - Default recommended limits (not mandatory)
 *  - Soft warnings at configurable thresholds
 *  - Basic activity classification
 *
 * Reference: NCAA Division III Manual; NCAA D3 philosophy statement
 */

'use strict';

/**
 * Event types generally considered athletically related in D3 context.
 * (Not regulated at national level, but used for scheduling/tracking.)
 * @type {Set<string>}
 */
const ATHLETIC_ACTIVITY_TYPES = new Set([
  'PRACTICE',
  'GAME',
  'FILM',
  'TRAVEL',
  'MEETING',
  'COMPETITION',
  'SCRIMMAGE',
  'CONDITIONING',
]);

/**
 * Non-athletic activity types.
 * @type {Set<string>}
 */
const NON_ATHLETIC_ACTIVITY_TYPES = new Set([
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
 * NCAA Division III ruleset configuration.
 *
 * NOTE: These are recommended/voluntary defaults. D3 schools should
 * configure institution-specific limits appropriate for their programs.
 *
 * @typedef {Object} D3Ruleset
 * @property {string} division
 * @property {Object} inSeason - Recommended in-season limits
 * @property {Object} outOfSeason - Recommended out-of-season limits
 * @property {boolean} limitsAreMandatory - False for D3 (voluntary guidance)
 * @property {boolean} deadPeriodRulesApply
 */

/** @type {D3Ruleset} */
const D3_RULESET = {
  division: 'D3',

  inSeason: {
    /**
     * D3 has no national daily limit — this is a recommended default.
     * Many conferences suggest 4-5 hrs/day.
     */
    maxHoursPerDay: 5,

    /**
     * No national weekly limit — recommended default of 20 hrs/week.
     * The NCAA D3 philosophy encourages ≤ 20 hrs/week in-season.
     */
    maxHoursPerWeek: 20,

    /** Recommended, not mandatory at national level */
    mandatoryDaysOffPerWeek: 1,
  },

  outOfSeason: {
    /** Recommended out-of-season limit */
    maxHoursPerWeek: 12,
    /** Recommended days off */
    mandatoryDaysOffPerWeek: 2,
  },

  athleticActivities: ATHLETIC_ACTIVITY_TYPES,
  nonAthleticActivities: NON_ATHLETIC_ACTIVITY_TYPES,

  /**
   * IMPORTANT: D3 limits are recommendations/voluntary, not NCAA bylaws.
   * Set this flag so the engine knows to treat violations as warnings only.
   */
  limitsAreMandatory: false,

  /** D3 has no formal national dead periods */
  deadPeriodRulesApply: false,

  /** D3 has no formal final exam restriction at national level */
  finalExamRestriction: false,

  /** Warn at 90% of recommended weekly limit */
  warningThresholdPercent: 0.9,

  /**
   * D3-specific note: Contact between coaches and athletes is generally
   * unrestricted. Recruiting rules differ from D1/D2.
   */
  deadPeriodContactProhibited: false,
};

/**
 * Determines if an event type is athletically related in D3 context.
 * Note: In D3 there is no national CARA framework, so this is used
 * for scheduling/tracking purposes only.
 *
 * @param {string} eventType - The event type string
 * @returns {boolean} True if athletically related
 */
function isCountableActivity(eventType) {
  if (!eventType) return false;
  return ATHLETIC_ACTIVITY_TYPES.has(eventType.toUpperCase());
}

/**
 * Returns recommended (not mandatory) limits based on season.
 *
 * @param {boolean} inSeason
 * @returns {{ maxHoursPerDay: number, maxHoursPerWeek: number, mandatoryDaysOffPerWeek: number }}
 */
function getApplicableLimits(inSeason) {
  return inSeason ? D3_RULESET.inSeason : D3_RULESET.outOfSeason;
}

module.exports = {
  D3_RULESET,
  isCountableActivity,
  getApplicableLimits,
  ATHLETIC_ACTIVITY_TYPES,
  NON_ATHLETIC_ACTIVITY_TYPES,
};
