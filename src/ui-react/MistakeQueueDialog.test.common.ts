/* jscpd:ignore-start */
import { CribRole } from "../game/expectedCribPoints";
import type { StoredTally } from "../ui/discardTally";

const BASE_TIME = 1_700_000_000_000;
const ONE_DAY_MS = 86_400_000;

export const createSampleMistakeTally = (): StoredTally => ({
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
      wrong: 0,
    },
    {
      attempts: 2,
      consecutiveSuccesses: 2,
      handKey: "2C,3C,4C,5C,6C,7C|Dealer",
      lastAttemptAt: BASE_TIME,
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
  revision: 1,
  skipped: [],
  version: 4,
});

export const createAllMasteredTally = (): StoredTally => ({
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
      handKey: "5H,6H,7H,8H,9H,10H|Dealer",
      lastAttemptAt: BASE_TIME,
      wrong: 0,
    },
  ],
  records: [
    {
      at: BASE_TIME - 2 * ONE_DAY_MS,
      cribRole: CribRole.Dealer,
      discardKey: "5H,6H",
      expectedPointsLoss: 2.0,
      handKey: "5H,6H,7H,8H,9H,10H|Dealer",
      isOptimal: false,
      isPractice: false,
    },
  ],
  revision: 1,
  skipped: [],
  version: 4,
});

export const createEmptyMistakeTally = (): StoredTally => ({
  lifetime: {
    decisions: 1,
    expectedPointsLossTotal: 0,
    optimalDecisions: 1,
    skippedHands: 0,
  },
  practice: [],
  records: [
    {
      at: BASE_TIME,
      cribRole: CribRole.Dealer,
      discardKey: "5H,6H",
      expectedPointsLoss: 0,
      handKey: "5H,6H,7H,8H,9H,10H|Dealer",
      isOptimal: true,
      isPractice: false,
    },
  ],
  revision: 1,
  skipped: [],
  version: 4,
});

export default {
  createAllMasteredTally,
  createEmptyMistakeTally,
  createSampleMistakeTally,
};
/* jscpd:ignore-end */
