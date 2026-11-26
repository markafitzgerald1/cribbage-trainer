// #774's acceptance criteria require every surface quoting the threshold to say what it is and is not.
export const NOISE_THRESHOLD_QUALIFIER =
  "a conservative bound on the simulation's reported sampling error, not a calibrated interval";

const WITHIN_NOISE = `one recorded as within simulation noise, against an approximate threshold that is ${NOISE_THRESHOLD_QUALIFIER}, counts neither way`;

const recordedHistoryHelp = (withinNoise: string): string =>
  `The hand, discard and crib role are observed. Hand and starter outcomes are enumerated; crib and pegging expectations come from the app's simulation tables as they were when recorded. Recorded cost is the gap between the best modeled option and your first discard, and Avg recorded loss averages those gaps (lower is better). Best choice means a discard tied for the top modeled score then; ${withinNoise}. Earlier results, queue membership and mastery are kept when tables change and retries use current tables, so history can span table versions and is not solely a measure of your play. Tables that were not captured are shown as unknown.`;

// The all-time tally reads lifetime counters, which keep a decision that ages out of the retained records as not best.
export const TALLY_HISTORY_HELP = recordedHistoryHelp(
  `${WITHIN_NOISE} until it ages out of the retained decisions, after which the all-time figure counts it as not best`,
);

// The trend reads retained records alone, so a decision that ages out of them leaves every figure here.
export const TREND_HISTORY_HELP = recordedHistoryHelp(WITHIN_NOISE);
