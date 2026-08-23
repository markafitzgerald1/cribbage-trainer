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
  /*
   * The hand this decision was made from, which is what makes recording
   * idempotent. The trainer shows every option ranked before a discard is
   * chosen, so only a hand's first completed discard is an instinct; a second
   * one is a choice made after reading the answer. Re-renders from Back,
   * Forward, a re-sort, or a reload of the same URL all arrive here as the
   * same hand, and all of them must count once.
   */
  readonly handKey: string;
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
  /*
   * Today is read from the records rather than from a counter, because a
   * counter would have to be reset by something and nothing here runs at
   * midnight. It is the one slice #19 shows: two numbers are a comparison a
   * reader can make at a glance, where a run of them is a trend and needs the
   * chart #719 owns.
   */
  readonly todayDecisions: number;
  readonly todayMeanExpectedPointsLoss: number | null;
  readonly todayOptimalDecisions: number;
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
  readonly handKey?: unknown;
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
    typeof candidate.handKey === "string" &&
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

/*
 * Null means "present but written by a build this one cannot read", which is
 * different from empty in the one way that matters: empty may be written
 * over, and this may not. Returning an empty tally for both is what let the
 * next completed discard erase a newer history one commit ago.
 */
const readStoredTally = (): StoredTally | null => {
  const stored = localStorage.getItem(discardTallyKey);
  if (stored === null) {
    return emptyTally;
  }
  const candidate = readableTally(JSON.parse(stored));
  if (candidate === null) {
    return null;
  }
  const { records } = candidate;
  return {
    lifetime: parseLifetime(candidate.lifetime),
    records: Array.isArray(records) ? records.filter(isDecisionRecord) : [],
    version: CURRENT_VERSION,
  };
};

// Calendar days in the reader's own zone, which is what "today" means to them; comparing dates avoids doing arithmetic across a daylight-saving change.
const isSameLocalDay = (one: number, other: number) =>
  new Date(one).toDateString() === new Date(other).toDateString();

const meanOf = (losses: readonly number[]) =>
  losses.length === 0
    ? null
    : losses.reduce((total, loss) => total + loss, 0) / losses.length;

const summarize = (
  { lifetime, records }: StoredTally,
  now: number,
): DiscardTallySummary => {
  const today = records.filter(
    (record) => !record.isPractice && isSameLocalDay(record.at, now),
  );
  return {
    decisions: lifetime.decisions,
    meanExpectedPointsLoss:
      lifetime.decisions === 0
        ? null
        : lifetime.expectedPointsLossTotal / lifetime.decisions,
    optimalDecisions: lifetime.optimalDecisions,
    todayDecisions: today.length,
    todayMeanExpectedPointsLoss: meanOf(
      today.map((record) => record.expectedPointsLoss),
    ),
    todayOptimalDecisions: today.filter((record) => record.isOptimal).length,
  };
};

/*
 * Malformed storage reads as an empty tally rather than throwing, matching
 * how analytics consent already treats a value it cannot trust: a corrupt
 * statistic is worth losing, a working deal is not.
 */
/*
 * Held only when a write fails. Storage is otherwise the single source of
 * truth, but a browser refusing writes would re-read the same stale tally
 * before every decision, so a session's second hand would replace its first
 * rather than add to it.
 */
let unsavedTally: StoredTally | null = null;

const readTallyOrNull = (): StoredTally | null => {
  try {
    return readStoredTally();
  } catch {
    return emptyTally;
  }
};

const readTallyForDisplay = (): StoredTally =>
  unsavedTally ?? readTallyOrNull() ?? emptyTally;

export const readDiscardTally = (now: number): DiscardTallySummary =>
  summarize(readTallyForDisplay(), now);

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

/*
 * Idempotent by hand rather than by call. Collapsing repeats here rather
 * than in the caller is what makes a reload safe: a completed discard restored from
 * its own URL renders exactly as a fresh one does, and no amount of care in
 * a component can tell the two apart.
 */
export const recordDiscardDecision = (
  decision: DiscardDecisionRecord,
): DiscardTallySummary => {
  const stored = unsavedTally ?? readTallyOrNull();
  /*
   * A tally this build cannot read is left exactly as it is. Recording over
   * it would discard a richer history for the sake of one decision, and the
   * tab that can read it is the one that should keep writing it.
   */
  if (stored === null) {
    return summarize(emptyTally, decision.at);
  }
  const tally = stored;
  if (tally.records.some((record) => record.handKey === decision.handKey)) {
    return summarize(tally, decision.at);
  }
  const next: StoredTally = {
    lifetime: addToLifetime(tally.lifetime, decision),
    records: [...tally.records, decision].slice(-MAX_RECORDS),
    version: CURRENT_VERSION,
  };
  try {
    localStorage.setItem(discardTallyKey, JSON.stringify(next));
    unsavedTally = null;
  } catch {
    unsavedTally = next;
    /*
     * A quota or a storage-disabled browser must not break the deal. The
     * summary returned still reflects this decision, so the number on screen
     * stays right for the session even when nothing can be persisted.
     */
  }
  return summarize(next, decision.at);
};

// Exported for the specs and stories that need a browser with no history.
export const clearDiscardTally = () => {
  unsavedTally = null;
  localStorage.removeItem(discardTallyKey);
};
