import { type PracticeRecord, SUCCESSES_FOR_MASTERY } from "./practiceLedger";
import type { DiscardDecisionRecord } from "./discardTally";

export const ROLLING_TWENTY = 20;
export const ROLLING_FIFTY = 50;
export const MAX_RECENT_DECISIONS = 100;

export const getRollingBatchSize = (
  granularity: "rolling20" | "rolling50",
): number => (granularity === "rolling20" ? ROLLING_TWENTY : ROLLING_FIFTY);

export function sortByTimestamp<T extends { readonly at: number }>(
  entries: readonly T[],
): T[] {
  return [...entries].sort((one, other) => one.at - other.at);
}

export function chunkBounds<T>(entries: readonly T[]): readonly [T, T] {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const first = entries[0]!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const last = entries[entries.length - 1]!;

  return [first, last];
}

export interface IndexedChunk<T> {
  readonly chunk: readonly T[];
  readonly endIndex: number;
  readonly first: T;
  readonly last: T;
  readonly size: number;
  readonly startIndex: number;
}

export function sliceIndexedChunks<T>(
  entries: readonly T[],
  chunkSizes: readonly number[],
): readonly IndexedChunk<T>[] {
  let offset = 0;
  return chunkSizes.map((size) => {
    const chunk = entries.slice(offset, offset + size);
    const [first, last] = chunkBounds(chunk);
    const startIndex = offset + 1;
    const endIndex = offset + size;
    offset += size;

    return {
      chunk,
      endIndex,
      first,
      last,
      size,
      startIndex,
    };
  });
}

export function getRollingChunkSizes(
  totalCount: number,
  batchSize: number,
): number[] {
  if (totalCount === 0) {
    return [];
  }
  const rem = totalCount % batchSize;
  const fullCount = Math.floor(totalCount / batchSize);
  if (rem === 0) {
    return Array.from({ length: fullCount }, () => batchSize);
  }
  return [rem, ...Array.from({ length: fullCount }, () => batchSize)];
}

export function countRollingSkips<
  TRecord extends { readonly at: number },
  TSkip extends { readonly at: number },
>(
  records: readonly TRecord[],
  batchSize: number,
  skipped: readonly TSkip[],
): number[] {
  const chunkSizes = getRollingChunkSizes(records.length, batchSize);
  const bucketCount = chunkSizes.length;
  if (bucketCount === 0) {
    return [];
  }
  const counts = Array.from({ length: bucketCount }, () => 0);
  const sortedSkips = sortByTimestamp(skipped);
  let bucketIndex = 0;
  let recordOffset = 0;

  for (const skip of sortedSkips) {
    while (bucketIndex + 1 < bucketCount) {
      const currentChunkSize = chunkSizes.at(bucketIndex) as number;
      const nextBoundaryIndex = recordOffset + currentChunkSize;
      const nextBoundary = records.at(nextBoundaryIndex) as TRecord;
      if (skip.at < nextBoundary.at) {
        break;
      }
      recordOffset += currentChunkSize;
      bucketIndex += 1;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    counts.splice(bucketIndex, 1, counts.at(bucketIndex)! + 1);
  }

  return counts;
}

export interface DiscardDecisionPoint {
  /*
   * The hand and the discard behind this decision, carried so the trend
   * chart can show what the mistake actually was. `handKey` is the
   * "cards|role" key; `discardKey` is the two discarded cards, null when the
   * record predates discard capture.
   */
  readonly discardKey: string | null;
  readonly expectedPointsLoss: number;
  readonly handKey: string;
  /*
   * This decision was sub-optimal when made, but its hand has since been
   * mastered in practice (two consecutive optimal choices). The chart
   * paints those markers apart from still-open mistakes so improvement is
   * visible on the same axis as the errors. Always false for an optimal
   * decision — there is nothing to have mastered.
   */
  readonly isMastered: boolean;
  readonly isOptimal: boolean;
  readonly isRetained: boolean;
  readonly ordinal: number;
  /*
   * The record's monotonic `recencyAt` (strictly increasing across the
   * stored history via normalizeStoredRecords), used as the decision's
   * stable unique identity: `ordinal` is renumbered by the role filter and
   * `at` is wall-clock time that a rolled-back clock can repeat.
   */
  readonly recencyAt: number;
  readonly rollingMeanLoss: number;
  readonly timestamp: number;
}

const NO_MASTERED_HAND_KEYS: ReadonlySet<string> = new Set();

/*
 * The hand keys the practice ledger reports as mastered — two consecutive
 * optimal choices since the last error. Passed to
 * `buildContinuousDecisionPoints` so a mistake whose hand has since been
 * mastered can be painted apart from the still-open ones.
 */
export const masteredHandKeysOf = (
  practice: readonly PracticeRecord[],
): ReadonlySet<string> =>
  new Set(
    practice
      .filter((record) => record.consecutiveSuccesses >= SUCCESSES_FOR_MASTERY)
      .map((record) => record.handKey),
  );

export interface ContinuousDecisionPointOptions {
  readonly isRetained?: boolean;
  // Hand keys the practice ledger reports as mastered; markers for these are painted apart from open mistakes.
  readonly masteredHandKeys?: ReadonlySet<string>;
}

export function buildContinuousDecisionPoints(
  records: readonly DiscardDecisionRecord[],
  batchSize: number,
  {
    isRetained = false,
    masteredHandKeys = NO_MASTERED_HAND_KEYS,
  }: ContinuousDecisionPointOptions = {},
): readonly DiscardDecisionPoint[] {
  if (records.length === 0) {
    return [];
  }
  const startIndex = Math.max(0, records.length - MAX_RECENT_DECISIONS);
  const recentRecords = records.slice(startIndex);

  return recentRecords.map((record, index) => {
    const globalIndex = startIndex + index;
    const windowStart = Math.max(0, globalIndex - batchSize + 1);
    const window = records.slice(windowStart, globalIndex + 1);
    const totalLoss = window.reduce(
      (sum, item) => sum + item.expectedPointsLoss,
      0,
    );
    const rollingMeanLoss = totalLoss / window.length;

    return {
      discardKey: record.discardKey,
      expectedPointsLoss: record.expectedPointsLoss,
      handKey: record.handKey,
      isMastered: !record.isOptimal && masteredHandKeys.has(record.handKey),
      isOptimal: record.isOptimal,
      isRetained,
      ordinal: globalIndex + 1,
      recencyAt: record.recencyAt ?? record.at,
      rollingMeanLoss,
      timestamp: record.at,
    };
  });
}
