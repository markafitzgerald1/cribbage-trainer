import { type Card } from "../game/Card";
import { CribRole } from "../game/expectedCribPoints";
import type { PracticeRecord } from "./practiceLedger";
import type { StoredTally } from "./discardTally";
import { parseHandKey } from "./handKey";

export type LossQuantile = "high" | "medium" | "low";
export type MistakeQueueSortOrder = "priority" | "highestLoss" | "mostRecent";
export type MistakeQueueStatusFilter = "all" | "active" | "mastered";
export type MistakeQueueQuantileFilter = "all" | LossQuantile;
export type MistakeQueueRoleFilter = "all" | "dealer" | "pone";

export const MASTERY_CONSECUTIVE_SUCCESSES = 2;
const HALF_LIFE_DAYS = 30;
const MS_PER_DAY = 86_400_000;
const RECENCY_DECAY_PERIOD_MS = HALF_LIFE_DAYS * MS_PER_DAY;
const HALF_LIFE_BASE = 0.5;
const NUMERATOR_TWO = 2;
const DENOMINATOR_THREE = 3;
const FRACTION_ONE_THIRD = 1 / DENOMINATOR_THREE;
const FRACTION_TWO_THIRDS = NUMERATOR_TWO / DENOMINATOR_THREE;
const COMPARATOR_LESS = -1;
const MIN_DISTINCT_LOSSES_FOR_QUANTILES = 3;

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
  readonly previousDiscard: string | null;
  readonly priority: number;
  readonly pWrong: number;
  readonly wrong: number;
}

export interface MistakeQueueQuantileThresholds {
  readonly highThreshold: number;
  readonly mediumThreshold: number;
}

export interface MistakeQueueFilterOptions {
  readonly quantileFilter?: MistakeQueueQuantileFilter;
  readonly roleFilter?: MistakeQueueRoleFilter;
  readonly statusFilter?: MistakeQueueStatusFilter;
}

interface PriorityComputationOptions {
  readonly isMastered: boolean;
  readonly lastAttemptAt: number;
  readonly lossIfWrong: number;
  readonly now: number;
  readonly pWrong: number;
}

export const computeLossQuantileThresholds = (
  losses: readonly number[],
): MistakeQueueQuantileThresholds => {
  if (losses.length === 0) {
    return { highThreshold: 0, mediumThreshold: 0 };
  }
  const uniqueLosses = new Set(losses);
  const sorted = [...losses].sort((one, other) => one - other);

  if (uniqueLosses.size < MIN_DISTINCT_LOSSES_FOR_QUANTILES) {
    const maxLoss = Number(sorted[sorted.length - 1]);
    return { highThreshold: maxLoss, mediumThreshold: maxLoss };
  }

  const mediumIndex = Math.min(
    sorted.length - 1,
    Math.floor(sorted.length * FRACTION_ONE_THIRD),
  );
  const highIndex = Math.min(
    sorted.length - 1,
    Math.floor(sorted.length * FRACTION_TWO_THIRDS),
  );

  // eslint-disable-next-line security/detect-object-injection
  const highThreshold = Number(sorted[highIndex]);
  // eslint-disable-next-line security/detect-object-injection
  const mediumThreshold = Number(sorted[mediumIndex]);

  return {
    highThreshold,
    mediumThreshold,
  };
};

export const classifyLossQuantile = (
  loss: number,
  thresholds: MistakeQueueQuantileThresholds,
): LossQuantile => {
  if (thresholds.highThreshold === thresholds.mediumThreshold) {
    return "high";
  }
  if (loss >= thresholds.highThreshold) {
    return "high";
  }
  if (loss >= thresholds.mediumThreshold) {
    return "medium";
  }
  return "low";
};

const computePriority = ({
  isMastered,
  lastAttemptAt,
  lossIfWrong,
  now,
  pWrong,
}: PriorityComputationOptions): number => {
  if (isMastered) {
    return 0;
  }
  const ageMs = Math.max(0, now - lastAttemptAt);
  const recency = HALF_LIFE_BASE ** (ageMs / RECENCY_DECAY_PERIOD_MS);
  return lossIfWrong * pWrong * recency;
};

export const filterMistakeQueue = (
  items: readonly MistakeQueueItem[],
  options: MistakeQueueFilterOptions,
): readonly MistakeQueueItem[] => {
  const {
    quantileFilter = "all",
    roleFilter = "all",
    statusFilter = "all",
  } = options;

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

export const sortMistakeQueue = (
  items: readonly MistakeQueueItem[],
  sortOrder: MistakeQueueSortOrder,
): readonly MistakeQueueItem[] => {
  const copy = [...items];
  switch (sortOrder) {
    case "highestLoss":
      return copy.sort(
        (one, other) =>
          other.lossIfWrong - one.lossIfWrong ||
          other.priority - one.priority ||
          other.lastAttemptAt - one.lastAttemptAt ||
          one.handKey.localeCompare(other.handKey),
      );
    case "mostRecent":
      return copy.sort(
        (one, other) =>
          other.lastAttemptAt - one.lastAttemptAt ||
          other.priority - one.priority ||
          other.lossIfWrong - one.lossIfWrong ||
          one.handKey.localeCompare(other.handKey),
      );
    case "priority":
    default:
      return copy.sort((one, other) => {
        if (one.isMastered !== other.isMastered) {
          return one.isMastered ? 1 : COMPARATOR_LESS;
        }
        return (
          other.priority - one.priority ||
          other.lossIfWrong - one.lossIfWrong ||
          other.lastAttemptAt - one.lastAttemptAt ||
          one.handKey.localeCompare(other.handKey)
        );
      });
  }
};

export const buildMistakeQueue = (
  tally: StoredTally,
  now: number = Date.now(),
): readonly MistakeQueueItem[] => {
  const practiceMap = new Map<string, PracticeRecord>();
  for (const practice of tally.practice) {
    practiceMap.set(practice.handKey, practice);
  }

  // Authentic mistakes only: non-practice decisions with sub-optimal outcomes.
  const authenticMistakes = tally.records.filter(
    (record) => !record.isPractice && !record.isOptimal,
  );

  // Group by handKey to ensure uniqueness.
  const uniqueMistakesByHandKey = new Map<
    string,
    (typeof authenticMistakes)[number]
  >();
  for (const record of authenticMistakes) {
    if (!uniqueMistakesByHandKey.has(record.handKey)) {
      uniqueMistakesByHandKey.set(record.handKey, record);
    }
  }

  const validMistakeRecords = Array.from(uniqueMistakesByHandKey.values())
    .map((record) => {
      const parsed = parseHandKey(record.handKey);
      if (parsed === null) {
        return null;
      }
      return {
        cards: parsed.cards,
        cribRole: record.cribRole,
        handKey: record.handKey,
        lossIfWrong: record.expectedPointsLoss,
        originalDecisionAt: record.at,
        previousDiscard: record.discardKey,
      };
    })
    .filter(
      (record): record is Exclude<typeof record, null> => record !== null,
    );

  const thresholds = computeLossQuantileThresholds(
    validMistakeRecords.map((mistakeRecord) => mistakeRecord.lossIfWrong),
  );

  const items: MistakeQueueItem[] = validMistakeRecords.map((record) => {
    const practice = practiceMap.get(record.handKey);
    const practiceAttempts = practice?.attempts ?? 0;
    const practiceWrong = practice?.wrong ?? 0;
    const consecutiveSuccesses = practice?.consecutiveSuccesses ?? 0;
    const lastAttemptAt = practice?.lastAttemptAt ?? record.originalDecisionAt;

    const totalAttempts = 1 + practiceAttempts;
    const totalWrong = 1 + practiceWrong;
    const isMastered = consecutiveSuccesses >= MASTERY_CONSECUTIVE_SUCCESSES;
    const pWrong = totalWrong / totalAttempts;
    const priority = computePriority({
      isMastered,
      lastAttemptAt,
      lossIfWrong: record.lossIfWrong,
      now,
      pWrong,
    });
    const lossQuantile = classifyLossQuantile(record.lossIfWrong, thresholds);

    return {
      attempts: totalAttempts,
      cards: record.cards,
      consecutiveSuccesses,
      cribRole: record.cribRole,
      handKey: record.handKey,
      isMastered,
      lastAttemptAt,
      lossIfWrong: record.lossIfWrong,
      lossQuantile,
      originalDecisionAt: record.originalDecisionAt,
      pWrong,
      previousDiscard: record.previousDiscard,
      priority,
      wrong: totalWrong,
    };
  });

  return sortMistakeQueue(items, "priority");
};
