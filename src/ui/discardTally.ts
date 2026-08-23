import type { CribRole } from "../game/expectedCribPoints";

export const discardTallyKey = "discardTally";

/*
 * The version travels inside the value rather than in the key, so a future
 * shape can read what came before it and migrate. A version-suffixed key
 * would make every earlier tally invisible instead, which is the same as
 * discarding it.
 */
const CURRENT_VERSION = 1;

/*
 * Records are what #719 draws a trend from, so they cannot be replaced by the
 * counters below. They cannot grow without limit either: this shares an origin
 * quota with everything else the app stores. At roughly eighty bytes each the
 * cap is a small fraction of that, and a player who reaches it has a history
 * far longer than any view planned for it.
 */
const MAX_RECORDS = 2000;

export interface DiscardDecisionRecord {
  readonly at: number;
  readonly cribRole: CribRole;
  readonly expectedPointsLoss: number;
  readonly isOptimal: boolean;
  /*
   * Seeded, deep-linked, and manually entered hands are study rather than play
   * made under uncertainty, so they are kept but excluded from the headline.
   * Letting them move it would make the number mean less than it claims.
   */
  readonly isPractice: boolean;
}

export interface DiscardTallySummary {
  readonly decisions: number;
  readonly meanExpectedPointsLoss: number | null;
  readonly optimalDecisions: number;
}

interface LifetimeTotals {
  readonly decisions: number;
  readonly expectedPointsLossTotal: number;
  readonly optimalDecisions: number;
}

interface StoredTally {
  readonly lifetime: LifetimeTotals;
  readonly records: readonly DiscardDecisionRecord[];
  readonly version: number;
}

const emptyLifetime: LifetimeTotals = {
  decisions: 0,
  expectedPointsLossTotal: 0,
  optimalDecisions: 0,
};

const emptyTally: StoredTally = {
  lifetime: emptyLifetime,
  records: [],
  version: CURRENT_VERSION,
};

/*
 * Parsed storage is described by interfaces with unknown-typed optional
 * fields rather than by an index signature. An index signature would force
 * bracket access under noPropertyAccessFromIndexSignature, and eslint's
 * dot-notation rule rewrites exactly that back to dots on --fix, so the two
 * gates disagree forever. Declaring the fields settles it in the type.
 */
interface MaybeTally {
  readonly lifetime?: unknown;
  readonly records?: unknown;
  readonly version?: unknown;
}

interface MaybeLifetime {
  readonly decisions?: unknown;
  readonly expectedPointsLossTotal?: unknown;
  readonly optimalDecisions?: unknown;
}

interface MaybeDecisionRecord {
  readonly at?: unknown;
  readonly cribRole?: unknown;
  readonly expectedPointsLoss?: unknown;
  readonly isOptimal?: unknown;
  readonly isPractice?: unknown;
}

const isObject = (value: unknown): value is object =>
  typeof value === "object" && value !== null;

const isDecisionRecord = (value: unknown): value is DiscardDecisionRecord => {
  if (!isObject(value)) {
    return false;
  }
  const candidate = value as MaybeDecisionRecord;
  return (
    typeof candidate.at === "number" &&
    typeof candidate.expectedPointsLoss === "number" &&
    typeof candidate.isOptimal === "boolean" &&
    typeof candidate.isPractice === "boolean" &&
    typeof candidate.cribRole === "string"
  );
};

const parseLifetime = (value: unknown): LifetimeTotals => {
  if (!isObject(value)) {
    return emptyLifetime;
  }
  const { decisions, expectedPointsLossTotal, optimalDecisions } =
    value as MaybeLifetime;
  return typeof decisions === "number" &&
    typeof expectedPointsLossTotal === "number" &&
    typeof optimalDecisions === "number"
    ? { decisions, expectedPointsLossTotal, optimalDecisions }
    : emptyLifetime;
};

/*
 * A stored version newer than this build is left untouched and read as empty.
 * The alternative is to overwrite it, which would destroy a richer history
 * because one tab happens to be running an older deploy.
 */
const readableTally = (parsed: unknown): MaybeTally | null => {
  if (!isObject(parsed)) {
    return null;
  }
  const candidate = parsed as MaybeTally;
  return typeof candidate.version === "number" &&
    candidate.version <= CURRENT_VERSION
    ? candidate
    : null;
};

const readStoredTally = (): StoredTally => {
  const stored = localStorage.getItem(discardTallyKey);
  if (stored === null) {
    return emptyTally;
  }
  const candidate = readableTally(JSON.parse(stored));
  if (candidate === null) {
    return emptyTally;
  }
  const { records } = candidate;
  return {
    lifetime: parseLifetime(candidate.lifetime),
    records: Array.isArray(records) ? records.filter(isDecisionRecord) : [],
    version: CURRENT_VERSION,
  };
};

const summarize = ({ lifetime }: StoredTally): DiscardTallySummary => ({
  decisions: lifetime.decisions,
  meanExpectedPointsLoss:
    lifetime.decisions === 0
      ? null
      : lifetime.expectedPointsLossTotal / lifetime.decisions,
  optimalDecisions: lifetime.optimalDecisions,
});

/*
 * Malformed storage reads as an empty tally rather than throwing, matching
 * how analytics consent already treats a value it cannot trust: a corrupt
 * statistic is worth losing, a working deal is not.
 */
const readTallyOrEmpty = (): StoredTally => {
  try {
    return readStoredTally();
  } catch {
    return emptyTally;
  }
};

export const readDiscardTally = (): DiscardTallySummary =>
  summarize(readTallyOrEmpty());

/*
 * The counters are deliberately redundant with the records. Records are
 * trimmed once they reach the cap, and a mean recomputed from survivors would
 * quietly change at that moment; keeping counters means trimming costs the
 * trend its oldest detail and never costs the headline its meaning.
 */
const addToLifetime = (
  lifetime: LifetimeTotals,
  decision: DiscardDecisionRecord,
): LifetimeTotals =>
  decision.isPractice
    ? lifetime
    : {
        decisions: lifetime.decisions + 1,
        expectedPointsLossTotal:
          lifetime.expectedPointsLossTotal + decision.expectedPointsLoss,
        optimalDecisions:
          lifetime.optimalDecisions + (decision.isOptimal ? 1 : 0),
      };

export const recordDiscardDecision = (
  decision: DiscardDecisionRecord,
): DiscardTallySummary => {
  const tally = readTallyOrEmpty();
  const next: StoredTally = {
    lifetime: addToLifetime(tally.lifetime, decision),
    records: [...tally.records, decision].slice(-MAX_RECORDS),
    version: CURRENT_VERSION,
  };
  try {
    localStorage.setItem(discardTallyKey, JSON.stringify(next));
  } catch {
    /*
     * A quota or a storage-disabled browser must not break the deal. The
     * summary returned still reflects this decision, so the number on screen
     * stays right for the session even when nothing can be persisted.
     */
  }
  return summarize(next);
};

// Exported for the specs and stories that need a browser with no history.
export const clearDiscardTally = () => {
  localStorage.removeItem(discardTallyKey);
};
