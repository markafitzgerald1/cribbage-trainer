/* jscpd:ignore-start */
import { CribRole } from "../game/expectedCribPoints";
import type { MistakeQueueItem } from "./mistakeQueue";
import type { StoredTally } from "./discardTally";
import { parseHand } from "../game/Card";

export const NOW = 1_700_000_000_000;
export const ONE_DAY_MS = 86_400_000;

export const createMockTally = (
  overrides: Partial<StoredTally> = {},
): StoredTally => ({
  lifetime: {
    decisions: 0,
    expectedPointsLossTotal: 0,
    optimalDecisions: 0,
    skippedHands: 0,
  },
  practice: [],
  records: [],
  revision: 1,
  skipped: [],
  version: 4,
  ...overrides,
});

export const mockItemA: MistakeQueueItem = {
  attempts: 1,
  cards: parseHand("5H,6H,7H,8H,9H,10H"),
  consecutiveSuccesses: 0,
  cribRole: CribRole.Dealer,
  handKey: "5H,6H,7H,8H,9H,10H|Dealer",
  isMastered: false,
  lastAttemptAt: NOW - 2 * ONE_DAY_MS,
  lossIfWrong: 1.0,
  lossQuantile: "medium",
  originalDecisionAt: NOW - 2 * ONE_DAY_MS,
  pWrong: 1,
  previousDiscard: "5H,6H",
  priority: 0.8,
  wrong: 1,
};

export const mockItemB: MistakeQueueItem = {
  attempts: 1,
  cards: parseHand("2C,3C,4C,5C,6C,7C"),
  consecutiveSuccesses: 0,
  cribRole: CribRole.Dealer,
  handKey: "2C,3C,4C,5C,6C,7C|Dealer",
  isMastered: false,
  lastAttemptAt: NOW - ONE_DAY_MS,
  lossIfWrong: 2.0,
  lossQuantile: "high",
  originalDecisionAt: NOW - ONE_DAY_MS,
  pWrong: 1,
  previousDiscard: null,
  priority: 1.9,
  wrong: 1,
};

export const mockItemMastered: MistakeQueueItem = {
  attempts: 3,
  cards: parseHand("AH,2H,3H,4H,5H,6H"),
  consecutiveSuccesses: 2,
  cribRole: CribRole.Pone,
  handKey: "AH,2H,3H,4H,5H,6H|Pone",
  isMastered: true,
  lastAttemptAt: NOW,
  lossIfWrong: 3.0,
  lossQuantile: "high",
  originalDecisionAt: NOW - 5 * ONE_DAY_MS,
  pWrong: 0.33,
  previousDiscard: "AH,2H",
  priority: 1.0,
  wrong: 1,
};
/* jscpd:ignore-end */
