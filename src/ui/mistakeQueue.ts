import { type DiscardDecisionRecord, type StoredTally } from "./discardTally";
import { type Card } from "../game/Card";
import { CribRole } from "../game/expectedCribPoints";
import type { PracticeRecord } from "./practiceLedger";
import { parseHandKey } from "./handKey";

export const MIN_DISTINCT_LOSSES_FOR_QUANTILES = 3;
const OFFSET_HIGH_QUANTILE = 2;
const FRACTION_ONE_THIRD_DIVISOR = 3;
const FRACTION_TWO_THIRDS_NUMERATOR = 2;
const FRACTION_TWO_THIRDS_DENOMINATOR = 3;
const FRACTION_TWO_THIRDS =
  FRACTION_TWO_THIRDS_NUMERATOR / FRACTION_TWO_THIRDS_DENOMINATOR;
// Two consecutive optimal choices since the last error; the one place the copy and the state machine both read.
export const SUCCESSES_FOR_MASTERY = 2;

export type MistakeQueueSortOrder = "highestLoss" | "mostRecent" | "priority";

export type MistakeQueueStatusFilter = "active" | "all" | "mastered";

export type MistakeQueueRoleFilter = "all" | "dealer" | "pone";

export type MistakeQueueQuantileFilter = "all" | "high" | "low" | "medium";

export type LossQuantile = "high" | "low" | "medium" | null;

export interface MistakeQueueQuantileThresholds {
  readonly highThreshold: number;
  readonly mediumThreshold: number;
}

export interface MistakeQueueItem {
  readonly attempts: number;
  readonly cards: readonly Card[];
  readonly consecutiveSuccesses: number;
  readonly cribRole: CribRole;
  readonly handKey: string;
  readonly isMastered: boolean;
  readonly lastAttemptAt: number;
  readonly lossIfWrong: number;
  readonly lossQuantile: LossQuantile;
  readonly originalDecisionAt: number;
  readonly pWrong: number;
  readonly previousDiscard: string | null;
  // The cost of `previousDiscard` itself, from the same record — not `lossIfWrong`, which averages every wrong attempt.
  readonly previousDiscardLoss: number;
  readonly priority: number;
  readonly wrong: number;
}

export const computeLossQuantileThresholds = (
  losses: readonly number[],
): MistakeQueueQuantileThresholds => {
  if (losses.length === 0) {
    return { highThreshold: 0, mediumThreshold: 0 };
  }
  const uniqueLosses = new Set(losses);
  if (uniqueLosses.size < MIN_DISTINCT_LOSSES_FOR_QUANTILES) {
    return { highThreshold: 0, mediumThreshold: 0 };
  }

  const sortedDistinct = Array.from(uniqueLosses).sort(
    (one, other) => one - other,
  );

  const mediumIndex = Math.min(
    sortedDistinct.length - OFFSET_HIGH_QUANTILE,
    Math.max(1, Math.floor(sortedDistinct.length / FRACTION_ONE_THIRD_DIVISOR)),
  );
  const highIndex = Math.min(
    sortedDistinct.length - 1,
    Math.max(
      mediumIndex + 1,
      Math.floor(sortedDistinct.length * FRACTION_TWO_THIRDS),
    ),
  );

  // eslint-disable-next-line security/detect-object-injection
  const highThreshold = Number(sortedDistinct[highIndex]);
  // eslint-disable-next-line security/detect-object-injection
  const mediumThreshold = Number(sortedDistinct[mediumIndex]);

  return {
    highThreshold,
    mediumThreshold,
  };
};

export const classifyLossQuantile = (
  loss: number,
  thresholds: MistakeQueueQuantileThresholds,
): LossQuantile => {
  if (
    thresholds.highThreshold === 0 ||
    thresholds.mediumThreshold === 0 ||
    thresholds.highThreshold <= thresholds.mediumThreshold
  ) {
    return null;
  }

  if (loss >= thresholds.highThreshold) {
    return "high";
  }
  if (loss >= thresholds.mediumThreshold) {
    return "medium";
  }
  return "low";
};

export const computePriority = (lossIfWrong: number, pWrong: number): number =>
  lossIfWrong * pWrong;

interface HandAggregate {
  discardKey: string | null;
  expectedPointsLoss: number;
  handKey: string;
  originalAt: number;
  recencyAt: number;
}

/*
 * The role is deliberately not carried here even though every source record
 * has a cribRole: handKey already encodes it (`${cards}|${cribRole}`), so a
 * second copy could only ever agree with the parsed key or, on corrupt or
 * hand-edited storage, silently disagree with it. Below, the item's cribRole
 * comes from parsing the same handKey this aggregate is keyed by, the same
 * source its cards already come from, rather than from a redundant field
 * that a divergent record could have set to something else.
 */
/*
 * `originalAt` tracks the earliest `at` seen for a handKey across every
 * duplicate, independently of which duplicate's other fields win below.
 * Normal play never records two DiscardDecisionRecords for one handKey —
 * recordDiscardDecision is idempotent by handKey — so duplicates arise only
 * from a genuinely rare cross-tab race or from hand-edited/legacy storage.
 * The rest of the aggregate (loss, discard, recency) still tracks whichever
 * duplicate is most recent, since that is the mistake's current state; only
 * the moment the player first made it stays fixed to the earliest record,
 * which is what MistakeQueueItem.originalDecisionAt promises callers.
 */
const aggregateMistakeRecords = (
  records: readonly DiscardDecisionRecord[],
): Map<string, HandAggregate> => {
  const map = new Map<string, HandAggregate>();

  for (const record of records) {
    const isMistake =
      !record.isPractice && !record.isOptimal && record.expectedPointsLoss > 0;
    if (isMistake) {
      const existing = map.get(record.handKey);
      const recencyAt = record.recencyAt ?? record.at;
      const originalAt = existing
        ? Math.min(existing.originalAt, record.at)
        : record.at;
      map.set(
        record.handKey,
        !existing || recencyAt >= existing.recencyAt
          ? {
              discardKey: record.discardKey,
              expectedPointsLoss: record.expectedPointsLoss,
              handKey: record.handKey,
              originalAt,
              recencyAt,
            }
          : { ...existing, originalAt },
      );
    }
  }

  return map;
};

interface CandidateParams {
  aggregate: HandAggregate;
  cards: readonly Card[];
  cribRole: CribRole;
  practice?: PracticeRecord | undefined;
}

const createCandidateQueueItem = ({
  aggregate,
  cards,
  cribRole,
  practice,
}: CandidateParams) => {
  const consecutiveSuccesses = practice?.consecutiveSuccesses ?? 0;
  const isMastered = consecutiveSuccesses >= SUCCESSES_FOR_MASTERY;
  const attempts = (practice?.attempts ?? 0) + 1;
  const wrong = (practice?.wrong ?? 0) + 1;
  const pWrong = wrong / attempts;

  const totalWrongLoss =
    (practice?.totalWrongLoss ?? 0) + aggregate.expectedPointsLoss;
  const lossIfWrong = totalWrongLoss / wrong;
  const priority = computePriority(lossIfWrong, pWrong);
  const lastAttemptAt = practice
    ? Math.max(practice.lastAttemptAt, aggregate.recencyAt)
    : aggregate.recencyAt;

  return {
    attempts,
    cards,
    consecutiveSuccesses,
    cribRole,
    handKey: aggregate.handKey,
    isMastered,
    lastAttemptAt,
    lossIfWrong,
    originalDecisionAt: aggregate.originalAt,
    pWrong,
    previousDiscard: aggregate.discardKey,
    previousDiscardLoss: aggregate.expectedPointsLoss,
    priority,
    wrong,
  };
};

export const buildMistakeQueue = (
  tally: StoredTally,
): readonly MistakeQueueItem[] => {
  const mistakeMap = aggregateMistakeRecords(tally.records);
  if (mistakeMap.size === 0) {
    return [];
  }

  const practiceMap = new Map(
    (tally.practice ?? []).map((item) => [item.handKey, item]),
  );

  const candidateItems: ReturnType<typeof createCandidateQueueItem>[] = [];

  for (const aggregate of mistakeMap.values()) {
    const parsedKey = parseHandKey(aggregate.handKey);
    if (parsedKey) {
      candidateItems.push(
        createCandidateQueueItem({
          aggregate,
          cards: parsedKey.cards,
          cribRole: parsedKey.cribRole,
          practice: practiceMap.get(aggregate.handKey),
        }),
      );
    }
  }

  const losses = candidateItems.map((item) => item.lossIfWrong);
  const thresholds = computeLossQuantileThresholds(losses);

  return candidateItems.map((item) => ({
    ...item,
    lossQuantile: classifyLossQuantile(item.lossIfWrong, thresholds),
  }));
};

export const filterMistakeQueue = (
  items: readonly MistakeQueueItem[],
  filters: {
    readonly quantileFilter?: MistakeQueueQuantileFilter;
    readonly roleFilter?: MistakeQueueRoleFilter;
    readonly statusFilter?: MistakeQueueStatusFilter;
  },
): readonly MistakeQueueItem[] => {
  const {
    quantileFilter = "all",
    roleFilter = "all",
    statusFilter = "all",
  } = filters;

  return items.filter((item) => {
    if (statusFilter === "active" && item.isMastered) {
      return false;
    }
    if (statusFilter === "mastered" && !item.isMastered) {
      return false;
    }

    if (roleFilter === "dealer" && item.cribRole !== CribRole.Dealer) {
      return false;
    }
    if (roleFilter === "pone" && item.cribRole !== CribRole.Pone) {
      return false;
    }

    if (quantileFilter !== "all" && item.lossQuantile !== quantileFilter) {
      return false;
    }

    return true;
  });
};

const getSortDeltas = (
  firstItem: MistakeQueueItem,
  secondItem: MistakeQueueItem,
  sortOrder: MistakeQueueSortOrder,
): { primaryDelta: number; secondaryDelta: number } => {
  if (sortOrder === "priority") {
    return {
      primaryDelta: secondItem.priority - firstItem.priority,
      secondaryDelta: secondItem.lossIfWrong - firstItem.lossIfWrong,
    };
  }
  if (sortOrder === "highestLoss") {
    return {
      primaryDelta: secondItem.lossIfWrong - firstItem.lossIfWrong,
      secondaryDelta: secondItem.priority - firstItem.priority,
    };
  }
  return {
    primaryDelta: secondItem.lastAttemptAt - firstItem.lastAttemptAt,
    secondaryDelta: secondItem.priority - firstItem.priority,
  };
};

/*
 * `index` is always within `[0, items.length)` at every call site below —
 * each is derived from `items.length` — so the assertion states a fact the
 * bounded arithmetic already guarantees rather than papering over a real
 * chance of undefined.
 */
const itemAt = (
  items: readonly MistakeQueueItem[],
  index: number,
): MistakeQueueItem =>
  // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-non-null-assertion
  items[index]!;

/*
 * Draws one active (non-mastered) hand weighted by `priority` — the expected
 * points a single correct drill of that hand recovers, the same quantity the
 * "priority" sort order ranks by, so the browse list and the auto-deal share
 * one function. `random` is a uniform value in [0, 1); callers pass their
 * existing generator. When every active hand still has priority 0 (no wrong
 * attempt has cost anything yet) the draw falls back to uniform so a hand is
 * still dealt. `excludeHandKey` drops the hand just drilled so a run never
 * deals it twice in a row, unless it is the only active hand left. Returns
 * null only when no active hand exists.
 */
export const sampleMistakeQueueByPriority = (
  items: readonly MistakeQueueItem[],
  random: number,
  excludeHandKey: string | null = null,
): MistakeQueueItem | null => {
  const active = items.filter((item) => !item.isMastered);
  if (active.length === 0) {
    return null;
  }
  const eligible =
    excludeHandKey === null || active.length === 1
      ? active
      : active.filter((item) => item.handKey !== excludeHandKey);
  const clampedRandom = Math.min(Math.max(random, 0), 1 - Number.EPSILON);
  const totalPriority = eligible.reduce((sum, item) => sum + item.priority, 0);
  if (totalPriority <= 0) {
    return itemAt(eligible, Math.floor(clampedRandom * eligible.length));
  }

  const target = clampedRandom * totalPriority;
  let cumulative = 0;
  // The last item carries whatever weight the loop did not consume, including any left by floating-point drift in the running sum.
  for (let index = 0; index < eligible.length - 1; index += 1) {
    cumulative += itemAt(eligible, index).priority;
    if (target < cumulative) {
      return itemAt(eligible, index);
    }
  }
  return itemAt(eligible, eligible.length - 1);
};

export const sortMistakeQueue = (
  items: readonly MistakeQueueItem[],
  sortOrder: MistakeQueueSortOrder,
): readonly MistakeQueueItem[] => {
  const sorted = [...items];

  sorted.sort((firstItem, secondItem) => {
    const { primaryDelta, secondaryDelta } = getSortDeltas(
      firstItem,
      secondItem,
      sortOrder,
    );

    if (primaryDelta !== 0) {
      return primaryDelta;
    }
    if (secondaryDelta !== 0) {
      return secondaryDelta;
    }
    if (secondItem.lastAttemptAt !== firstItem.lastAttemptAt) {
      return secondItem.lastAttemptAt - firstItem.lastAttemptAt;
    }
    return firstItem.handKey.localeCompare(secondItem.handKey);
  });

  return sorted;
};
