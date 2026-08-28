/* jscpd:ignore-start */
import { MAX_RECORDS, type StoredTally } from "../ui/discardTally";
import { CribRole } from "../game/expectedCribPoints";
import { createMockTally } from "../ui/mistakeQueue.test.common";
/* jscpd:ignore-end */

const TALLY_START = 1_700_000_000_000;
const ONE_DAY_MS = 86_400_000;

export const dialogTally = (decisionCount: number): StoredTally =>
  createMockTally({
    lifetime: {
      decisions: decisionCount,
      expectedPointsLossTotal: decisionCount * 0.2,
      optimalDecisions: Math.ceil(decisionCount / 2),
      skippedHands: 1,
    },
    records: Array.from({ length: decisionCount }, (_, index) => ({
      at: TALLY_START + index * 3_600_000,
      cribRole: index % 2 === 0 ? CribRole.Dealer : CribRole.Pone,
      discardKey: "5H,6H",
      expectedPointsLoss: 0.2,
      handKey: `dialog-${index}`,
      isOptimal: index % 2 === 0,
      isPractice: false,
    })),
    skipped: [{ at: TALLY_START + 10_000 }],
  });

export const cappedDialogTally = (): StoredTally =>
  createMockTally({
    lifetime: {
      decisions: MAX_RECORDS + 1,
      expectedPointsLossTotal: 4000,
      optimalDecisions: Math.floor(MAX_RECORDS / 2),
      skippedHands: 0,
    },
    records: Array.from({ length: 20 }, (_, index) => ({
      at: TALLY_START + index * 1000,
      cribRole: CribRole.Dealer,
      discardKey: "5H,6H",
      expectedPointsLoss: 0.2,
      handKey: `capped-${index}`,
      isOptimal: true,
      isPractice: false,
    })),
  });

export const emptyDialogTally = (): StoredTally => createMockTally();

export const skipOnlyDialogTally = (): StoredTally =>
  createMockTally({
    lifetime: {
      decisions: 1,
      expectedPointsLossTotal: 0.5,
      optimalDecisions: 0,
      skippedHands: 1,
    },
    records: [
      {
        at: TALLY_START,
        cribRole: CribRole.Dealer,
        discardKey: null,
        expectedPointsLoss: 0.5,
        handKey: "h1",
        isOptimal: false,
        isPractice: false,
      },
    ],
    skipped: [{ at: TALLY_START + ONE_DAY_MS * 5 }],
  });

export const multiLossDialogTally = (): StoredTally =>
  createMockTally({
    lifetime: {
      decisions: 5,
      expectedPointsLossTotal: 2.8,
      optimalDecisions: 1,
      skippedHands: 0,
    },
    records: [
      {
        at: TALLY_START,
        cribRole: CribRole.Dealer,
        discardKey: "5H,6H",
        expectedPointsLoss: 0,
        handKey: "h-opt",
        isOptimal: true,
        isPractice: false,
      },
      {
        at: TALLY_START + ONE_DAY_MS,
        cribRole: CribRole.Dealer,
        discardKey: "5H,6H",
        expectedPointsLoss: 0.15,
        handKey: "h-1",
        isOptimal: false,
        isPractice: false,
      },
      {
        at: TALLY_START + ONE_DAY_MS * 2,
        cribRole: CribRole.Dealer,
        discardKey: "5H,6H",
        expectedPointsLoss: 0.35,
        handKey: "h-2",
        isOptimal: false,
        isPractice: false,
      },
      {
        at: TALLY_START + ONE_DAY_MS * 3,
        cribRole: CribRole.Dealer,
        discardKey: "5H,6H",
        expectedPointsLoss: 0.8,
        handKey: "h-3",
        isOptimal: false,
        isPractice: false,
      },
      {
        at: TALLY_START + ONE_DAY_MS * 4,
        cribRole: CribRole.Dealer,
        discardKey: "5H,6H",
        expectedPointsLoss: 1.5,
        handKey: "h-4",
        isOptimal: false,
        isPractice: false,
      },
    ],
  });

export default {
  cappedDialogTally,
  dialogTally,
  emptyDialogTally,
  multiLossDialogTally,
  skipOnlyDialogTally,
};
