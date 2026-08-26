import { CribRole } from "../game/expectedCribPoints";
import { type StoredTally } from "../ui/discardTally";

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
    decisions: 20_000,
    expectedPointsLossTotal: 4000,
    optimalDecisions: 10_000,
    skippedHands: 0,
  },
  records: Array.from({ length: 20_000 }, (_, index) => ({
    at: TALLY_START + index * 1000,
    cribRole: CribRole.Dealer,
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
