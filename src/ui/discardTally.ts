import type { CribRole } from "../game/expectedCribPoints";
import { DISCARD_TALLY_KEY_PREFIX } from "./discardTallyKeyPrefix";

/*
 * Scoped to the deployment that wrote it. A PR preview and production share
 * an origin — both are pages on the same host, differing only by path — and
 * localStorage is keyed by origin alone, so an unscoped key would let a
 * preview being tested write into the player's real history, permanently.
 */
export const discardTallyKey = `${DISCARD_TALLY_KEY_PREFIX}${import.meta.env.BASE_URL}`;

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
  readonly todaySkippedHands: number;
  /*
   * Hands dealt and left without a discard. Nothing scores them, so they
   * cannot enter the averages — but a player who abandons the hands they
   * find hard would otherwise post a flattering average and a high share of
   * best choices, and the statistic would reward avoidance. Counting them
   * where they can be seen leaves the averages honest about what they omit.
   */
  readonly skippedHands: number;
}

interface LifetimeTotals {
  readonly decisions: number;
  readonly expectedPointsLossTotal: number;
  readonly optimalDecisions: number;
  readonly skippedHands: number;
}

interface SkippedHand {
  readonly at: number;
}

interface StoredTally {
  readonly lifetime: LifetimeTotals;
  readonly records: readonly DiscardDecisionRecord[];
  /*
   * Incremented on every write, and the only thing compared when deciding
   * whether storage has moved. Counting rows cannot answer that: at the
   * record cap another tab can add a practice decision without changing a
   * single count, because practice leaves the lifetime totals alone and the
   * cap holds the length steady.
   */
  readonly revision: number;
  // Times only: a skipped hand has no decision to describe, and its cards are not worth keeping to say so.
  readonly skipped: readonly SkippedHand[];
  readonly version: number;
}

const emptyLifetime: LifetimeTotals = {
  decisions: 0,
  expectedPointsLossTotal: 0,
  optimalDecisions: 0,
  skippedHands: 0,
};

const emptyTally: StoredTally = {
  lifetime: emptyLifetime,
  records: [],
  revision: 0,
  skipped: [],
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
  readonly revision?: unknown;
  readonly skipped?: unknown;
  readonly version?: unknown;
}

interface MaybeLifetime {
  readonly decisions?: unknown;
  readonly expectedPointsLossTotal?: unknown;
  readonly optimalDecisions?: unknown;
  readonly skippedHands?: unknown;
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

const isSkippedHand = (value: unknown): value is SkippedHand =>
  isObject(value) && typeof (value as SkippedHand).at === "number";

const parseLifetime = (value: unknown): LifetimeTotals => {
  if (!isObject(value)) {
    return emptyLifetime;
  }
  const { decisions, expectedPointsLossTotal, optimalDecisions, skippedHands } =
    value as MaybeLifetime;
  return typeof decisions === "number" &&
    typeof expectedPointsLossTotal === "number" &&
    typeof optimalDecisions === "number"
    ? {
        decisions,
        expectedPointsLossTotal,
        optimalDecisions,
        // Absent in a tally written before skips were counted, which is a history worth keeping rather than discarding.
        skippedHands: typeof skippedHands === "number" ? skippedHands : 0,
      }
    : emptyLifetime;
};

/*
 * A stored version newer than this build is left untouched and read as empty.
 * The alternative is to overwrite it, which would destroy a richer history
 * because one tab happens to be running an older deploy.
 */
/*
 * Only a version this build can name as newer earns write protection.
 * Anything else it cannot read — not an object, no version, a version that is
 * not a number — is junk rather than a richer history. Protecting that too
 * would leave the tally empty and refusing every write until someone cleared
 * storage by hand, which is a worse failure than the overwrite it guards.
 */
const isFromNewerBuild = (parsed: unknown): boolean =>
  isObject(parsed) &&
  typeof (parsed as MaybeTally).version === "number" &&
  ((parsed as MaybeTally).version as number) > CURRENT_VERSION;

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
 * Null means "present and written by a newer build", which differs from empty
 * in the one way that matters: empty may be written over and this may not.
 * Returning empty for both is what let the next completed discard erase a
 * richer history; returning null for both would brick the tally instead.
 */
const readStoredTally = (): StoredTally | null => {
  const stored = localStorage.getItem(discardTallyKey);
  if (stored === null) {
    return emptyTally;
  }
  const parsed: unknown = JSON.parse(stored);
  if (isFromNewerBuild(parsed)) {
    return null;
  }
  const candidate = readableTally(parsed);
  if (candidate === null) {
    return emptyTally;
  }
  const { records } = candidate;
  return {
    lifetime: parseLifetime(candidate.lifetime),
    records: Array.isArray(records) ? records.filter(isDecisionRecord) : [],
    // Absent in a tally written before revisions were kept, which simply starts the count.
    revision: typeof candidate.revision === "number" ? candidate.revision : 0,
    skipped: Array.isArray(candidate.skipped)
      ? candidate.skipped.filter(isSkippedHand)
      : [],
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
  { lifetime, records, skipped }: StoredTally,
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
    skippedHands: lifetime.skippedHands,
    todayDecisions: today.length,
    todayMeanExpectedPointsLoss: meanOf(
      today.map((record) => record.expectedPointsLoss),
    ),
    todayOptimalDecisions: today.filter((record) => record.isOptimal).length,
    todaySkippedHands: skipped.filter((hand) => isSameLocalDay(hand.at, now))
      .length,
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
 *
 * The value it was derived from is kept beside it. If storage has moved on
 * since — another tab recording while this one could not write — the
 * fallback is a branch off a history that no longer exists, and extending it
 * would overwrite that tab's hands with this one's stale copy.
 */
let unsavedTally: StoredTally | null = null;
let unsavedBase: StoredTally | null = null;

const sameHistory = (one: StoredTally, other: StoredTally) =>
  one.revision === other.revision;

const forgetUnsaved = () => {
  unsavedTally = null;
  unsavedBase = null;
};

/*
 * The unsaved copy only when storage still holds what it grew from.
 * Otherwise this tab's pending hands are dropped: losing them costs a
 * session's own statistics, where keeping them would cost another tab its
 * entire history.
 */
const basisFor = (persisted: StoredTally): StoredTally => {
  if (
    unsavedTally !== null &&
    unsavedBase !== null &&
    sameHistory(persisted, unsavedBase)
  ) {
    return unsavedTally;
  }
  forgetUnsaved();
  return persisted;
};

const readTallyOrNull = (): StoredTally | null => {
  try {
    return readStoredTally();
  } catch {
    return emptyTally;
  }
};

const readTallyForDisplay = (): StoredTally => {
  const persisted = readTallyOrNull();
  return persisted === null ? emptyTally : basisFor(persisted);
};

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
        ...lifetime,
        decisions: lifetime.decisions + 1,
        expectedPointsLossTotal:
          lifetime.expectedPointsLossTotal + decision.expectedPointsLoss,
        optimalDecisions:
          lifetime.optimalDecisions + (decision.isOptimal ? 1 : 0),
      };

/*
 * Every write goes through here: read what is there, refuse if a newer build
 * wrote it, extend it, and persist. Returning the tally unchanged means there
 * was nothing to record, and skips the write rather than rewriting identical
 * bytes.
 */
const extendStoredTally = (
  at: number,
  extend: (tally: StoredTally) => StoredTally,
): DiscardTallySummary => {
  /*
   * Storage is consulted even when a write failed earlier, because the
   * failure may have been transient and another tab may have written a newer
   * schema since. Trusting the in-memory copy alone would let this build
   * flush its own history over that one the moment writing worked again.
   */
  const persisted = readTallyOrNull();
  const stored = persisted === null ? null : basisFor(persisted);
  /*
   * A tally this build cannot read is left exactly as it is. Recording over
   * it would discard a richer history for the sake of one hand, and the tab
   * that can read it is the one that should keep writing it.
   */
  if (stored === null) {
    return summarize(emptyTally, at);
  }
  const extended = extend(stored);
  if (extended === stored) {
    return summarize(stored, at);
  }
  // Every write advances the revision, which is what lets another tab's write be noticed at all.
  const next: StoredTally = { ...extended, revision: extended.revision + 1 };
  try {
    localStorage.setItem(discardTallyKey, JSON.stringify(next));
    forgetUnsaved();
  } catch {
    /*
     * A quota or a storage-disabled browser must not break the deal. The
     * summary still reflects this hand, and the tally it could not persist is
     * kept so the rest of the session accumulates onto it rather than onto
     * the unchanged stored value.
     */
    unsavedTally = next;
    // The first failure's basis is kept through a run of them, so a later success still compares against what storage held before any of this.
    unsavedBase ??= persisted;
  }
  return summarize(next, at);
};

/*
 * Idempotent by hand rather than by call. Collapsing repeats here rather than
 * in the caller is what makes a reload safe: a completed discard restored
 * from its own URL renders exactly as a fresh one does, and no amount of care
 * in a component can tell the two apart.
 */
export const recordDiscardDecision = (
  decision: DiscardDecisionRecord,
): DiscardTallySummary =>
  extendStoredTally(decision.at, (tally) =>
    tally.records.some((record) => record.handKey === decision.handKey)
      ? tally
      : {
          ...tally,
          lifetime: addToLifetime(tally.lifetime, decision),
          records: [...tally.records, decision].slice(-MAX_RECORDS),
        },
  );

/*
 * A hand the player asked for and left without a discard. Recorded rather
 * than ignored so the averages stay honest about what they leave out: a
 * player who abandons the hands they find hard would otherwise show a better
 * average for having avoided them.
 */
export const recordSkippedHand = (at: number): DiscardTallySummary =>
  extendStoredTally(at, (tally) => ({
    ...tally,
    lifetime: {
      ...tally.lifetime,
      skippedHands: tally.lifetime.skippedHands + 1,
    },
    skipped: [...tally.skipped, { at }].slice(-MAX_RECORDS),
  }));

/*
 * Whether there is anything to show. Exported so the view and the layout that
 * places it read one rule: they diverged once, and the tally rendered into a
 * grid cell sized for something else.
 */
export const hasTallyToShow = (summary: DiscardTallySummary): boolean =>
  summary.decisions + summary.skippedHands > 0;

// Exported for the specs and stories that need a browser with no history.
export const clearDiscardTally = () => {
  forgetUnsaved();
  localStorage.removeItem(discardTallyKey);
};
