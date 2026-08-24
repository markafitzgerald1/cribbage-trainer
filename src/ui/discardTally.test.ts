import {
  type DiscardDecisionRecord,
  type DiscardTallySummary,
  clearDiscardTally,
  discardTallyKey,
  readDiscardTally,
  recordDiscardDecision,
  recordSkippedHand,
} from "./discardTally";
import { describe, expect, it, jest } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";

const AT = 1_700_000_000_000;

/*
 * Every decision these tests record carries AT, so whatever counts toward the
 * lifetime figures counts toward today as well unless a case says otherwise.
 */
const summaryOf = (
  decisions: number,
  meanExpectedPointsLoss: number | null,
  optimalDecisions: number,
) => ({
  decisions,
  meanExpectedPointsLoss,
  optimalDecisions,
  skippedHands: 0,
  todayDecisions: decisions,
  todayMeanExpectedPointsLoss: meanExpectedPointsLoss,
  todayOptimalDecisions: optimalDecisions,
  todaySkippedHands: 0,
});

// For the cases where today and the lifetime figures genuinely differ.
const withToday = (
  summary: ReturnType<typeof summaryOf>,
  today: { readonly decisions: number; readonly mean: number | null },
) => ({
  ...summary,
  todayDecisions: today.decisions,
  todayMeanExpectedPointsLoss: today.mean,
  todayOptimalDecisions: 0,
});

const EMPTY = summaryOf(0, null, 0);

// The spy is restored by this wrapper rather than by the test, so the test can still end on its assertion.
const withFailingWrite = (
  run: () => DiscardTallySummary,
): DiscardTallySummary => {
  const setItem = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("quota");
    });
  try {
    return run();
  } finally {
    setItem.mockRestore();
  }
};

const decisionOf = (
  overrides: Partial<DiscardDecisionRecord> = {},
): DiscardDecisionRecord => ({
  at: AT,
  cribRole: CribRole.Dealer,
  expectedPointsLoss: 1.5,
  handKey: "AH,2H,3H,4H,5H,6H",
  isOptimal: false,
  isPractice: false,
  ...overrides,
});

const storeRaw = (value: string) => {
  clearDiscardTally();
  localStorage.setItem(discardTallyKey, value);
};

const asJson = (value: unknown) => JSON.stringify(value);

/*
 * Dated well before AT, so a tally recovered from storage contributes to the
 * lifetime figures without also counting as today's play — which is what the
 * stored history of any returning player actually looks like.
 */
const DAYS_EARLIER = 10 * 24 * 60 * 60 * 1_000;
const validRecord = decisionOf({ at: AT - DAYS_EARLIER, handKey: "earlier" });

const storedRecords = (): readonly unknown[] =>
  (
    JSON.parse(localStorage.getItem(discardTallyKey) as string) as {
      records: readonly unknown[];
    }
  ).records;

const storedWith = (overrides: Record<string, unknown>) => ({
  lifetime: {
    decisions: 2,
    expectedPointsLossTotal: 3,
    optimalDecisions: 1,
    skippedHands: 0,
  },
  records: [validRecord],
  version: 1,
  ...overrides,
});

// Absence is expressed by dropping the key, which is what a real earlier shape would look like.
const storedOmitting = (missing: string) =>
  Object.fromEntries(
    Object.entries(storedWith({})).filter(([key]) => key !== missing),
  );

/*
 * Values this build cannot read and may freely replace. Shared by the two
 * questions asked of them — that they read as empty, and that a later hand
 * can still be written over them — because listing each case twice is the
 * duplication those two tests would otherwise be.
 */
const junkValues = () => [
  { name: "text that is not JSON", stored: "{" },
  { name: "a JSON null", stored: "null" },
  { name: "a bare number", stored: "7" },
  { name: "no version", stored: asJson(storedOmitting("version")) },
  {
    name: "a non-numeric version",
    stored: asJson(storedWith({ version: "1" })),
  },
];

describe("discard tally storage", () => {
  it("reads a browser with no history as empty", () => {
    clearDiscardTally();

    expect(readDiscardTally(AT)).toStrictEqual(EMPTY);
  });

  it("records the first authentic decision", () => {
    clearDiscardTally();

    expect(recordDiscardDecision(decisionOf())).toStrictEqual(
      summaryOf(1, 1.5, 0),
    );
  });

  it("counts an optimal decision without adding to the loss", () => {
    clearDiscardTally();
    recordDiscardDecision(
      decisionOf({ expectedPointsLoss: 0, isOptimal: true }),
    );

    expect(readDiscardTally(AT)).toStrictEqual(summaryOf(1, 0, 1));
  });

  it("averages across decisions", () => {
    clearDiscardTally();
    recordDiscardDecision(
      decisionOf({ expectedPointsLoss: 1, handKey: "first" }),
    );

    expect(
      recordDiscardDecision(
        decisionOf({ expectedPointsLoss: 2, handKey: "second" }),
      ),
    ).toStrictEqual(summaryOf(2, 1.5, 0));
  });

  // Practice is kept as a record but must not move the headline, which is the point of separating them.
  it("keeps a practice decision out of the average", () => {
    clearDiscardTally();
    recordDiscardDecision(
      decisionOf({ expectedPointsLoss: 4, handKey: "played" }),
    );

    expect(
      recordDiscardDecision(
        decisionOf({
          expectedPointsLoss: 99,
          handKey: "studied",
          isPractice: true,
        }),
      ),
    ).toStrictEqual(summaryOf(1, 4, 0));
  });

  /*
   * Back, Forward, a re-sort and a reload all re-render a completed discard.
   * Each arrives as the same hand and must move the tally exactly once.
   */
  it("counts a hand's decision once however often it is re-reported", () => {
    clearDiscardTally();
    recordDiscardDecision(decisionOf({ expectedPointsLoss: 3 }));

    expect(
      recordDiscardDecision(decisionOf({ expectedPointsLoss: 3 })),
    ).toStrictEqual(summaryOf(1, 3, 0));
  });

  // A second discard from the same hand is chosen after reading the ranked table, so it is not a fresh instinct.
  it("ignores a changed mind about the same hand", () => {
    clearDiscardTally();
    recordDiscardDecision(decisionOf({ expectedPointsLoss: 5 }));

    expect(
      recordDiscardDecision(
        decisionOf({ expectedPointsLoss: 0, isOptimal: true }),
      ).meanExpectedPointsLoss,
    ).toBe(5);
  });

  it("reads back a tally written by an earlier session", () => {
    clearDiscardTally();
    recordDiscardDecision(decisionOf({ expectedPointsLoss: 2.5 }));

    expect(readDiscardTally(AT).meanExpectedPointsLoss).toBe(2.5);
  });
});

/*
 * What the store does with values it did not write: damaged, foreign, or
 * simply older. Split from the recording tests above because the describe
 * grew past the statement cap, and because these ask a different question.
 */
describe("discard tally recovery", () => {
  /*
   * One table rather than three: every case here is storage this build
   * cannot trust, and all of them must read as an empty tally rather than
   * throw or half-load. Splitting them by cause produced identical bodies,
   * which is duplication by any measure that matters.
   */
  it.each([
    ...junkValues(),
    // A newer build's tally is richer than this one can express, so it is read as empty rather than reduced.
    { name: "a newer version", stored: asJson(storedWith({ version: 2 })) },
    { name: "no counters", stored: asJson(storedOmitting("lifetime")) },
    {
      name: "counters that are not an object",
      stored: asJson(storedWith({ lifetime: 3 })),
    },
    {
      name: "counters missing their count",
      stored: asJson(
        storedWith({
          lifetime: { expectedPointsLossTotal: 1, optimalDecisions: 1 },
        }),
      ),
    },
    {
      name: "counters missing their total",
      stored: asJson(
        storedWith({ lifetime: { decisions: 1, optimalDecisions: 1 } }),
      ),
    },
    {
      name: "counters missing their optimal count",
      stored: asJson(
        storedWith({ lifetime: { decisions: 1, expectedPointsLossTotal: 1 } }),
      ),
    },
  ])("reads $name as an empty tally", ({ stored }) => {
    storeRaw(stored);

    expect(readDiscardTally(AT)).toStrictEqual(EMPTY);
  });

  /*
   * The forward-version protection has to cover writes as well as reads.
   * Reading a newer tally as empty and then recording over it would erase a
   * richer history for one decision, which is worse than showing nothing.
   */
  it.each([
    { name: "a decision", record: () => recordDiscardDecision(decisionOf()) },
    { name: "a skipped hand", record: () => recordSkippedHand(AT) },
  ])("refuses to record $name over a newer version", ({ record }) => {
    const newer = asJson(storedWith({ version: 2 }));
    storeRaw(newer);
    record();

    expect(localStorage.getItem(discardTallyKey)).toBe(newer);
  });

  it("reports nothing while a newer version is present", () => {
    storeRaw(asJson(storedWith({ version: 2 })));

    expect(recordDiscardDecision(decisionOf())).toStrictEqual(EMPTY);
  });

  // A browser refusing writes must still accumulate within the session, or its second hand replaces its first.
  it("keeps accumulating after a write is refused", () => {
    clearDiscardTally();
    const summary = withFailingWrite(() => {
      recordDiscardDecision(decisionOf({ handKey: "first" }));
      return recordDiscardDecision(decisionOf({ handKey: "second" }));
    });

    expect(summary.decisions).toBe(2);
  });

  it("returns to stored history once writing works again", () => {
    clearDiscardTally();
    withFailingWrite(() =>
      recordDiscardDecision(decisionOf({ handKey: "lost" })),
    );

    expect(
      recordDiscardDecision(decisionOf({ handKey: "kept" })).decisions,
    ).toBe(2);
  });

  /*
   * Write protection is for a richer history, not for junk. Refusing to write
   * over anything unreadable would leave the tally empty and refusing every
   * record until storage was cleared by hand, which is worse than the
   * overwrite the protection exists to prevent.
   */
  it.each(junkValues())("records over storage holding $name", ({ stored }) => {
    storeRaw(stored);

    expect(recordDiscardDecision(decisionOf()).decisions).toBe(1);
  });

  /*
   * A hand abandoned rather than played. It cannot enter the averages, since
   * nothing scored it, but it has to be visible or the averages flatter a
   * player for avoiding the hands they find hard.
   */
  it("counts a skipped hand without moving the averages", () => {
    clearDiscardTally();
    recordDiscardDecision(decisionOf());

    expect(recordSkippedHand(AT)).toStrictEqual({
      ...summaryOf(1, 1.5, 0),
      skippedHands: 1,
      todaySkippedHands: 1,
    });
  });

  // A tally written before skips were counted is history worth keeping, not a shape to discard.
  it("starts counting skips on a tally that predates them", () => {
    storeRaw(
      asJson(
        storedWith({
          lifetime: {
            decisions: 2,
            expectedPointsLossTotal: 3,
            optimalDecisions: 1,
          },
        }),
      ),
    );

    expect(recordSkippedHand(AT)).toStrictEqual({
      ...summaryOf(2, 1.5, 1),
      skippedHands: 1,
      todayDecisions: 0,
      todayMeanExpectedPointsLoss: null,
      todayOptimalDecisions: 0,
      todaySkippedHands: 1,
    });
  });

  it("drops skip entries it cannot read while keeping the count", () => {
    storeRaw(asJson(storedWith({ skipped: [{ at: "soon" }, 4] })));

    expect(readDiscardTally(AT).todaySkippedHands).toBe(0);
  });

  it("keeps a skip in the session when the write is refused", () => {
    clearDiscardTally();

    expect(withFailingWrite(() => recordSkippedHand(AT)).skippedHands).toBe(1);
  });

  it("accepts a tally from an older version", () => {
    storeRaw(asJson(storedWith({ version: 0 })));

    expect(readDiscardTally(AT).decisions).toBe(2);
  });

  it("keeps counting onto a recovered tally", () => {
    storeRaw(asJson(storedWith({})));

    expect(
      recordDiscardDecision(
        decisionOf({ expectedPointsLoss: 3, handKey: "another" }),
      ),
      // Two decisions came from storage and predate today; only the new one is today's.
    ).toStrictEqual(withToday(summaryOf(3, 2, 1), { decisions: 1, mean: 3 }));
  });

  it.each([
    { name: "not an array", records: 5 },
    { name: "holding a non-object", records: [1] },
    { name: "missing at", records: [{ ...validRecord, at: "now" }] },
    {
      name: "missing a loss",
      records: [{ ...validRecord, expectedPointsLoss: null }],
    },
    {
      name: "missing its optimal flag",
      records: [{ ...validRecord, isOptimal: 1 }],
    },
    {
      name: "missing its practice flag",
      records: [{ ...validRecord, isPractice: "no" }],
    },
    { name: "missing a role", records: [{ ...validRecord, cribRole: 3 }] },
  ])(
    "drops records that are $name while keeping the counters",
    ({ records }) => {
      storeRaw(asJson(storedWith({ records })));

      expect(readDiscardTally(AT).decisions).toBe(2);
    },
  );

  /*
   * The cap is what makes the redundant counters necessary: once records are
   * trimmed, an average recomputed from survivors would silently change.
   */
  it("keeps the average correct after records are trimmed", () => {
    clearDiscardTally();
    // Indices come from the iterator so no unused element parameter is declared.
    const overflowing = [...Array(2_010).keys()].map((index) =>
      decisionOf({ expectedPointsLoss: 2, handKey: `hand-${index}` }),
    );
    let summary = readDiscardTally(AT);
    for (const decision of overflowing) {
      summary = recordDiscardDecision(decision);
    }

    /*
     * Today is read from the records, which are capped, so it reports the
     * 2000 that survived rather than the 2010 the counters know about. A
     * single day past the cap is not a case any player reaches, and the
     * headline figure the counters carry stays exact either way.
     */
    expect(summary).toStrictEqual(
      withToday(summaryOf(2_010, 2, 0), { decisions: 2_000, mean: 2 }),
    );
    expect(storedRecords()).toHaveLength(2_000);
  });

  // A full or disabled store must cost the history, never the hand being played.
  it("still reports the decision when storage refuses the write", () => {
    clearDiscardTally();

    expect(
      withFailingWrite(() => recordDiscardDecision(decisionOf())).decisions,
    ).toBe(1);
  });
});
