/* jscpd:ignore-start */
import {
  createMockTally,
  createTestMistakeRecord,
} from "../ui/mistakeQueue.test.common";
import { CribRole } from "../game/expectedCribPoints";
import { DRILL_RELABELING_SHIPPED_AT } from "../ui/strayDrillRecords";
import type { StoredTally } from "../ui/discardTally";
/* jscpd:ignore-end */

const BASE_TIME = 1_700_000_000_000;
const ONE_DAY_MS = 86_400_000;

// All clubs, and the same six ranks relabeled into spades — a permutation moving every suit the hand uses, which is what a drill produces and the sweep requires.
export const DRILLED_HAND_KEY = "2C,3C,4C,5C,6C,7C|Dealer";
export const STRAY_HAND_KEY = "2S,3S,4S,5S,6S,7S|Dealer";

export const createSampleMistakeTally = (): StoredTally =>
  createMockTally({
    lifetime: {
      decisions: 5,
      expectedPointsLossTotal: 4.1,
      optimalDecisions: 2,
      skippedHands: 0,
    },
    practice: [
      {
        attempts: 1,
        consecutiveSuccesses: 1,
        handKey: "AH,2H,3H,4H,5H,6H|Pone",
        lastAttemptAt: BASE_TIME - ONE_DAY_MS,
        totalWrongLoss: 0,
        wrong: 0,
      },
      {
        attempts: 2,
        consecutiveSuccesses: 2,
        handKey: "2C,3C,4C,5C,6C,7C|Dealer",
        lastAttemptAt: BASE_TIME,
        totalWrongLoss: 0,
        wrong: 0,
      },
    ],
    records: [
      {
        at: BASE_TIME - 3 * ONE_DAY_MS,
        cribRole: CribRole.Dealer,
        discardKey: "5H,6H",
        expectedPointsLoss: 2.5,
        handKey: "5H,6H,7H,8H,9H,10H|Dealer",
        isOptimal: false,
        isPractice: false,
      },
      {
        at: BASE_TIME - 2 * ONE_DAY_MS,
        cribRole: CribRole.Pone,
        discardKey: "AH,2H",
        expectedPointsLoss: 1.2,
        handKey: "AH,2H,3H,4H,5H,6H|Pone",
        isOptimal: false,
        isPractice: false,
      },
      {
        at: BASE_TIME - ONE_DAY_MS,
        cribRole: CribRole.Dealer,
        discardKey: null,
        expectedPointsLoss: 0.4,
        handKey: "2C,3C,4C,5C,6C,7C|Dealer",
        isOptimal: false,
        isPractice: false,
      },
      {
        at: BASE_TIME - 4 * ONE_DAY_MS,
        cribRole: CribRole.Dealer,
        discardKey: "KH,KS",
        expectedPointsLoss: 0,
        handKey: "9H,10H,JH,QH,KH,KS|Dealer",
        isOptimal: true,
        isPractice: false,
      },
    ],
  });

export const createAllMasteredTally = (): StoredTally => {
  const handKey = "5H,6H,7H,8H,9H,10H|Dealer";
  return createMockTally({
    lifetime: {
      decisions: 2,
      expectedPointsLossTotal: 2.0,
      optimalDecisions: 1,
      skippedHands: 0,
    },
    practice: [
      {
        attempts: 2,
        consecutiveSuccesses: 2,
        handKey,
        lastAttemptAt: BASE_TIME,
        totalWrongLoss: 0,
        wrong: 0,
      },
    ],
    records: [
      createTestMistakeRecord({
        at: BASE_TIME - 2 * ONE_DAY_MS,
        cribRole: CribRole.Dealer,
        expectedPointsLoss: 2.0,
        handKey,
      }),
    ],
  });
};

const createOptimalOnlyTally = (
  lifetime: StoredTally["lifetime"],
): StoredTally =>
  createMockTally({
    lifetime,
    records: [
      createTestMistakeRecord({
        at: BASE_TIME,
        expectedPointsLoss: 0,
        isOptimal: true,
      }),
    ],
  });

export const createEmptyMistakeTally = (): StoredTally =>
  createOptimalOnlyTally({
    decisions: 1,
    expectedPointsLossTotal: 0,
    optimalDecisions: 1,
    skippedHands: 0,
  });

export const createAgedOutTally = (): StoredTally =>
  createOptimalOnlyTally({
    decisions: 10,
    expectedPointsLossTotal: 2.0,
    optimalDecisions: 8,
    skippedHands: 0,
  });

export const createTwoLossTally = (): StoredTally =>
  createMockTally({
    lifetime: {
      decisions: 2,
      expectedPointsLossTotal: 3.5,
      optimalDecisions: 0,
      skippedHands: 0,
    },
    records: [
      createTestMistakeRecord({
        at: BASE_TIME,
        cribRole: CribRole.Dealer,
        discardKey: "5H,6H",
        expectedPointsLoss: 2.0,
        handKey: "5H,6H,7H,8H,9H,10H|Dealer",
      }),
      createTestMistakeRecord({
        at: BASE_TIME + 1000,
        cribRole: CribRole.Pone,
        discardKey: "AH,2H",
        expectedPointsLoss: 1.5,
        handKey: "AH,2H,3H,4H,5H,6H|Pone",
      }),
    ],
  });

/*
 * A tally as an affected build left it: the drilled mistake, its ledger
 * entry, and a row #808 appended under a relabeling of that hand. Every
 * timestamp is derived from the sweep's own cutoff rather than restated, so
 * moving the cutoff cannot leave this fixture asserting against the wrong
 * era, and the ledger entry is dated after the stray because that ordering
 * is one of the conditions the sweep requires.
 */
export const createStraySweepTally = (): StoredTally =>
  createMockTally({
    practice: [
      {
        attempts: 1,
        consecutiveSuccesses: 0,
        handKey: DRILLED_HAND_KEY,
        lastAttemptAt: DRILL_RELABELING_SHIPPED_AT + 2000,
        totalWrongLoss: 2,
        wrong: 1,
      },
    ],
    records: [
      createTestMistakeRecord({
        at: DRILL_RELABELING_SHIPPED_AT + 1000,
        cribRole: CribRole.Dealer,
        discardKey: "2C,3C",
        expectedPointsLoss: 2,
        handKey: DRILLED_HAND_KEY,
      }),
      {
        ...createTestMistakeRecord({
          at: DRILL_RELABELING_SHIPPED_AT + 1500,
          cribRole: CribRole.Dealer,
          discardKey: "2S,3S",
          expectedPointsLoss: 2,
          handKey: STRAY_HAND_KEY,
        }),
        isPractice: true,
      },
    ],
  });

export default {
  createAgedOutTally,
  createAllMasteredTally,
  createEmptyMistakeTally,
  createSampleMistakeTally,
  createStraySweepTally,
  createTwoLossTally,
};
