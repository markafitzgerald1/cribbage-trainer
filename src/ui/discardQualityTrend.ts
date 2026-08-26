import {
  type DiscardDecisionRecord,
  MAX_RECORDS,
  type SkippedHand,
  type StoredTally,
  isSameLocalDay,
  readTallyForDisplay,
} from "./discardTally";
import {
  chunkBounds,
  getRollingBatchSize,
  sortByTimestamp,
} from "./discardQualityTrendRolling";
import { CribRole } from "../game/expectedCribPoints";
export type TrendGranularity =
  "rolling20" | "rolling50" | "day" | "week" | "month";
export type DiscardTrendGranularity = TrendGranularity;
export type CribRoleFilter = "all" | "dealer" | "pone";
export interface LossSeverityCounts {
  readonly optimal: number;
  readonly upToQuarter: number;
  readonly quarterToHalf: number;
  readonly halfToOne: number;
  readonly overOne: number;
}
export interface DiscardPeriodBucket {
  readonly key: string;
  readonly label: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly decisions: number;
  readonly meanExpectedPointsLoss: number | null;
  readonly optimalDecisions: number;
  readonly skippedHands: number;
  readonly severity: LossSeverityCounts;
}
export interface DiscardQualityTrend {
  readonly buckets: readonly DiscardPeriodBucket[];
  readonly earliestTimestamp: number | null;
  readonly isAtRecordCap: boolean;
  readonly latestTimestamp: number | null;
  readonly totalAuthenticDecisions: number;
  readonly totalSkippedHands: number;
}
export interface DiscardQualityTrendOptions {
  readonly granularity: TrendGranularity;
  readonly roleFilter?: CribRoleFilter;
  readonly now?: number;
}

export const QUARTER_POINT = 0.25;
export const HALF_POINT = 0.5;
export const ONE_POINT = 1.0;
const DAYS_IN_WEEK = 7;
const PAD_THRESHOLD = 10;
const END_OF_DAY_HOUR = 23;
const END_OF_DAY_MINUTE = 59;
const END_OF_DAY_SECOND = 59;
const END_OF_DAY_MS = 999;

export const emptySeverity: LossSeverityCounts = {
  halfToOne: 0,
  optimal: 0,
  overOne: 0,
  quarterToHalf: 0,
  upToQuarter: 0,
};

const countSeverity = (
  records: readonly DiscardDecisionRecord[],
): LossSeverityCounts => {
  let optimal = 0;
  let upToQuarter = 0;
  let quarterToHalf = 0;
  let halfToOne = 0;
  let overOne = 0;

  for (const record of records) {
    const loss = record.expectedPointsLoss;
    if (loss <= 0) {
      optimal += 1;
    } else if (loss <= QUARTER_POINT) {
      upToQuarter += 1;
    } else if (loss <= HALF_POINT) {
      quarterToHalf += 1;
    } else if (loss <= ONE_POINT) {
      halfToOne += 1;
    } else {
      overOne += 1;
    }
  }

  return { halfToOne, optimal, overOne, quarterToHalf, upToQuarter };
};

const meanLossOf = (
  records: readonly DiscardDecisionRecord[],
): number | null => {
  if (records.length === 0) {
    return null;
  }
  const total = records.reduce(
    (sum, record) => sum + record.expectedPointsLoss,
    0,
  );
  return total / records.length;
};

const padTwo = (value: number): string =>
  value < PAD_THRESHOLD ? `0${value}` : `${value}`;

const toMonthKey = (date: Date): string =>
  `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}`;

const toLocalDayKey = (date: Date): string =>
  `${toMonthKey(date)}-${padTwo(date.getDate())}`;

const getYesterdayDate = (now: number): Date => {
  const nowDate = new Date(now);
  return new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate() - 1,
  );
};

const toLocalDayLabel = (date: Date, now: number): string => {
  if (isSameLocalDay(date.getTime(), now)) {
    return "Today";
  }
  const yesterday = getYesterdayDate(now);
  if (isSameLocalDay(date.getTime(), yesterday.getTime())) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const toStartOfDayDate = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getStartOfWeek = (date: Date): Date => {
  const result = toStartOfDayDate(date);
  const day = result.getDay();
  const diff = day === 0 ? -(DAYS_IN_WEEK - 1) : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
};

const toEndOfDayTime = (year: number, month: number, date: number): number =>
  new Date(
    year,
    month,
    date,
    END_OF_DAY_HOUR,
    END_OF_DAY_MINUTE,
    END_OF_DAY_SECOND,
    END_OF_DAY_MS,
  ).getTime();

const getEndOfWeek = (startDate: Date): Date => {
  const result = new Date(startDate.getTime());
  result.setDate(result.getDate() + (DAYS_IN_WEEK - 1));
  return new Date(
    toEndOfDayTime(result.getFullYear(), result.getMonth(), result.getDate()),
  );
};

const toWeekLabel = (startDate: Date, endDate: Date): string => {
  const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
  const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });
  const year = endDate.getFullYear();
  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()}–${endDate.getDate()}, ${year}`;
  }
  return `${startMonth} ${startDate.getDate()} – ${endMonth} ${endDate.getDate()}, ${year}`;
};

const toMonthLabel = (date: Date): string =>
  date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

interface BucketDescriptor {
  readonly key: string;
  readonly label: string;
  readonly startTime: number;
  readonly endTime: number;
}

interface BucketDescriptorOptions {
  readonly endTime: number;
  readonly key: string;
  readonly label: string;
  readonly start: Date;
}

const buildBucketDescriptor = ({
  endTime,
  key,
  label,
  start,
}: BucketDescriptorOptions): BucketDescriptor => ({
  endTime,
  key,
  label,
  startTime: start.getTime(),
});

const describeDayBucket = (
  timestamp: number,
  now: number,
): BucketDescriptor => {
  const date = new Date(timestamp);
  const start = toStartOfDayDate(date);
  const end = toEndOfDayTime(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  return buildBucketDescriptor({
    endTime: end,
    key: toLocalDayKey(date),
    label: toLocalDayLabel(date, now),
    start,
  });
};

const describeWeekBucket = (timestamp: number): BucketDescriptor => {
  const start = getStartOfWeek(new Date(timestamp));
  const end = getEndOfWeek(start);
  return buildBucketDescriptor({
    endTime: end.getTime(),
    key: toLocalDayKey(start),
    label: toWeekLabel(start, end),
    start,
  });
};

const describeMonthBucket = (timestamp: number): BucketDescriptor => {
  const date = new Date(timestamp);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  return buildBucketDescriptor({
    endTime: toEndOfDayTime(date.getFullYear(), date.getMonth() + 1, 0),
    key: toMonthKey(date),
    label: toMonthLabel(date),
    start,
  });
};

const describeCalendarBucket = (
  granularity: "day" | "week" | "month",
  timestamp: number,
  now: number,
): BucketDescriptor => {
  switch (granularity) {
    case "day":
      return describeDayBucket(timestamp, now);
    case "week":
      return describeWeekBucket(timestamp);
    case "month":
    default:
      return describeMonthBucket(timestamp);
  }
};

interface MutableCalendarBucket {
  readonly descriptor: BucketDescriptor;
  readonly records: DiscardDecisionRecord[];
  skippedCount: number;
}

interface BaseBucketsArgs {
  readonly records: readonly DiscardDecisionRecord[];
  readonly roleFilter: CribRoleFilter;
  readonly skipped: readonly SkippedHand[];
}

interface CalendarBucketsArgs extends BaseBucketsArgs {
  readonly granularity: "day" | "week" | "month";
  readonly now: number;
}

const getOrCreateBucket = (
  buckets: Map<string, MutableCalendarBucket>,
  desc: BucketDescriptor,
): MutableCalendarBucket => {
  let bucket = buckets.get(desc.key);
  if (!bucket) {
    bucket = { descriptor: desc, records: [], skippedCount: 0 };
    buckets.set(desc.key, bucket);
  }
  return bucket;
};

const buildCalendarBuckets = ({
  granularity,
  now,
  records,
  roleFilter,
  skipped,
}: CalendarBucketsArgs): DiscardPeriodBucket[] => {
  const bucketsMap = new Map<string, MutableCalendarBucket>();

  for (const record of records) {
    const desc = describeCalendarBucket(granularity, record.at, now);
    getOrCreateBucket(bucketsMap, desc).records.push(record);
  }

  // Skips have no crib role, so include them only on unsegmented "all" views.
  if (roleFilter === "all") {
    for (const skip of skipped) {
      const desc = describeCalendarBucket(granularity, skip.at, now);
      getOrCreateBucket(bucketsMap, desc).skippedCount += 1;
    }
  }

  const sorted = Array.from(bucketsMap.values()).sort(
    (one, other) => one.descriptor.startTime - other.descriptor.startTime,
  );

  return sorted.map(({ descriptor, records: bucketRecords, skippedCount }) => ({
    decisions: bucketRecords.length,
    endTime: descriptor.endTime,
    key: descriptor.key,
    label: descriptor.label,
    meanExpectedPointsLoss: meanLossOf(bucketRecords),
    optimalDecisions: bucketRecords.filter((record) => record.isOptimal).length,
    severity: countSeverity(bucketRecords),
    skippedHands: skippedCount,
    startTime: descriptor.startTime,
  }));
};

interface RollingBucketsArgs extends BaseBucketsArgs {
  readonly granularity: "rolling20" | "rolling50";
  readonly hasTruncatedDecisionHistory: boolean;
}

const countRollingSkips = (
  records: readonly DiscardDecisionRecord[],
  batchSize: number,
  skipped: readonly SkippedHand[],
): number[] => {
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
};

const buildSkipOnlyRollingBuckets = (
  granularity: "rolling20" | "rolling50",
  skipped: readonly SkippedHand[],
): DiscardPeriodBucket[] => {
  const batchSize = getRollingBatchSize(granularity);
  const sortedSkips = sortByTimestamp(skipped);

  return Array.from(
    { length: Math.ceil(sortedSkips.length / batchSize) },
    (_, batchIndex) => {
      const startIndex = batchIndex * batchSize;
      const chunk = sortedSkips.slice(startIndex, startIndex + batchSize);
      const [first, last] = chunkBounds(chunk);
      const startSkip = startIndex + 1;
      const endSkip = startIndex + chunk.length;

      return {
        decisions: 0,
        endTime: last.at,
        key: `skipped-${startSkip}-${endSkip}`,
        label: `Skipped hands ${startSkip}–${endSkip}`,
        meanExpectedPointsLoss: null,
        optimalDecisions: 0,
        severity: emptySeverity,
        skippedHands: chunk.length,
        startTime: first.at,
      };
    },
  );
};

const buildRollingBuckets = ({
  granularity,
  hasTruncatedDecisionHistory,
  records,
  roleFilter,
  skipped,
}: RollingBucketsArgs): DiscardPeriodBucket[] => {
  if (records.length === 0) {
    return roleFilter === "all"
      ? buildSkipOnlyRollingBuckets(granularity, skipped)
      : [];
  }
  const batchSize = getRollingBatchSize(granularity);
  const buckets: DiscardPeriodBucket[] = [];
  const skippedCounts =
    roleFilter === "all" ? countRollingSkips(records, batchSize, skipped) : [];

  for (let index = 0; index < records.length; index += batchSize) {
    const chunk = records.slice(index, index + batchSize);
    const [first, last] = chunkBounds(chunk);
    const startDecision = index + 1;
    const endDecision = index + chunk.length;
    const startTime = first.at;
    const endTime = last.at;
    const batchIndex = index / batchSize;
    const skippedHands = skippedCounts.at(batchIndex) ?? 0;
    const labelPrefix = hasTruncatedDecisionHistory
      ? "Retained decisions"
      : "Decisions";

    buckets.push({
      decisions: chunk.length,
      endTime,
      key: `${startDecision}-${endDecision}`,
      label: `${labelPrefix} ${startDecision}–${endDecision}`,
      meanExpectedPointsLoss: meanLossOf(chunk),
      optimalDecisions: chunk.filter((record) => record.isOptimal).length,
      severity: countSeverity(chunk),
      skippedHands,
      startTime,
    });
  }

  return buckets;
};

const matchesRole = (
  record: DiscardDecisionRecord,
  roleFilter: CribRoleFilter,
): boolean =>
  roleFilter === "all" ||
  (roleFilter === "dealer" && record.cribRole === CribRole.Dealer) ||
  (roleFilter === "pone" && record.cribRole === CribRole.Pone);

const getRetainedSkips = (
  tally: StoredTally,
  hasTruncatedDecisionHistory: boolean,
): readonly SkippedHand[] => {
  if (!hasTruncatedDecisionHistory) {
    return tally.skipped;
  }
  const [oldestRecord] = tally.records;
  return oldestRecord
    ? tally.skipped.filter((skip) => skip.at >= oldestRecord.at)
    : [];
};

export const computeDiscardQualityTrend = (
  tally: StoredTally,
  options: DiscardQualityTrendOptions,
): DiscardQualityTrend => {
  const { granularity, roleFilter = "all", now = Date.now() } = options;
  const authenticRecords = tally.records.filter(
    (record) => !record.isPractice && matchesRole(record, roleFilter),
  );
  const retainedAuthenticRecordCount = tally.records.filter(
    (record) => !record.isPractice,
  ).length;
  const [firstRecord] = authenticRecords;
  const hasTruncatedDecisionHistory =
    tally.lifetime.decisions > retainedAuthenticRecordCount;
  const retainedSkips = getRetainedSkips(tally, hasTruncatedDecisionHistory);

  const buckets =
    granularity === "rolling20" || granularity === "rolling50"
      ? buildRollingBuckets({
          granularity,
          hasTruncatedDecisionHistory,
          records: authenticRecords,
          roleFilter,
          skipped: retainedSkips,
        })
      : buildCalendarBuckets({
          granularity,
          now,
          records: authenticRecords,
          roleFilter,
          skipped: retainedSkips,
        });

  const lastRecord = authenticRecords[authenticRecords.length - 1];

  return {
    buckets,
    earliestTimestamp: firstRecord ? firstRecord.at : null,
    isAtRecordCap:
      hasTruncatedDecisionHistory ||
      tally.records.length >= MAX_RECORDS ||
      (roleFilter === "all" &&
        (tally.lifetime.skippedHands > tally.skipped.length ||
          tally.skipped.length >= MAX_RECORDS)),
    latestTimestamp: lastRecord ? lastRecord.at : null,
    totalAuthenticDecisions: authenticRecords.length,
    totalSkippedHands: roleFilter === "all" ? retainedSkips.length : 0,
  };
};

export const readDiscardQualityTrend = (
  options: DiscardQualityTrendOptions,
): DiscardQualityTrend =>
  computeDiscardQualityTrend(readTallyForDisplay(), options);
