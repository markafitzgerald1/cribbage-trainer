import type {
  DiscardDecisionRecord,
  DiscardTallySummary,
} from "../ui/discardTally";
import {
  NOISE_STANDARD_ERROR,
  noiseTally,
  settledSource,
} from "../ui/noiseVerdicts.test.common";
import { type UncertaintySource } from "../game/uncertaintyLoader";

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

const noisy = settledSource(NOISE_STANDARD_ERROR);

// The tally view's props for these records, all made today, judged against the given sidecars (#774).
export const noiseTallyProps = (
  records: readonly DiscardDecisionRecord[],
  crib: UncertaintySource = noisy,
  play: UncertaintySource = noisy,
) => {
  const optimal = records.filter((record) => record.isOptimal).length;
  return {
    cribUncertaintySource: crib,
    playUncertaintySource: play,
    summary: discardTallySummary({
      decisions: records.length,
      optimalDecisions: optimal,
      todayDecisions: records.length,
      todayOptimalDecisions: optimal,
    }),
    tally: noiseTally(records),
  };
};
