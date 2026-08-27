import { MAX_RECORDS, type StoredTally } from "../ui/discardTally";
import { CribRole } from "../game/expectedCribPoints";

const TALLY_START = 1_700_000_000_000;

export const dialogTally = (decisionCount: number): StoredTally => ({
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
  revision: 1,
  skipped: [{ at: TALLY_START + 10_000 }],
  version: 1,
});

export const cappedDialogTally = (): StoredTally => ({
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
  revision: 1,
  skipped: [],
  version: 1,
});

export default { cappedDialogTally, dialogTally };
