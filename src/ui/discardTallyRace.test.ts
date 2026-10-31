import {
  AT,
  EMPTY,
  asJson,
  decisionOf,
  firstStoredAdmission,
  noiseAdmission,
  noiseJudgedSuccess,
  storeRaw,
  withFailingWrite,
  withRefused,
} from "./discardTally.test.common";
import {
  type DiscardTallySummary,
  clearDiscardTally,
  discardTallyKey,
  readDiscardTally,
  readTallyForDisplay,
  recordDiscardDecision,
  recordPracticeAttempt,
  recordSkippedHand,
} from "./discardTally";
import { describe, expect, it, jest } from "@jest/globals";

const storedNow = () => localStorage.getItem(discardTallyKey);

// Captured before any spy, so another tab's commit still lands while this tab's writes are refused.
const realGet = Storage.prototype.getItem.bind(localStorage);
const realSet = Storage.prototype.setItem.bind(localStorage);

/*
 * Each other-tab value is built by really recording onto the one before, so
 * every interleaved commit is a tally a live tab could have written.
 */
const otherTabCommits = (
  base: string | null,
  writes: readonly (() => unknown)[],
): string[] => {
  const commits = writes.map((write) => {
    write();
    return storedNow() as string;
  });
  clearDiscardTally();
  if (base !== null) {
    storeRaw(base);
  }
  return commits;
};

/*
 * Another tab can only act between two storage calls, so its commit is placed
 * right after one of this tab's reads of the tally: the first commit follows
 * the first read, the second the second, and so on. An Error refuses that read
 * instead, and null lets it through untouched.
 */
const raceAgainst = (
  commits: readonly (string | Error | null)[],
  write: () => DiscardTallySummary,
): { readonly reads: number; readonly summary: DiscardTallySummary } => {
  let reads = 0;
  const getItem = jest
    .spyOn(Storage.prototype, "getItem")
    .mockImplementation((key: string) => {
      const value = realGet(key);
      if (key === discardTallyKey) {
        const commit = commits.at(reads);
        reads += 1;
        if (commit instanceof Error) {
          throw commit;
        }
        if (typeof commit === "string") {
          realSet(key, commit);
        }
      }
      return value;
    });
  try {
    const summary = write();
    return { reads, summary };
  } finally {
    getItem.mockRestore();
  }
};

const counts = () => {
  const { lifetime, practice, skipped } = readTallyForDisplay();
  return {
    decisions: lifetime.decisions,
    practice: practice.length,
    skipped: skipped.length,
  };
};

const storedHandKeys = () =>
  readTallyForDisplay().records.map(({ handKey }) => handKey);

const recordMine = () => recordDiscardDecision(decisionOf({ handKey: "mine" }));
const recordTheirs =
  (handKey = "theirs") =>
  () =>
    recordDiscardDecision(decisionOf({ handKey }));

describe("two tabs writing the tally at once", () => {
  it.each([
    {
      expected: { decisions: 2, practice: 0, skipped: 0 },
      name: "a decision racing a decision",
      theirs: recordTheirs(),
      write: recordMine,
    },
    {
      expected: { decisions: 1, practice: 1, skipped: 0 },
      name: "a practice attempt racing a decision",
      theirs: recordTheirs(),
      write: () => recordPracticeAttempt(noiseJudgedSuccess(1.5)),
    },
    {
      expected: { decisions: 0, practice: 0, skipped: 2 },
      name: "a skip racing a skip",
      theirs: () => recordSkippedHand(AT),
      write: () => recordSkippedHand(AT + 1),
    },
  ])("keeps both writes for $name", ({ expected, theirs, write }) => {
    clearDiscardTally();
    const { summary } = raceAgainst(otherTabCommits(null, [theirs]), write);

    expect({
      shown: [summary.decisions, summary.skippedHands],
      stored: counts(),
    }).toStrictEqual({
      shown: [expected.decisions, expected.skipped],
      stored: expected,
    });
  });

  it("notices a write by a build that keeps no revision count", () => {
    clearDiscardTally();
    recordTheirs("base")();
    const base = storedNow() as string;
    const [theirs] = otherTabCommits(base, [recordTheirs()]);
    const uncounted = asJson({
      ...(JSON.parse(theirs as string) as object),
      revision: (JSON.parse(base) as { revision: number }).revision,
    });
    raceAgainst([uncounted], recordMine);

    expect(storedHandKeys()).toStrictEqual(["base", "theirs", "mine"]);
  });

  it("keeps a refused write's hand when the re-read is refused too", () => {
    clearDiscardTally();
    recordTheirs("saved")();
    withFailingWrite(recordTheirs("unsaved"));
    const { summary } = raceAgainst([null, new Error("refused")], recordMine);

    expect({
      handKeys: storedHandKeys(),
      shown: summary.decisions,
    }).toStrictEqual({ handKeys: ["saved", "unsaved", "mine"], shown: 3 });
  });

  it("keeps the other tab's settlement rather than settling it again", () => {
    clearDiscardTally();
    const pending = decisionOf({ recordedAdmission: "pending" });
    recordDiscardDecision(pending);
    const commits = otherTabCommits(storedNow(), [
      () =>
        recordDiscardDecision({
          ...pending,
          recordedAdmission: noiseAdmission,
        }),
    ]);
    raceAgainst(commits, () =>
      recordDiscardDecision({
        ...pending,
        recordedAdmission: { basis: "exact-fallback-v1", eligible: true },
      }),
    );

    expect(firstStoredAdmission()).toStrictEqual(noiseAdmission);
  });

  it("leaves a newer build's tally alone when one lands mid-write", () => {
    clearDiscardTally();
    const newer = asJson({ records: [], revision: 3, version: 99 });
    raceAgainst([newer], recordMine);

    expect(storedNow()).toBe(newer);
  });

  // The fifth commit lands after the last read, inside the window this narrows rather than closes.
  it("gives up re-reading after five reads and writes onto the last one", () => {
    clearDiscardTally();
    const commits = otherTabCommits(
      null,
      ["one", "two", "three", "four", "five"].map((key) => recordTheirs(key)),
    );
    const { reads } = raceAgainst(commits, recordMine);

    expect({
      handKeys: storedHandKeys(),
      reads,
    }).toStrictEqual({
      handKeys: ["one", "two", "three", "four", "mine"],
      reads: 5,
    });
  });

  it("keeps a refused write's hand on top of the other tab's", () => {
    clearDiscardTally();
    const commits = otherTabCommits(null, [recordTheirs()]);
    withFailingWrite(() => raceAgainst(commits, recordMine).summary);

    expect(recordTheirs("later")().decisions).toBe(3);
  });

  it("still records the hand when storage refuses to be read", () => {
    clearDiscardTally();

    expect(withRefused("getItem", recordMine).decisions).toBe(1);
  });

  it("reads as empty when storage refuses to be read", () => {
    clearDiscardTally();
    recordMine();

    expect(withRefused("getItem", () => readDiscardTally(AT))).toStrictEqual(
      EMPTY,
    );
  });
});
