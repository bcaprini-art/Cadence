/**
 * @fileoverview @athletisync/compliance — Public API
 *
 * NCAA/NAIA compliance rules engine for the AthletiSync scheduling platform.
 * Pure business logic: no database calls, no HTTP, fully deterministic.
 *
 * Quick start:
 *
 *   const { ComplianceEngine, rulesets } = require('@athletisync/compliance');
 *
 *   const engine = new ComplianceEngine();
 *
 *   // Check if scheduling a new event keeps athlete compliant
 *   const result = engine.checkEvent(
 *     { type: 'PRACTICE', start: '2025-10-14T15:00', end: '2025-10-14T18:00', athleteId: 'a1' },
 *     existingCARALogs,
 *     rulesets.D1
 *   );
 *   // → { compliant: true, violations: [], warnings: ['Approaching weekly limit...'], hoursAfterEvent: 18 }
 *
 *   // Get weekly compliance status for all athletes on a team
 *   const flags = engine.flagAthletes('team-1', '2025-10-13', allLogs, rulesets.D1);
 *   // → [{ athleteId: 'a1', status: 'ok', detail: '18 / 20 hrs used.' }, ...]
 *
 *   // Generate reports
 *   const { generateWeeklyReport } = require('@athletisync/compliance');
 *   const report = generateWeeklyReport('team-1', '2025-10-13', allLogs, rulesets.D1);
 */

'use strict';

const { ComplianceEngine, rulesets } = require('./src/engine');
const { D1_RULESET, COUNTABLE_ACTIVITY_TYPES: D1_COUNTABLE } = require('./src/rules/d1');
const { D2_RULESET } = require('./src/rules/d2');
const { D3_RULESET } = require('./src/rules/d3');
const { NAIA_RULESET } = require('./src/rules/naia');
const {
  generateWeeklyReport,
  generateComplianceExport,
  getSummaryStats,
} = require('./src/reports');

module.exports = {
  // ── Main Engine ────────────────────────────────────────────────────────────
  /** @type {typeof ComplianceEngine} */
  ComplianceEngine,

  // ── Rulesets ───────────────────────────────────────────────────────────────
  /**
   * Map of all supported rulesets.
   * Usage: rulesets.D1, rulesets.D2, rulesets.D3, rulesets.NAIA
   */
  rulesets,

  // Individual ruleset exports for direct destructuring
  D1_RULESET,
  D2_RULESET,
  D3_RULESET,
  NAIA_RULESET,

  // ── Report Generators ──────────────────────────────────────────────────────
  /**
   * Generates a structured weekly compliance report for a team.
   * @see src/reports.js#generateWeeklyReport
   */
  generateWeeklyReport,

  /**
   * Generates an NCAA-style CSV-ready compliance export for a full season.
   * @see src/reports.js#generateComplianceExport
   */
  generateComplianceExport,

  /**
   * Returns aggregate compliance statistics across all provided CARA logs.
   * @see src/reports.js#getSummaryStats
   */
  getSummaryStats,
};
