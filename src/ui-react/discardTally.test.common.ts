import type { DiscardTallySummary } from "../ui/discardTally";

/*
 * One builder for both the stories and the view's own tests. Each spelled the
 * whole shape out before, which jscpd counted as a clone and which meant every
 * new field had to be added in two places.
 */
export const discardTallySummary = (
  overrides: Partial<DiscardTallySummary> = {},
): DiscardTallySummary => ({
  decisions: 24,
  meanExpectedPointsLoss: 0.7361,
  optimalDecisions: 9,
  skippedHands: 0,
  todayDecisions: 0,
  todayMeanExpectedPointsLoss: null,
  todayOptimalDecisions: 0,
  todaySkippedHands: 0,
  ...overrides,
});
