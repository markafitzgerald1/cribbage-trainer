import {
  AUG_10_2026,
  AUG_16_2026_SUNDAY,
  AUG_31_2026,
  EMPTY_TREND,
  ONE_DAY_MS,
  ONE_HOUR_MS,
  SEP_2_2026,
  TEST_AT,
  dealerDecision,
  poneDecision,
  runTrend,
  storedTallyOf,
  testDecisionOf,
} from "./discardQualityTrend.test.common";
import {
  MAX_RECORDS,
  clearDiscardTally,
  recordDiscardDecision,
  recordSkippedHand,
} from "./discardTally";
import {
  computeDiscardQualityTrend,
  readDiscardQualityTrend,
} from "./discardQualityTrend";
import { describe, expect, it } from "@jest/globals";

describe("discard quality trend computation", () => {
  it("returns empty trend when no records exist", () => {
    clearDiscardTally();
    const trend = readDiscardQualityTrend({
      granularity: "rolling20",
      now: TEST_AT,
    });

    expect(trend).toStrictEqual(EMPTY_TREND);
  });

  it("buckets decisions into rolling 20 batches with severity distribution", () => {
    const records = [
      testDecisionOf({
        at: TEST_AT,
        expectedPointsLoss: 0,
        handKey: "optimal-cut",
        isOptimal: true,
      }),
      testDecisionOf({
        at: TEST_AT + ONE_HOUR_MS,
        expectedPointsLoss: 0.2,
        handKey: "minor-cut",
      }),
      testDecisionOf({
        at: TEST_AT + 2 * ONE_HOUR_MS,
        expectedPointsLoss: 0.45,
        handKey: "medium-cut",
      }),
      testDecisionOf({
        at: TEST_AT + 3 * ONE_HOUR_MS,
        expectedPointsLoss: 0.85,
        handKey: "major-cut",
      }),
      testDecisionOf({
        at: TEST_AT + 4 * ONE_HOUR_MS,
        expectedPointsLoss: 1.75,
        handKey: "blunder-cut",
      }),
    ];

    const trend = runTrend(records, {
      granularity: "rolling20",
      now: TEST_AT,
    });
    const [bucket] = trend.buckets;

    expect(trend.totalAuthenticDecisions).toBe(5);
    expect(trend.buckets).toHaveLength(1);
    expect(bucket).toMatchObject({
      decisions: 5,
      key: "1-5",
      label: "Decisions 1–5",
      optimalDecisions: 1,
      severity: {
        halfToOne: 1,
        optimal: 1,
        overOne: 1,
        quarterToHalf: 1,
        upToQuarter: 1,
      },
    });
    expect(bucket?.meanExpectedPointsLoss).toBeCloseTo(0.65);
  });

  it("splits rolling batches when exceeding batch size", () => {
    const count = 25;
    const records = Array.from({ length: count }, (_, index) =>
      testDecisionOf({
        at: TEST_AT + index * ONE_HOUR_MS,
        expectedPointsLoss: 0.05,
        handKey: `batch-${index}`,
      }),
    );

    const trend = runTrend(records, {
      granularity: "rolling20",
      now: TEST_AT,
    });

    expect(trend.buckets).toHaveLength(2);
    expect(trend.buckets[0]?.label).toBe("Decisions 1–20");
    expect(trend.buckets[0]?.decisions).toBe(20);
    expect(trend.buckets[1]?.label).toBe("Decisions 21–25");
    expect(trend.buckets[1]?.decisions).toBe(5);
  });

  it("buckets decisions by calendar day and handles Today / Yesterday labels", () => {
    const today = TEST_AT;
    const yesterday = TEST_AT - ONE_DAY_MS;
    const pastDay = TEST_AT - 3 * ONE_DAY_MS;

    const records = [
      testDecisionOf({
        at: pastDay,
        expectedPointsLoss: 0.3,
        handKey: "d-past",
      }),
      testDecisionOf({
        at: yesterday,
        expectedPointsLoss: 0.1,
        handKey: "d-yest",
      }),
      testDecisionOf({
        at: today,
        expectedPointsLoss: 0,
        handKey: "d-today",
        isOptimal: true,
      }),
    ];

    const trend = runTrend(records, {
      granularity: "day",
      now: today,
    });

    expect(trend.buckets).toHaveLength(3);
    expect(trend.buckets[1]?.label).toBe("Yesterday");
    expect(trend.buckets[2]?.label).toBe("Today");
    expect(trend.buckets[2]?.meanExpectedPointsLoss).toBe(0);
  });

  it("buckets decisions by calendar week including cross-month spans", () => {
    const records = [
      testDecisionOf({
        at: AUG_10_2026,
        expectedPointsLoss: 0.1,
        handKey: "week-ten",
      }),
      testDecisionOf({
        at: AUG_31_2026,
        expectedPointsLoss: 0.2,
        handKey: "week-late",
      }),
      testDecisionOf({
        at: SEP_2_2026,
        expectedPointsLoss: 0.4,
        handKey: "week-next",
      }),
    ];

    const weekTrend = runTrend(records, {
      granularity: "week",
      now: SEP_2_2026,
    });

    expect(weekTrend.buckets).toHaveLength(2);
    expect(weekTrend.buckets[0]?.label).toContain("Aug 10–16, 2026");
    expect(weekTrend.buckets[1]?.label).toContain("Aug 31 – Sep 6, 2026");
  });

  it("buckets decisions by calendar month", () => {
    const records = [
      testDecisionOf({
        at: AUG_10_2026,
        expectedPointsLoss: 0.2,
        handKey: "month-first",
      }),
      testDecisionOf({
        at: SEP_2_2026,
        expectedPointsLoss: 0.4,
        handKey: "month-second",
      }),
    ];

    const monthTrend = runTrend(records, {
      granularity: "month",
      now: SEP_2_2026,
    });

    expect(monthTrend.buckets).toHaveLength(2);
    expect(monthTrend.buckets[0]?.meanExpectedPointsLoss).toBe(0.2);
    expect(monthTrend.buckets[1]?.meanExpectedPointsLoss).toBe(0.4);
  });

  it("handles periods with skipped hands and no decisions", () => {
    const skippedDay = TEST_AT - 5 * ONE_DAY_MS;
    const skipped = [{ at: skippedDay }];

    const trend = runTrend([], { granularity: "day", now: TEST_AT }, skipped);

    expect(trend.buckets).toHaveLength(1);
    expect(trend.buckets[0]?.decisions).toBe(0);
    expect(trend.buckets[0]?.meanExpectedPointsLoss).toBeNull();
    expect(trend.buckets[0]?.skippedHands).toBe(1);
  });

  it("filters by dealer and pone roles in rolling views", () => {
    const records = [
      dealerDecision(0.5, TEST_AT, "deal-role"),
      poneDecision(0.1, TEST_AT + ONE_HOUR_MS, "pone-role"),
    ];

    const dealerRolling = runTrend(records, {
      granularity: "rolling20",
      roleFilter: "dealer",
    });
    const poneRolling = runTrend(records, {
      granularity: "rolling20",
      roleFilter: "pone",
    });

    expect(dealerRolling.totalAuthenticDecisions).toBe(1);
    expect(dealerRolling.buckets[0]?.meanExpectedPointsLoss).toBe(0.5);
    expect(poneRolling.totalAuthenticDecisions).toBe(1);
    expect(poneRolling.buckets[0]?.meanExpectedPointsLoss).toBe(0.1);
  });

  it("filters by role in calendar day views", () => {
    const records = [dealerDecision(0.5, TEST_AT, "cal-dealer")];

    const dealerDay = runTrend(
      records,
      { granularity: "day", now: TEST_AT, roleFilter: "dealer" },
      [{ at: TEST_AT }],
    );

    expect(dealerDay.totalAuthenticDecisions).toBe(1);
    expect(dealerDay.totalSkippedHands).toBe(0);
    expect(dealerDay.buckets[0]?.skippedHands).toBe(0);
  });

  it("handles weekend dates correctly when computing start of week", () => {
    const weekendRecords = [
      testDecisionOf({
        at: AUG_16_2026_SUNDAY,
        expectedPointsLoss: 0.2,
        handKey: "weekend-lead",
      }),
    ];
    const weekendTrend = computeDiscardQualityTrend(
      storedTallyOf(weekendRecords),
      { granularity: "week", now: AUG_16_2026_SUNDAY },
    );

    expect(weekendTrend.buckets).toHaveLength(1);
    expect(weekendTrend.buckets[0]?.label).toContain("Aug 10–16, 2026");
  });

  it("excludes practice decisions from trend calculations", () => {
    const records = [
      testDecisionOf({
        at: TEST_AT,
        expectedPointsLoss: 0.2,
        handKey: "rated-live",
      }),
      testDecisionOf({
        at: TEST_AT + 2 * ONE_HOUR_MS,
        expectedPointsLoss: 4.25,
        handKey: "practice-only",
        isPractice: true,
      }),
    ];
    const practiceTrend = runTrend(records, {
      granularity: "rolling50",
      roleFilter: "all",
    });

    expect(practiceTrend.totalAuthenticDecisions).toBe(1);
    expect(practiceTrend.buckets[0]?.meanExpectedPointsLoss).toBe(0.2);
  });

  it("associates skipped hands with time buckets", () => {
    const scoredRecords = [
      testDecisionOf({
        at: TEST_AT,
        expectedPointsLoss: 0.35,
        handKey: "skip-hand",
      }),
    ];
    const skippedEntries = [{ at: TEST_AT + 60_000 }];
    const skipTrend = computeDiscardQualityTrend(
      storedTallyOf(scoredRecords, skippedEntries),
      { granularity: "day", now: TEST_AT },
    );
    const [dayBucket] = skipTrend.buckets;

    expect(skipTrend.totalSkippedHands).toBe(1);
    expect(dayBucket?.skippedHands).toBe(1);
  });

  /* jscpd:ignore-start */
  it("assigns leading, boundary, and trailing skips to rolling buckets", () => {
    const records = Array.from({ length: 21 }, (_, index) =>
      testDecisionOf({
        at: 1000 + index * 1000,
        handKey: `decision-${index}`,
      }),
    );
    const skipped = [
      { at: 500 },
      { at: 20_000 },
      { at: 21_000 },
      { at: 30_000 },
    ];

    const trend = runTrend(records, { granularity: "rolling20" }, skipped);

    expect(trend.buckets).toHaveLength(2);
    expect(trend.buckets[0]?.skippedHands).toBe(2);
    expect(trend.buckets[1]?.skippedHands).toBe(2);
    expect(trend.totalSkippedHands).toBe(4);
  });

  it("identifies when storage reaches record cap or has truncated lifetime history", () => {
    const fullRecords = Array.from({ length: MAX_RECORDS }, (_, index) =>
      testDecisionOf({
        at: TEST_AT + index,
        expectedPointsLoss: 0.2,
        handKey: `full-${index}`,
      }),
    );

    const trend = computeDiscardQualityTrend(storedTallyOf(fullRecords), {
      granularity: "rolling50",
      now: TEST_AT,
    });

    expect(trend.isAtRecordCap).toBe(true);

    const tallyWithRolledOffDecisions = {
      lifetime: {
        decisions: 20005,
        expectedPointsLossTotal: 4000,
        optimalDecisions: 10000,
        skippedHands: 0,
      },
      records: [
        testDecisionOf({
          at: TEST_AT,
          expectedPointsLoss: 0.2,
          handKey: "d1",
        }),
      ],
      revision: 1,
      skipped: [],
      version: 1,
    };

    expect(
      computeDiscardQualityTrend(tallyWithRolledOffDecisions, {
        granularity: "rolling20",
      }).isAtRecordCap,
    ).toBe(true);

    const tallyWithRolledOffSkips = {
      lifetime: {
        decisions: 1,
        expectedPointsLossTotal: 0,
        optimalDecisions: 1,
        skippedHands: 20005,
      },
      records: [
        testDecisionOf({
          at: TEST_AT,
          expectedPointsLoss: 0,
          handKey: "d1",
        }),
      ],
      revision: 1,
      skipped: [],
      version: 1,
    };

    expect(
      computeDiscardQualityTrend(tallyWithRolledOffSkips, {
        granularity: "rolling20",
      }).isAtRecordCap,
    ).toBe(true);
  });
  /* jscpd:ignore-end */

  it("reads trend directly from storage helper", () => {
    clearDiscardTally();
    recordDiscardDecision(
      testDecisionOf({ expectedPointsLoss: 0.25, handKey: "stored-live" }),
    );
    recordSkippedHand(TEST_AT + ONE_HOUR_MS);

    const trend = readDiscardQualityTrend({
      granularity: "rolling50",
      now: TEST_AT + ONE_DAY_MS,
    });

    expect(trend.totalAuthenticDecisions).toBe(1);
    expect(trend.totalSkippedHands).toBe(1);
  });
});
