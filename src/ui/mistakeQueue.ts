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
const SUCCESSES_FOR_MASTERY = 2;

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
