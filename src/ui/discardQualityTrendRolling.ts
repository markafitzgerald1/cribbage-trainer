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
  readonly expectedPointsLoss: number;
  readonly isOptimal: boolean;
  readonly ordinal: number;
  readonly rollingMeanLoss: number;
  readonly timestamp: number;
}

export function buildContinuousDecisionPoints(
  records: readonly DiscardDecisionRecord[],
  batchSize: number,
  offset = 0,
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
      expectedPointsLoss: record.expectedPointsLoss,
      isOptimal: record.isOptimal,
      ordinal: offset + globalIndex + 1,
      rollingMeanLoss,
      timestamp: record.at,
    };
  });
}
