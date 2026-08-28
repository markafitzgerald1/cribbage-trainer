/*
 * Shared rather than each caller writing its own copy: discardTally.ts and
 * discardDecisionRecord.ts both need this exact check ahead of a structurally
 * similar type guard, which jscpd flagged as a clone once it lived in both
 * files. Writing the check inline instead (as practiceLedger.ts's own type
 * guard does) was tried and traded that clone for an identical one against
 * practiceLedger.ts, since its inline null-check is the same three lines.
 * Importing one definition is the only version that collides with neither.
 */
export const isObject = (value: unknown): value is object =>
  typeof value === "object" && value !== null;
