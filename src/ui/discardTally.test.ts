import {
  AT,
  DAYS_EARLIER,
  EMPTY,
  asJson,
  decisionOf,
  junkValues,
  storeRaw,
  storedOmitting,
  storedRecords,
  storedWith,
  summaryOf,
  validRecord,
  withFailingWrite,
  withToday,
} from "./discardTally.test.common";
import {
  MAX_RECORDS,
  clearDiscardTally,
  discardTallyKey,
  readDiscardTally,
  readTallyForDisplay,
  recordDiscardDecision,
  recordSkippedHand,
} from "./discardTally";
import { describe, expect, it } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";

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
    { name: "a newer version", stored: asJson(storedWith({ version: 6 })) },
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
    const newer = asJson(storedWith({ version: 6 }));
    storeRaw(newer);
    record();

    expect(localStorage.getItem(discardTallyKey)).toBe(newer);
  });

  it("reports nothing while a newer version is present", () => {
    storeRaw(asJson(storedWith({ version: 6 })));

    expect(recordDiscardDecision(decisionOf())).toStrictEqual(EMPTY);
  });

  it("migrates a version-1 tally to current version on write", () => {
    storeRaw(asJson(storedWith({ version: 1 })));
    recordDiscardDecision(decisionOf({ handKey: "v1-migrated" }));

    expect(localStorage.getItem(discardTallyKey)).toContain('"version":5');
  });

  /*
   * A browser refusing writes must still accumulate within the session, or
   * its second hand replaces its first. This is also the case where the
   * pending copy is kept, since storage has not moved beneath it.
   */
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

  /*
   * A tab that could not write holds its hands in memory. If another tab
   * records meanwhile, that memory is a branch off a history that no longer
   * exists, and extending it would overwrite the other tab's work. The
   * pending hands are dropped instead: they cost this session its own
   * figures, where keeping them would cost the other tab everything.
   *
   * The second case is the one counting rows could not see. At the record
   * cap another tab adds a practice decision, which leaves the lifetime
   * totals alone and cannot lengthen a list already full, so only a revision
   * notices that storage moved at all.
   */
  it.each([
    { name: "another writer moved the tally", stored: storedWith({}) },
    {
      name: "a write it cannot otherwise see has happened",
      stored: storedWith({ revision: 9 }),
    },
  ])("drops pending hands when $name", ({ stored }) => {
    clearDiscardTally();
    withFailingWrite(() =>
      recordDiscardDecision(decisionOf({ handKey: "mine" })),
    );
    storeRaw(asJson(stored));

    expect(
      recordDiscardDecision(decisionOf({ handKey: "later" })).decisions,
    ).toBe(3);
  });

  it("accepts a tally from an older version and reads absent discardKey as null", () => {
    const v2Record = {
      at: AT - DAYS_EARLIER,
      cribRole: CribRole.Dealer,
      expectedPointsLoss: 1.5,
      handKey: "v2-record",
      isOptimal: false,
      isPractice: false,
    };
    const v3Null = { ...v2Record, discardKey: null, handKey: "v3-null" };
    const v3String = { ...v2Record, discardKey: "AH,2H", handKey: "v3-string" };
    const v3Corrupt = {
      ...v2Record,
      discardKey: "corrupt",
      handKey: "v3-corrupt",
    };
    const v3Three = {
      ...v2Record,
      discardKey: "AH,2H,3H",
      handKey: "v3-three",
    };
    storeRaw(
      asJson(
        storedWith({
          records: [v2Record, v3Null, v3String, v3Corrupt, v3Three],
          version: 2,
        }),
      ),
    );

    expect(readTallyForDisplay().records).toStrictEqual([
      { ...v2Record, discardKey: null, recencyAt: v2Record.at },
      { ...v3Null, recencyAt: v3Null.at + 1 },
      { ...v3String, recencyAt: v3String.at + 2 },
      { ...v3Corrupt, discardKey: null, recencyAt: v3Corrupt.at + 3 },
      { ...v3Three, discardKey: null, recencyAt: v3Three.at + 4 },
    ]);
  });

  it("accepts a v3 tally without practice field and migrates with empty practice list and version 5", () => {
    storeRaw(
      asJson({
        lifetime: {
          decisions: 1,
          expectedPointsLossTotal: 1.5,
          optimalDecisions: 0,
          skippedHands: 0,
        },
        records: [
          {
            at: AT,
            cribRole: CribRole.Dealer,
            discardKey: "5H,6H",
            expectedPointsLoss: 1.5,
            handKey: "5H,6H,7H,8H,9H,10H|Dealer",
            isOptimal: false,
            isPractice: false,
          },
        ],
        revision: 1,
        skipped: [],
        version: 3,
      }),
    );

    const tally = readTallyForDisplay();

    expect(tally.version).toBe(5);
    expect(tally.practice).toStrictEqual([]);
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
    {
      name: "holding an unrecognized role string",
      records: [{ ...validRecord, cribRole: "Bad" }],
    },
    {
      name: "holding an invalid discardKey type",
      records: [{ ...validRecord, discardKey: 123 }],
    },
  ])(
    "drops records that are $name while keeping the counters",
    ({ records }) => {
      storeRaw(asJson(storedWith({ records })));

      expect(readDiscardTally(AT).decisions).toBe(2);
    },
  );

  it("keeps the average correct after records are trimmed", () => {
    clearDiscardTally();
    const makeDecisions = (count: number, prefix: string) =>
      Array.from({ length: count }, (_, index) =>
        decisionOf({ expectedPointsLoss: 2, handKey: `${prefix}-${index}` }),
      );
    const initialRecords = makeDecisions(MAX_RECORDS, "initial");
    const initialLossTotal = MAX_RECORDS * 2;
    storeRaw(
      asJson(
        storedWith({
          lifetime: {
            decisions: MAX_RECORDS,
            expectedPointsLossTotal: initialLossTotal,
            optimalDecisions: 0,
            skippedHands: 0,
          },
          records: initialRecords,
        }),
      ),
    );
    const extraDecisions = 10;
    const overflowing = makeDecisions(extraDecisions, "extra");
    let summary = readDiscardTally(AT);
    for (const decision of overflowing) {
      summary = recordDiscardDecision(decision);
    }

    /*
     * Today is read from the records, which are capped, so it reports the
     * 20000 that survived rather than the 20010 the counters know about. A
     * single day past the cap is not a case any player reaches, and the
     * headline figure the counters carry stays exact either way.
     */
    expect(summary).toStrictEqual(
      withToday(summaryOf(MAX_RECORDS + extraDecisions, 2, 0), {
        decisions: MAX_RECORDS,
        mean: 2,
      }),
    );
    expect(storedRecords()).toHaveLength(MAX_RECORDS);
  });

  // A full or disabled store must cost the history, never the hand being played.
  it("still reports the decision when storage refuses the write", () => {
    clearDiscardTally();

    expect(
      withFailingWrite(() => recordDiscardDecision(decisionOf())).decisions,
    ).toBe(1);
  });
});
