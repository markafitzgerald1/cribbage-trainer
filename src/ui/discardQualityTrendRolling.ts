const ROLLING_TWENTY = 20;
const ROLLING_FIFTY = 50;

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

export function countRollingSkips<
  TRecord extends { readonly at: number },
  TSkip extends { readonly at: number },
>(
  records: readonly TRecord[],
  batchSize: number,
  skipped: readonly TSkip[],
): number[] {
  const bucketCount = Math.ceil(records.length / batchSize);
  const counts = Array.from({ length: bucketCount }, () => 0);
  const sortedSkips = sortByTimestamp(skipped);
  let bucketIndex = 0;

  for (const skip of sortedSkips) {
    while (bucketIndex + 1 < bucketCount) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const nextBoundary = records[(bucketIndex + 1) * batchSize]!;
      if (skip.at < nextBoundary.at) {
        break;
      }
      bucketIndex += 1;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    counts.splice(bucketIndex, 1, counts.at(bucketIndex)! + 1);
  }

  return counts;
}
