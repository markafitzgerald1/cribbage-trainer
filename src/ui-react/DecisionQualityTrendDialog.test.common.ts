/* jscpd:ignore-start */
import { MAX_RECORDS, type StoredTally } from "../ui/discardTally";
import { CribRole } from "../game/expectedCribPoints";
import { createMockTally } from "../ui/mistakeQueue.test.common";
/* jscpd:ignore-end */

const TALLY_START = 1_700_000_000_000;
const ONE_DAY_MS = 86_400_000;

/*
 * Real "cards|role" keys (parseHandKey rejects the "dialog-N" stubs), so a
 * tapped chart mistake resolves to a MistakeQueueItem. The zero-loss
 * non-optimal row is a chart marker the queue deliberately drops.
 */
const PRACTICE_READY_ROWS = [
  { handKey: "5H,6H,7H,8H,9H,10H|Dealer", loss: 1.4, role: CribRole.Dealer },
  { handKey: "AC,2C,3C,4C,5C,6C|Pone", loss: 0.5, role: CribRole.Pone },
  { handKey: "2D,3D,4D,5D,6D,7D|Dealer", loss: 0, role: CribRole.Dealer },
] as const;

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

export const practiceReadyDialogTally = (): StoredTally =>
  createMockTally({
    lifetime: {
      decisions: 3,
      expectedPointsLossTotal: 1.9,
      optimalDecisions: 1,
      skippedHands: 0,
    },
    records: PRACTICE_READY_ROWS.map((row, index) => ({
      at: TALLY_START + ONE_DAY_MS * index,
      cribRole: row.role,
      discardKey: "5H,6H",
      expectedPointsLoss: row.loss,
      handKey: row.handKey,
      isOptimal: false,
      isPractice: false,
    })),
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
  practiceReadyDialogTally,
  skipOnlyDialogTally,
};
