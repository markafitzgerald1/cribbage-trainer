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
