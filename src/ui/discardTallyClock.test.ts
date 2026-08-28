/* jscpd:ignore-start */
import { AT, decisionOf } from "./discardTally.test.common";
import {
  clearDiscardTally,
  readTallyForDisplay,
  recordDiscardDecision,
  recordPracticeAttempt,
} from "./discardTally";
import { describe, expect, it } from "@jest/globals";
/* jscpd:ignore-end */

const recordFutureSkewedDecision = (handKey: string) => {
  clearDiscardTally();
  recordDiscardDecision(decisionOf({ at: AT + 5000, handKey }));
};

const recordCorrectedDecision = (handKey: string) =>
  recordDiscardDecision(decisionOf({ at: AT, handKey }));

const getRecordedAt = (index: number) =>
  readTallyForDisplay().records[index]?.at;

describe("discard tally clock ordering", () => {
  it("orders an authentic decision after a corrected device clock", () => {
    recordFutureSkewedDecision("first");
    recordCorrectedDecision("second");

    expect([getRecordedAt(0), getRecordedAt(1)]).toStrictEqual([
      AT + 5000,
      AT + 5001,
    ]);
  });

  it("orders an authentic decision after a future-skewed practice attempt", () => {
    const practiceHandKey = "5H,6H,7H,8H,9H,10H|Dealer";
    recordFutureSkewedDecision(practiceHandKey);
    recordPracticeAttempt({
      at: AT,
      handKey: practiceHandKey,
      isOptimal: true,
    });
    recordCorrectedDecision("second");

    expect(getRecordedAt(1)).toBe(AT + 5002);
  });

  it("orders a practice attempt after a future-skewed authentic decision", () => {
    const handKey = "5H,6H,7H,8H,9H,10H|Dealer";
    recordFutureSkewedDecision(handKey);
    recordPracticeAttempt({ at: AT, handKey, isOptimal: true });

    expect(readTallyForDisplay().practice).toMatchObject([
      { lastAttemptAt: AT + 5001 },
    ]);
  });
});
