import {
  type DiscardDecisionRecord,
  type SkippedHand,
  type StoredTally,
} from "./discardTally";
import {
  type DiscardQualityTrend,
  type DiscardQualityTrendOptions,
  computeDiscardQualityTrend,
} from "./discardQualityTrend";
import { CribRole } from "../game/expectedCribPoints";
import { expect } from "@jest/globals";

export const TEST_AT = 1_700_000_000_000;
export const ONE_HOUR_MS = 3_600_000;
export const ONE_DAY_MS = 86_400_000;

export const AUG_10_2026 = new Date(2026, 7, 10, 12, 0, 0).getTime();
export const AUG_31_2026 = new Date(2026, 7, 31, 12, 0, 0).getTime();
export const SEP_2_2026 = new Date(2026, 8, 2, 12, 0, 0).getTime();
export const AUG_16_2026_SUNDAY = new Date(2026, 7, 16, 14, 0, 0).getTime();
export const DEC_31_2025 = new Date(2025, 11, 31, 12, 0, 0).getTime();

export const EMPTY_TREND: DiscardQualityTrend = {
  buckets: [],
  earliestTimestamp: null,
  isAtRecordCap: false,
  latestTimestamp: null,
  totalAuthenticDecisions: 0,
  totalSkippedHands: 0,
};

export const testDecisionOf = (
  overrides: Partial<DiscardDecisionRecord> = {},
): DiscardDecisionRecord => ({
  at: TEST_AT,
  cribRole: CribRole.Dealer,
  expectedPointsLoss: 0.15,
  handKey: "AH,2H,3H,4H,5H,6H",
  isOptimal: false,
  isPractice: false,
  ...overrides,
});

export const dealerDecision = (
  loss: number,
  at = TEST_AT,
  handKey = "dealer",
): DiscardDecisionRecord =>
  testDecisionOf({
    at,
    cribRole: CribRole.Dealer,
    expectedPointsLoss: loss,
    handKey,
  });

export const poneDecision = (
  loss: number,
  at = TEST_AT,
  handKey = "pone",
): DiscardDecisionRecord =>
  testDecisionOf({
    at,
    cribRole: CribRole.Pone,
    expectedPointsLoss: loss,
    handKey,
  });

interface SequentialDecisionOptions {
  readonly interval?: number;
  readonly startAt?: number;
}

export const sequentialDecisions = (
  count: number,
  handKeyPrefix: string,
  { interval = ONE_HOUR_MS, startAt = TEST_AT }: SequentialDecisionOptions = {},
): DiscardDecisionRecord[] =>
  Array.from({ length: count }, (_, index) =>
    testDecisionOf({
      at: startAt + index * interval,
      handKey: `${handKeyPrefix}-${index}`,
    }),
  );

export const withTruncatedDecisionHistory = (
  tally: StoredTally,
): StoredTally => ({
  ...tally,
  lifetime: { ...tally.lifetime, decisions: tally.records.length + 1 },
});

export const withTruncatedSkipHistory = (tally: StoredTally): StoredTally => ({
  ...tally,
  lifetime: { ...tally.lifetime, skippedHands: tally.skipped.length + 1 },
});

export const storedTallyOf = (
  records: readonly DiscardDecisionRecord[],
  skipped: readonly SkippedHand[] = [],
): StoredTally => ({
  lifetime: {
    decisions: records.length,
    expectedPointsLossTotal: records.reduce(
      (sum, record) => sum + record.expectedPointsLoss,
      0,
    ),
    optimalDecisions: records.filter((record) => record.isOptimal).length,
    skippedHands: skipped.length,
  },
  records: [...records],
  revision: 1,
  skipped: [...skipped],
  version: 1,
});

export const runTrend = (
  records: readonly DiscardDecisionRecord[],
  options: DiscardQualityTrendOptions,
  skipped: readonly SkippedHand[] = [],
): DiscardQualityTrend =>
  computeDiscardQualityTrend(storedTallyOf(records, skipped), options);

export const rollingTrendOf = (tally: StoredTally): DiscardQualityTrend =>
  computeDiscardQualityTrend(tally, {
    granularity: "rolling20",
    now: TEST_AT,
  });

export const assertSingleBucketLoss = (
  trend: DiscardQualityTrend,
  expectedLoss: number | null,
  expectedDecisions = 1,
) => {
  const [firstBucket] = trend.buckets;

  expect(trend.totalAuthenticDecisions).toBe(expectedDecisions);
  expect(trend.buckets).toHaveLength(1);
  expect(firstBucket?.meanExpectedPointsLoss).toBe(expectedLoss);
};

export const expectBucketCount = (
  trend: DiscardQualityTrend,
  expectedCount: number,
): void => {
  expect(trend.buckets).toHaveLength(expectedCount);
};
