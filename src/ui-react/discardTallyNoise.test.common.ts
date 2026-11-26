import {
  type DiscardDecisionRecord,
  type DiscardTallySummary,
  type StoredTally,
  clearDiscardTally,
  discardTallyKey,
  readDiscardTally,
} from "../ui/discardTally";
import { CribRole } from "../game/expectedCribPoints";
import { createMockTally } from "../ui/mistakeQueue.test.common";

/*
 * Decisions as #894 records them, each carrying the admission its analysis
 * settled when it was made. The noise verdict is read from that admission
 * alone, so the hands need not be ones today's tables agree with.
 */
// A millisecond apart, so each is its own chart point even in a tally passed in unread, which carries no recencyAt.
const NOW = Date.now();

export const RECORDED_OPTIMAL: DiscardDecisionRecord = {
  at: NOW - 2,
  cribRole: CribRole.Dealer,
  discardKey: "8C,KC",
  expectedPointsLoss: 0,
  handKey: "4H,5D,KH,6H,8C,KC|Dealer",
  isOptimal: true,
  isPractice: false,
  recordedAdmission: { basis: "exact-v1", eligible: false },
  tableIdentity: null,
};
export const RECORDED_WITHIN_NOISE: DiscardDecisionRecord = {
  ...RECORDED_OPTIMAL,
  at: NOW - 1,
  discardKey: "KH,8C",
  expectedPointsLoss: 0.041,
  handKey: "5D,4H,KH,6H,8C,KC|Dealer",
  isOptimal: false,
  recordedAdmission: { basis: "sampling-noise-v1", eligible: false },
};
export const RECORDED_MISTAKE: DiscardDecisionRecord = {
  ...RECORDED_WITHIN_NOISE,
  at: NOW,
  discardKey: "5H,6H",
  expectedPointsLoss: 1.5,
  handKey: "AH,2H,3H,4H,5H,6H|Dealer",
  recordedAdmission: { basis: "sampling-noise-v1", eligible: true },
};

// The stored shape #894 writes, which is what carries a recorded admission.
export const recordedTally = (
  records: readonly DiscardDecisionRecord[],
): StoredTally => {
  const losses = records.map((record) => record.expectedPointsLoss);
  return createMockTally({
    lifetime: {
      decisions: records.length,
      expectedPointsLossTotal: losses.reduce((one, other) => one + other, 0),
      optimalDecisions: losses.filter((loss) => loss === 0).length,
      skippedHands: 0,
    },
    records,
    version: 8,
  });
};

// Stores these authentic decisions as this build would have, and returns the summary the tally reads from them.
export const seedRecordedTally = (
  records: readonly DiscardDecisionRecord[],
): DiscardTallySummary => {
  clearDiscardTally();
  localStorage.setItem(discardTallyKey, JSON.stringify(recordedTally(records)));
  return readDiscardTally(Date.now());
};
