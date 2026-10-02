import type { DiscardDecisionRecord, StoredTally } from "./discardTally";
import {
  deferredUncertainty,
  uniformUncertainty,
} from "../game/uncertaintySidecar.test.common";
import { CribRole } from "../game/expectedCribPoints";
import { type UncertaintySource } from "../game/uncertaintyLoader";
import { createMockTally } from "./mistakeQueue.test.common";

/*
 * At this standard error on every published record, the threshold for these
 * hands is about 0.40 points: the KH,KC discard's 0.09 loss falls inside it
 * and the 6H,8C discard's 0.76 does not. All three records are the one hand
 * of #870's caption tests, dealt in three orders so each is its own hand key
 * and its own queue item.
 */
export const NOISE_STANDARD_ERROR = 0.1;

const dealerRecord = (
  dealOrder: string,
  discardKey: string,
  expectedPointsLoss: number,
): DiscardDecisionRecord => ({
  at: Date.now(),
  cribRole: CribRole.Dealer,
  discardKey,
  expectedPointsLoss,
  handKey: `${dealOrder}|${CribRole.Dealer}`,
  isOptimal: expectedPointsLoss === 0,
  isPractice: false,
});

export const OPTIMAL_RECORD = dealerRecord("4H,5D,KH,6H,8C,KC", "8C,KC", 0);
export const WITHIN_NOISE_RECORD = dealerRecord(
  "5D,4H,KH,6H,8C,KC",
  "KH,KC",
  0.085633,
);
export const MISTAKE_RECORD = dealerRecord(
  "KC,8C,6H,5D,4H,KH",
  "6H,8C",
  0.762959,
);

export const settledSource = (standardError: number): UncertaintySource =>
  deferredUncertainty(uniformUncertainty(standardError));

// No surface under test reads the lifetime loss total, so it is left at zero.
export const noiseTally = (
  records: readonly DiscardDecisionRecord[],
): StoredTally =>
  createMockTally({
    lifetime: {
      decisions: records.length,
      expectedPointsLossTotal: 0,
      optimalDecisions: records.filter((record) => record.isOptimal).length,
      skippedHands: 0,
    },
    records,
  });
