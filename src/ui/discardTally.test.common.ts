import {
  type DiscardDecisionRecord,
  type DiscardTallySummary,
  clearDiscardTally,
  discardTallyKey,
} from "./discardTally";
import { CribRole } from "../game/expectedCribPoints";
import { jest } from "@jest/globals";

export const AT = 1_700_000_000_000;

/*
 * Every decision these tests record carries AT, so whatever counts toward the
 * lifetime figures counts toward today as well unless a case says otherwise.
 */
export const summaryOf = (
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
export const withToday = (
  summary: ReturnType<typeof summaryOf>,
  today: { readonly decisions: number; readonly mean: number | null },
) => ({
  ...summary,
  todayDecisions: today.decisions,
  todayMeanExpectedPointsLoss: today.mean,
  todayOptimalDecisions: 0,
});

export const EMPTY = summaryOf(0, null, 0);

// The spy is restored by this wrapper rather than by the test, so the test can still end on its assertion.
export const withFailingWrite = (
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

export const decisionOf = (
  overrides: Partial<DiscardDecisionRecord> = {},
): DiscardDecisionRecord => ({
  at: AT,
  cribRole: CribRole.Dealer,
  discardKey: "5H,6H",
  expectedPointsLoss: 1.5,
  handKey: "AH,2H,3H,4H,5H,6H",
  isOptimal: false,
  isPractice: false,
  ...overrides,
});

export const storeRaw = (value: string) => {
  clearDiscardTally();
  localStorage.setItem(discardTallyKey, value);
};

export const asJson = (value: unknown) => JSON.stringify(value);

/*
 * Dated well before AT, so a tally recovered from storage contributes to the
 * lifetime figures without also counting as today's play — which is what the
 * stored history of any returning player actually looks like.
 */
export const DAYS_EARLIER = 10 * 24 * 60 * 60 * 1_000;
export const validRecord = decisionOf({
  at: AT - DAYS_EARLIER,
  handKey: "earlier",
});

export const storedRecords = (): readonly unknown[] =>
  (
    JSON.parse(localStorage.getItem(discardTallyKey) as string) as {
      records: readonly unknown[];
    }
  ).records;

export const storedWith = (overrides: Record<string, unknown>) => ({
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
export const storedOmitting = (missing: string) =>
  Object.fromEntries(
    Object.entries(storedWith({})).filter(([key]) => key !== missing),
  );

/*
 * Values this build cannot read and may freely replace. Shared by the two
 * questions asked of them — that they read as empty, and that a later hand
 * can still be written over them — because listing each case twice is the
 * duplication those two tests would otherwise be.
 */
export const junkValues = () => [
  { name: "text that is not JSON", stored: "{" },
  { name: "a JSON null", stored: "null" },
  { name: "a bare number", stored: "7" },
  { name: "no version", stored: asJson(storedOmitting("version")) },
  {
    name: "a non-numeric version",
    stored: asJson(storedWith({ version: "1" })),
  },
];
