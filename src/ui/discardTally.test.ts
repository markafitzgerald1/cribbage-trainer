import {
  type DiscardDecisionRecord,
  type DiscardTallySummary,
  clearDiscardTally,
  discardTallyKey,
  readDiscardTally,
  recordDiscardDecision,
} from "./discardTally";
import { describe, expect, it, jest } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";

const EMPTY = {
  decisions: 0,
  meanExpectedPointsLoss: null,
  optimalDecisions: 0,
};

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
  at: 1_700_000_000_000,
  cribRole: CribRole.Dealer,
  expectedPointsLoss: 1.5,
  isOptimal: false,
  isPractice: false,
  ...overrides,
});

const storeRaw = (value: string) => {
  clearDiscardTally();
  localStorage.setItem(discardTallyKey, value);
};

const storeValue = (value: unknown) => {
  storeRaw(JSON.stringify(value));
};

const validRecord = decisionOf();

const storedRecords = (): readonly unknown[] =>
  (
    JSON.parse(localStorage.getItem(discardTallyKey) as string) as {
      records: readonly unknown[];
    }
  ).records;

const storedWith = (overrides: Record<string, unknown>) => ({
  lifetime: { decisions: 2, expectedPointsLossTotal: 3, optimalDecisions: 1 },
  records: [validRecord],
  version: 1,
  ...overrides,
});

// Absence is expressed by dropping the key, which is what a real earlier shape would look like.
const storedOmitting = (missing: string) =>
  Object.fromEntries(
    Object.entries(storedWith({})).filter(([key]) => key !== missing),
  );

describe("discard tally storage", () => {
  it("reads a browser with no history as empty", () => {
    clearDiscardTally();

    expect(readDiscardTally()).toStrictEqual(EMPTY);
  });

  it("records the first authentic decision", () => {
    clearDiscardTally();

    expect(recordDiscardDecision(decisionOf())).toStrictEqual({
      decisions: 1,
      meanExpectedPointsLoss: 1.5,
      optimalDecisions: 0,
    });
  });

  it("counts an optimal decision without adding to the loss", () => {
    clearDiscardTally();
    recordDiscardDecision(
      decisionOf({ expectedPointsLoss: 0, isOptimal: true }),
    );

    expect(readDiscardTally()).toStrictEqual({
      decisions: 1,
      meanExpectedPointsLoss: 0,
      optimalDecisions: 1,
    });
  });

  it("averages across decisions", () => {
    clearDiscardTally();
    recordDiscardDecision(decisionOf({ expectedPointsLoss: 1 }));

    expect(
      recordDiscardDecision(decisionOf({ expectedPointsLoss: 2 })),
    ).toStrictEqual({
      decisions: 2,
      meanExpectedPointsLoss: 1.5,
      optimalDecisions: 0,
    });
  });

  // Practice is kept as a record but must not move the headline, which is the point of separating them.
  it("keeps a practice decision out of the average", () => {
    clearDiscardTally();
    recordDiscardDecision(decisionOf({ expectedPointsLoss: 4 }));

    expect(
      recordDiscardDecision(
        decisionOf({ expectedPointsLoss: 99, isPractice: true }),
      ),
    ).toStrictEqual({
      decisions: 1,
      meanExpectedPointsLoss: 4,
      optimalDecisions: 0,
    });
  });

  it("reads back a tally written by an earlier session", () => {
    clearDiscardTally();
    recordDiscardDecision(decisionOf({ expectedPointsLoss: 2.5 }));

    expect(readDiscardTally().meanExpectedPointsLoss).toBe(2.5);
  });

  it.each([
    { name: "text that is not JSON", stored: "{" },
    { name: "a JSON null", stored: "null" },
    { name: "a bare number", stored: "7" },
  ])("forgets storage holding $name", ({ stored }) => {
    storeRaw(stored);

    expect(readDiscardTally()).toStrictEqual(EMPTY);
  });

  it.each([
    { name: "no version", stored: storedOmitting("version") },
    { name: "a non-numeric version", stored: storedWith({ version: "1" }) },
    // A newer build's tally is richer than this one can express, so it is read as empty rather than reduced.
    { name: "a newer version", stored: storedWith({ version: 2 }) },
  ])("forgets a tally with $name", ({ stored }) => {
    storeValue(stored);

    expect(readDiscardTally()).toStrictEqual(EMPTY);
  });

  it("accepts a tally from an older version", () => {
    storeValue(storedWith({ version: 0 }));

    expect(readDiscardTally().decisions).toBe(2);
  });

  it.each([
    { name: "absent", stored: storedOmitting("lifetime") },
    { name: "not an object", stored: storedWith({ lifetime: 3 }) },
    {
      name: "missing its count",
      stored: storedWith({
        lifetime: { expectedPointsLossTotal: 1, optimalDecisions: 1 },
      }),
    },
    {
      name: "missing its total",
      stored: storedWith({ lifetime: { decisions: 1, optimalDecisions: 1 } }),
    },
    {
      name: "missing its optimal count",
      stored: storedWith({
        lifetime: { decisions: 1, expectedPointsLossTotal: 1 },
      }),
    },
  ])("restarts counters that are $name", ({ stored }) => {
    storeValue(stored);

    expect(readDiscardTally()).toStrictEqual(EMPTY);
  });

  it("keeps counting onto a recovered tally", () => {
    storeValue(storedWith({}));

    expect(
      recordDiscardDecision(decisionOf({ expectedPointsLoss: 3 })),
    ).toStrictEqual({
      decisions: 3,
      meanExpectedPointsLoss: 2,
      optimalDecisions: 1,
    });
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
      storeValue(storedWith({ records }));

      expect(readDiscardTally().decisions).toBe(2);
    },
  );

  /*
   * The cap is what makes the redundant counters necessary: once records are
   * trimmed, an average recomputed from survivors would silently change.
   */
  it("keeps the average correct after records are trimmed", () => {
    clearDiscardTally();
    const overflowing = Array.from({ length: 2_010 }, () =>
      decisionOf({ expectedPointsLoss: 2 }),
    );
    let summary = readDiscardTally();
    for (const decision of overflowing) {
      summary = recordDiscardDecision(decision);
    }

    expect(summary).toStrictEqual({
      decisions: 2_010,
      meanExpectedPointsLoss: 2,
      optimalDecisions: 0,
    });
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
