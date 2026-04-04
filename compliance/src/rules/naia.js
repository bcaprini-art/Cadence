/**
 * @fileoverview NAIA (National Association of Intercollegiate Athletics) Compliance Rules
 *
 * The NAIA is a separate governing body from the NCAA, serving ~250 small colleges.
 * NAIA rules are generally less restrictive than NCAA D1/D2 but more structured than D3.
 *
 * Key characteristics:
 *  - NAIA Article VI governs playing and practice seasons
 *  - NAIA does have defined playing seasons and weekly hour limits
 *  - More flexibility than NCAA in many areas
 *  - No formal "dead period" equivalent at the national level for most sports
 *  - Championship eligibility rules are simpler than NCAA
 *
 * Key differences from NCAA divisions:
 *  - NAIA has a defined "playing season" (typically 17-18 weeks per sport)
 *  - Hour limits exist but tend to be slightly more permissive
 *  - No equivalent to NCAA's complex dead period/evaluation period system
 *  - NAIA Champion of Character program adds unique requirements
 *
 * Default limits used here are based on NAIA Article VI and common practice.
 * Schools should verify against current NAIA rulebook for their sport.
 *
 * Reference: NAIA Official Handbook, Article VI — Playing and Practice Seasons
 */

'use strict';

/**
 * Athletically-related activity types for NAIA tracking.
 * @type {Set<string>}
 */
const COUNTABLE_ACTIVITY_TYPES = new Set([
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
 * Non-countable activity types for NAIA.
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
  'CHARACTER_PROGRAM', // NAIA Champion of Character activities are non-countable
]);

/**
 * NAIA ruleset configuration.
 *
 * @typedef {Object} NAIARuleset
 * @property {string} division
 * @property {Object} inSeason
 * @property {Object} outOfSeason
 * @property {Set<string>} countableActivities
 * @property {Set<string>} nonCountableActivities
 * @property {boolean} deadPeriodRulesApply
 * @property {number} warningThresholdPercent
 */

/** @type {NAIARuleset} */
const NAIA_RULESET = {
  division: 'NAIA',

  inSeason: {
    /**
     * NAIA does not have an explicit daily hour limit at national level.
     * This default (5 hrs) is a common institutional recommendation.
     */
    maxHoursPerDay: 5,

    /**
     * NAIA Article VI generally limits competitive seasons but does not
     * mandate a specific weekly hour cap equivalent to NCAA's 20-hour rule.
     * 20 hrs/week is a widely adopted institutional standard.
     */
    maxHoursPerWeek: 20,

    /** 1 day off per week recommended during season */
    mandatoryDaysOffPerWeek: 1,
  },

  outOfSeason: {
    /**
     * Out-of-season activities for NAIA are less regulated nationally.
     * 8 hrs/week is a sensible default matching NCAA norms.
     */
    maxHoursPerWeek: 8,
    mandatoryDaysOffPerWeek: 2,
  },

  countableActivities: COUNTABLE_ACTIVITY_TYPES,
  nonCountableActivities: NON_COUNTABLE_ACTIVITY_TYPES,

  /**
   * Limits are real but NAIA enforcement is generally institution-led.
   * Still treat in-season limits as mandatory for this engine.
   */
  limitsAreMandatory: true,

  /**
   * NAIA does not have formal "dead periods" like the NCAA.
   * There are recruiting quiet/contact periods, but they differ by sport
   * and are primarily recruiting rules, not practice restrictions.
   */
  deadPeriodRulesApply: false,

  /**
   * NAIA does encourage final exam sensitivity but has no formal bylaw.
   */
  finalExamRestriction: false,

  /** Warn at 90% of applicable weekly limit */
  warningThresholdPercent: 0.9,

  deadPeriodContactProhibited: false,
};

/**
 * Determines if an event type counts toward NAIA athletic hour totals.
 *
 * @param {string} eventType - The event type string
 * @returns {boolean} True if countable
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
  return inSeason ? NAIA_RULESET.inSeason : NAIA_RULESET.outOfSeason;
}

module.exports = {
  NAIA_RULESET,
  isCountableActivity,
  getApplicableLimits,
  COUNTABLE_ACTIVITY_TYPES,
  NON_COUNTABLE_ACTIVITY_TYPES,
};
